import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Server as SocketServer } from 'socket.io';

import { logger } from './utils/logger';
import authRoutes        from './routes/auth.routes';
import userRoutes        from './routes/user.routes';
import deviceRoutes      from './routes/device.routes';
import wellnessRoutes    from './routes/wellness.routes';
import recoveryRoutes    from './routes/recovery.routes';
import sleepRoutes       from './routes/sleep.routes';
import activityRoutes    from './routes/activity.routes';
import goalRoutes        from './routes/goal.routes';
import notificationRoutes from './routes/notification.routes';
import aneesRoutes        from './routes/anees.routes';
import { setupSocketIO }  from './services/socket.service';
import { initMqtt }       from './services/mqtt.service';
import { errorHandler }   from './middleware/error.middleware';
import { authenticate }   from './middleware/auth.middleware';

dotenv.config();

const app  = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// ─── Socket.IO ───────────────────────────────────────
const io = new SocketServer(server, {
  cors: { origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' },
});
setupSocketIO(io);
app.set('io', io);

// ─── Anees Dashboard (served BEFORE helmet so inline scripts are allowed) ─────
// This is an internal demo tool — not a production page — so relaxed CSP is
// acceptable. Move behind authenticate() and tighten CSP before going live.
app.get('/anees-dashboard', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard', 'anees-dashboard.html'));
});

// ─── Security Middleware ──────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  max:      Number(process.env.RATE_LIMIT_MAX) || 100,
  message:  { error: 'Too many requests. Please try again later.' },
}));

// ─── Body Parsing ─────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ─── Health Check ─────────────────────────────────────
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', service: 'BARQ API', ts: new Date().toISOString() });
});

// ─── Public Routes ────────────────────────────────────
app.use('/api/v1/auth', authRoutes);

// ─── Protected Routes ─────────────────────────────────
app.use('/api/v1/user',          authenticate, userRoutes);
app.use('/api/v1/device',        authenticate, deviceRoutes);
app.use('/api/v1/wellness',      authenticate, wellnessRoutes);
app.use('/api/v1/recovery',      authenticate, recoveryRoutes);
app.use('/api/v1/sleep',         authenticate, sleepRoutes);
app.use('/api/v1/activity',      authenticate, activityRoutes);
app.use('/api/v1/goals',         authenticate, goalRoutes);
app.use('/api/v1/notifications', authenticate, notificationRoutes);
// Anees radar API — public for the internal demo dashboard (no auth required).
app.use('/api/v1/anees',         aneesRoutes);

// ─── 404 ──────────────────────────────────────────────
app.use('*', (_, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Error Handler ────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────
server.listen(PORT, () => {
  logger.info(`🚀 BARQ API running on port ${PORT}`);
  logger.info(`📍 Health: http://localhost:${PORT}/api/health`);
  logger.info(`📊 Anees Dashboard: http://localhost:${PORT}/anees-dashboard`);

  // Initialise MQTT after the HTTP server is up.
  // Uses a small delay so the server is fully ready before adding subscribers.
  // initMqtt is non-blocking — MQTT failures will NOT crash the HTTP server.
  setImmediate(() => initMqtt(io));
});

export { app, server };
