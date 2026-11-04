import QueryStream from 'pg-query-stream';
import { pool } from '../../config/db.config.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../utils/errorHandler.js';
import { CSV_BOM, csvRow } from '../../utils/csv.js';
import { ReportModel } from './report.model.js';

// REQ-F-064: the download must start within 5 s. Only the wait for the first row is
// limited; both queries aggregate or sort, so Postgres has done the work by then and a
// timeout still gets a JSON error instead of a truncated file.
const FIRST_ROW_TIMEOUT_MS = 5000;
// Backstop so a stalled download can't hold a connection forever.
const STATEMENT_TIMEOUT_MS = 120000;
const QUERY_CANCELED = '57014';

function tooSlow() {
  return new AppError(503, 'The report took too long to generate. Narrow the date range and try again.');
}

// Resolves on 'drain', or on 'close' if the client goes away mid-download.
function writable(res) {
  return new Promise((resolve) => {
    const done = () => {
      res.off('drain', done);
      res.off('close', done);
      resolve();
    };
    res.on('drain', done);
    res.on('close', done);
  });
}

async function streamCsv(res, { sql, columns, params, filename }) {
  const client = await pool.connect();
  let broken = false;
  let timedOut = false;
  // At the deadline the caller gets the 503 straight away; cancelling the query needs a
  // second connection (seconds on a remote DB), so that finishes in the background.
  let rejectDeadline;
  const deadline = new Promise((_, reject) => {
    rejectDeadline = reject;
  });
  const timer = setTimeout(() => {
    timedOut = true;
    rejectDeadline(tooSlow());
    pool
      .query('SELECT pg_cancel_backend($1)', [client.processID])
      .catch((err) => logger.warn({ err }, 'Could not cancel slow report query'));
  }, FIRST_ROW_TIMEOUT_MS);

  const start = () => {
    if (res.headersSent) return;
    clearTimeout(timer);
    res.status(200).set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store'
    });
    res.write(CSV_BOM + csvRow(columns));
  };

  const work = (async () => {
    try {
      await client.query('BEGIN READ ONLY');
      await client.query(`SET LOCAL statement_timeout = ${STATEMENT_TIMEOUT_MS}`);
      await client.query("SET LOCAL TIME ZONE 'UTC'");

      const rows = client.query(new QueryStream(sql, params, { batchSize: 500 }));
      for await (const row of rows) {
        // After a timeout the error response owns res; never write CSV into it.
        if (res.destroyed || timedOut) {
          broken = true;
          break;
        }
        start();
        if (!res.write(csvRow(columns.map((c) => row[c])))) await writable(res);
      }
      if (!broken && !timedOut) {
        start(); // no rows: header-only CSV (UC-006.AC.1)
        res.end();
        await client.query('COMMIT');
      }
    } catch (err) {
      broken = true;
      throw timedOut && err.code === QUERY_CANCELED ? tooSlow() : err;
    } finally {
      clearTimeout(timer);
      // Don't return a connection left mid-cursor or mid-transaction to the pool.
      client.release(broken || timedOut || undefined);
    }
  })();
  // Whichever loses the race settles unobserved.
  work.catch(() => {});
  deadline.catch(() => {});
  return Promise.race([work, deadline]);
}

export const ReportService = {
  dailyActivity(res, date) {
    return streamCsv(res, { ...ReportModel.dailyActivity, params: [date], filename: `daily-activity-${date}.csv` });
  },

  alertHistory(res, from, to) {
    return streamCsv(res, {
      ...ReportModel.alertHistory,
      params: [from, to],
      filename: `alert-history-${from}_to_${to}.csv`
    });
  }
};
