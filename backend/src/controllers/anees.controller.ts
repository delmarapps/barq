// ─── ANEES CONTROLLER ─────────────────────────────────────────────────────────
// REST API handlers for the Anees radar monitoring system.
// These endpoints are intentionally unauthenticated so the internal demo
// dashboard can consume them without login.
// TODO: add authentication before going to production.

import { Request, Response } from 'express';
import { prisma }  from '../utils/prisma';
import { logger }  from '../utils/logger';
import { getMqttClient } from '../services/mqtt.service';
import {
  enableFallDetection,
  disableFallDetection,
  setSceneMode,
  requestStatusReport,
} from '../services/radarCommand.service';

// ─── GET /api/v1/anees/events ─────────────────────────────────────────────────
/**
 * Returns radar events, most recent first.
 * Query params:
 *   limit  (default 50, max 200)
 *   offset (default 0)
 *   type   (optional) — filter by eventType: fall | presence | heartbeat | offline
 *   unresolved (optional, "true") — only unresolved fall alerts
 */
export async function getEvents(req: Request, res: Response) {
  try {
    const limit      = Math.min(Number(req.query.limit) || 50, 200);
    const offset     = Number(req.query.offset) || 0;
    const type       = req.query.type as string | undefined;
    const unresolved = req.query.unresolved === 'true';

    const where: Record<string, unknown> = {};
    if (type)       where.eventType = type;
    if (unresolved) where.resolved  = false;

    const [events, total] = await Promise.all([
      prisma.radarEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take:    limit,
        skip:    offset,
      }),
      prisma.radarEvent.count({ where }),
    ]);

    return res.json({ events, total, limit, offset });
  } catch (err) {
    logger.error('Anees getEvents error', err);
    return res.status(500).json({ error: 'Failed to fetch radar events' });
  }
}

// ─── PATCH /api/v1/anees/events/:id/resolve ───────────────────────────────────
/**
 * Marks a fall alert as resolved (someone confirmed the person is safe).
 */
export async function resolveAlert(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.radarEvent.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const updated = await prisma.radarEvent.update({
      where: { id },
      data:  { resolved: true },
    });

    // Notify the dashboard in real time so the red banner disappears.
    const io = req.app.get('io');
    if (io) {
      io.to('anees-dashboard').emit('anees:resolved', { id: updated.id });
    }

    return res.json({ success: true, event: updated });
  } catch (err) {
    logger.error('Anees resolveAlert error', err);
    return res.status(500).json({ error: 'Failed to resolve alert' });
  }
}

// ─── GET /api/v1/anees/devices ────────────────────────────────────────────────
/**
 * Returns a summary of all known radar devices with their latest known state.
 * Derived by aggregating the most recent event per device — no separate table needed.
 */
export async function getDeviceStatus(req: Request, res: Response) {
  try {
    // Get the most recent event per device using a raw groupBy approach:
    // find all unique deviceIds, then fetch their latest event.
    const deviceIds = await prisma.radarEvent.findMany({
      distinct: ['deviceId'],
      select:   { deviceId: true },
    });

    const statuses = await Promise.all(
      deviceIds.map(async ({ deviceId }) => {
        // Latest event of any type — determines "last seen".
        const lastEvent = await prisma.radarEvent.findFirst({
          where:   { deviceId },
          orderBy: { timestamp: 'desc' },
        });

        // Latest presence event — determines presence state.
        const lastPresence = await prisma.radarEvent.findFirst({
          where:   { deviceId, eventType: 'presence' },
          orderBy: { timestamp: 'desc' },
        });

        // Active (unresolved) fall alert.
        const activeFall = await prisma.radarEvent.findFirst({
          where:   { deviceId, eventType: 'fall', resolved: false },
          orderBy: { timestamp: 'desc' },
        });

        // Device is considered online if it sent any event in the last 5 minutes.
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const isOnline =
          !!lastEvent && new Date(lastEvent.timestamp) > fiveMinutesAgo;

        // Presence from the most recent presence event params.
        const presenceParams = lastPresence?.payload as Record<string, string> | null;
        const someonePresent  = presenceParams?.someoneExists === '1';

        return {
          deviceId,
          isOnline,
          lastSeenAt:   lastEvent?.timestamp ?? null,
          someonePresent,
          activeFallId: activeFall?.id ?? null,
        };
      })
    );

    return res.json({ devices: statuses });
  } catch (err) {
    logger.error('Anees getDeviceStatus error', err);
    return res.status(500).json({ error: 'Failed to fetch device status' });
  }
}

// ─── POST /api/v1/anees/command ──────────────────────────────────────────────
/**
 * Sends a control command to a radar device via MQTT.
 * Body: { deviceId: string, command: "enableFall"|"disableFall"|"setScene"|"reportNow", mode?: number }
 */
export async function sendCommand(req: Request, res: Response) {
  try {
    const { deviceId, command, mode } = req.body as {
      deviceId: string;
      command:  string;
      mode?:    number;
    };

    if (!deviceId || !command) {
      return res.status(400).json({ error: 'deviceId and command are required' });
    }

    const client = getMqttClient();

    switch (command) {
      case 'enableFall':
        enableFallDetection(client, deviceId);
        break;
      case 'disableFall':
        disableFallDetection(client, deviceId);
        break;
      case 'setScene':
        if (mode === undefined) {
          return res.status(400).json({ error: 'mode is required for setScene command' });
        }
        setSceneMode(client, deviceId, mode);
        break;
      case 'reportNow':
        requestStatusReport(client, deviceId);
        break;
      default:
        return res.status(400).json({ error: `Unknown command: ${command}` });
    }

    return res.json({ success: true, deviceId, command });
  } catch (err) {
    logger.error('Anees sendCommand error', err);
    return res.status(500).json({ error: 'Failed to send command' });
  }
}
