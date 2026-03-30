// ─── ANEES ROUTES ─────────────────────────────────────────────────────────────
// Public API routes for the Anees fall-detection monitoring system.
// Intentionally unauthenticated for the internal demo dashboard.
// TODO: protect with authenticate() middleware before production deployment.

import { Router } from 'express';
import {
  getEvents,
  resolveAlert,
  getDeviceStatus,
  sendCommand,
} from '../controllers/anees.controller';

const r = Router();

r.get('/events',              getEvents);       // GET  /api/v1/anees/events
r.patch('/events/:id/resolve', resolveAlert);   // PATCH /api/v1/anees/events/:id/resolve
r.get('/devices',             getDeviceStatus); // GET  /api/v1/anees/devices
r.post('/command',            sendCommand);     // POST /api/v1/anees/command

export default r;
