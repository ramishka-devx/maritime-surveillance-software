import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import net from 'node:net';

function canConnect(host, port, timeoutMs = 250) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;

    const finish = (ok) => {
      if (done) return;
      done = true;
      try {
        socket.destroy();
      } catch {
        // ignore
      }
      resolve(ok);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));

    socket.connect(port, host);
  });
}

async function resolveTarget(port) {
  if (await canConnect('127.0.0.1', port)) return `http://127.0.0.1:${port}`;
  if (await canConnect('::1', port)) return `http://[::1]:${port}`;
  return null;
}

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  let target = env.VITE_API_PROXY_TARGET;
  if (!target) {
    // Prefer 5000, but our API auto-falls back to 5001 if 5000 is busy.
    // Use an explicit host so Windows IPv6/IPv4 localhost resolution doesn't cause ECONNREFUSED.
    target = (await resolveTarget(5000)) || (await resolveTarget(5001)) || 'http://127.0.0.1:5000';
  }

  const primary = target;
  const fallback = primary.includes(':5000')
    ? primary.replace(':5000', ':5001')
    : primary.replace(':5001', ':5000');
  let currentTarget = primary;

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: currentTarget,
          changeOrigin: true,
          configure(proxy, options) {
            proxy.on('error', (err, req, res) => {
              if (err && err.code === 'ECONNREFUSED') {
                currentTarget = currentTarget === primary ? fallback : primary;
                options.target = currentTarget;
                try {
                  // eslint-disable-next-line no-console
                  console.warn(`[vite proxy] ECONNREFUSED, switching target to ${currentTarget}`);
                } catch {
                  // ignore
                }
              }

              if (res && !res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
              }
              if (res && !res.writableEnded) {
                res.end(JSON.stringify({ error: 'API proxy connection failed. Is the API running?' }));
              }
            });
          },
        },
      },
    },
  };
})
