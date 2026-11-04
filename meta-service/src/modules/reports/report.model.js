// Report queries run through ReportService's streaming client, not the db.config.js shim,
// so they use native $n placeholders. The session time zone is UTC, so ::date bounds and
// to_char() below are UTC days and UTC timestamps.

const ISO_UTC = `'YYYY-MM-DD"T"HH24:MI:SS"Z"'`;

export const ReportModel = {
  // One row per vessel seen that UTC day. The time_utc bounds hit exactly one daily
  // partition of ais_positions.
  dailyActivity: {
    columns: [
      'mmsi',
      'ship_name',
      'ship_type',
      'position_count',
      'min_sog',
      'max_sog',
      'first_seen_at',
      'first_lat',
      'first_lon',
      'last_seen_at',
      'last_lat',
      'last_lon'
    ],
    sql: `
      WITH day AS (
        SELECT
          mmsi,
          count(*) AS position_count,
          min(sog) AS min_sog,
          max(sog) AS max_sog,
          min(time_utc) AS first_seen_at,
          (array_agg(lat ORDER BY time_utc))[1] AS first_lat,
          (array_agg(lon ORDER BY time_utc))[1] AS first_lon,
          max(time_utc) AS last_seen_at,
          (array_agg(lat ORDER BY time_utc DESC))[1] AS last_lat,
          (array_agg(lon ORDER BY time_utc DESC))[1] AS last_lon
        FROM ais_positions
        WHERE time_utc >= $1::date AND time_utc < $1::date + 1
        GROUP BY mmsi
      )
      SELECT
        d.mmsi,
        s.ship_name,
        st.description AS ship_type,
        d.position_count,
        d.min_sog,
        d.max_sog,
        to_char(d.first_seen_at, ${ISO_UTC}) AS first_seen_at,
        d.first_lat,
        d.first_lon,
        to_char(d.last_seen_at, ${ISO_UTC}) AS last_seen_at,
        d.last_lat,
        d.last_lon
      FROM day d
      LEFT JOIN ships s ON s.mmsi = d.mmsi
      LEFT JOIN ship_types st ON st.ship_type_id = s.ship_type
      ORDER BY d.mmsi
    `
  },

  // One row per alert raised in [from, to] (inclusive UTC days), optionally only the given
  // types / severities / statuses ($3-$5, null = all). Acknowledgement comes from
  // the latest status event that moved the alert to 'acknowledged'. confidence_score is the
  // anomaly score of model-based alerts (empty for geofence, loitering and manual alerts).
  alertHistory: {
    columns: [
      'alert_id',
      'alert_type',
      'mmsi',
      'vessel_name',
      'detected_at',
      'severity',
      'confidence_score',
      'status',
      'acknowledged_by',
      'acknowledged_at'
    ],
    sql: `
      SELECT
        a.alert_id,
        a.type AS alert_type,
        COALESCE(a.mmsi::text, v.mmsi) AS mmsi,
        COALESCE(s.ship_name, v.name) AS vessel_name,
        to_char(a.created_at, ${ISO_UTC}) AS detected_at,
        a.severity,
        a.confidence_score,
        a.status,
        ack.acknowledged_by,
        to_char(ack.at, ${ISO_UTC}) AS acknowledged_at
      FROM alerts a
      LEFT JOIN ships s ON s.mmsi = a.mmsi
      LEFT JOIN vessels v ON v.vessel_id = a.vessel_id
      LEFT JOIN LATERAL (
        SELECT
          e.at,
          COALESCE(NULLIF(trim(concat_ws(' ', u.first_name, u.last_name)), ''), u.username) AS acknowledged_by
        FROM alert_events e
        LEFT JOIN users u ON u.user_id = e.actor_id
        WHERE e.alert_id = a.alert_id AND e.kind = 'status' AND e.data->>'to' = 'acknowledged'
        ORDER BY e.at DESC
        LIMIT 1
      ) ack ON true
      WHERE a.created_at >= $1::date AND a.created_at < $2::date + 1
        AND ($3::text[] IS NULL OR a.type = ANY($3::text[]))
        AND ($4::text[] IS NULL OR a.severity = ANY($4::text[]))
        AND ($5::text[] IS NULL OR a.status = ANY($5::text[]))
      ORDER BY a.created_at, a.alert_id
    `
  }
};
