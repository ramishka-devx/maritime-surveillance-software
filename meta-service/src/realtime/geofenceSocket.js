import { WebSocketServer, WebSocket } from 'ws';
import { pool } from '../config/db.config.js';
import { verifyToken } from '../utils/jwtHelper.js';
import { logger } from '../config/logger.js';

export function attachGeofenceSocket(server) {
  const sockets = new WebSocketServer({ noServer: true });
  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname !== '/ws/incursions') return socket.destroy();
    try {
      verifyToken(url.searchParams.get('token') || '');
      sockets.handleUpgrade(request, socket, head, (ws) => sockets.emit('connection', ws));
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    }
  });

  let listener;
  let stopped = false;
  const listen = async () => {
    if (stopped) return;
    try {
      listener = await pool.connect();
      listener.on('notification', ({ channel, payload }) => {
        if (channel !== 'geofence_incursion') return;
        const message = JSON.stringify({ type: 'incursion', data: JSON.parse(payload) });
        sockets.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) client.send(message);
        });
      });
      listener.once('error', (err) => {
        logger.error({ err }, 'Geofence notification listener failed; reconnecting');
        listener?.release(true);
        listener = null;
        if (!stopped) setTimeout(listen, 3000).unref();
      });
      await listener.query('LISTEN geofence_incursion');
    } catch (err) {
      logger.error({ err }, 'Could not start geofence notification listener');
      listener?.release();
      listener = null;
      if (!stopped) setTimeout(listen, 3000).unref();
    }
  };
  listen();
  return () => {
    stopped = true;
    listener?.release();
    sockets.close();
  };
}
