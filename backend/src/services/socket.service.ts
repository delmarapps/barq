import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

export function setupSocketIO(io: Server) {
  // ─── Auth Middleware ────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);
    logger.info(`🔌 User connected: ${userId}`);

    // ─── Live Activity Streaming ──────────────────────
    socket.on('activity:heartrate', (data: { bpm: number; timestamp: number }) => {
      // Broadcast to all user devices (e.g. watch + phone)
      socket.to(`user:${userId}`).emit('activity:heartrate', data);
    });

    socket.on('activity:update', (data: {
      sessionId: string;
      elapsed: number;
      calories: number;
      strain: number;
      avgBpm: number;
    }) => {
      socket.to(`user:${userId}`).emit('activity:update', data);
    });

    // ─── Band Sync ────────────────────────────────────
    socket.on('band:sync', (data: { batteryLevel: number; firmwareVersion: string }) => {
      logger.info(`📡 Band sync from ${userId}: battery ${data.batteryLevel}%`);
      socket.emit('band:sync:ack', { synced: true, ts: Date.now() });
    });

    // ─── Disconnect ───────────────────────────────────
    socket.on('disconnect', () => {
      logger.info(`🔌 User disconnected: ${userId}`);
    });
  });

  logger.info('✅ Socket.IO ready');
}

// Helper: push notification to a specific user via websocket
export function pushToUser(io: Server, userId: string, event: string, data: unknown) {
  io.to(`user:${userId}`).emit(event, data);
}
