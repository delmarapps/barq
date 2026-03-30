// ─── ANEES SERVICE — FALL ALERT HANDLER ──────────────────────────────────────
// Processes decoded MQTT messages from Radar60FL fall-detection sensors.
// Responsibilities:
//   1. Classify the event type from the `params` object
//   2. Persist it to the radar_events table
//   3. Broadcast real-time updates to the Anees dashboard via Socket.IO
//   4. Create an in-app Notification record for fall events
//
// Socket.IO room used by the dashboard: "anees-dashboard"
// Dashboard clients join this room without authentication (internal demo only).

import { Server } from 'socket.io';
import { prisma }  from '../utils/prisma';
import { logger }  from '../utils/logger';

// ─── Event type literals ──────────────────────────────────────────────────────
export type RadarEventType = 'fall' | 'presence' | 'heartbeat' | 'offline';

/**
 * Called by mqtt.service for every incoming Radar60FL message.
 *
 * @param deviceId - extracted from the MQTT topic wildcard
 * @param params   - the `params` object inside the JSON payload
 * @param io       - Socket.IO server for real-time dashboard push
 */
export async function handleRadarMessage(
  deviceId: string,
  params: Record<string, string>,
  io: Server,
): Promise<void> {
  // ─── 1. Classify event ──────────────────────────────────────────────
  const eventType = classifyEvent(params);

  if (!eventType) {
    // Unknown params — log and skip to avoid storing noise.
    logger.debug(`Anees: unrecognised params from ${deviceId}: ${JSON.stringify(params)}`);
    return;
  }

  // ─── 2. Persist to database ─────────────────────────────────────────
  const event = await prisma.radarEvent.create({
    data: {
      deviceId,
      eventType,
      payload:  params as object,
      resolved: false,
    },
  });

  logger.info(`Anees: [${eventType.toUpperCase()}] from device ${deviceId} → saved id=${event.id}`);

  // ─── 3. Broadcast to Anees dashboard ────────────────────────────────
  // All dashboard clients listen on the "anees:event" socket event.
  io.to('anees-dashboard').emit('anees:event', {
    id:        event.id,
    deviceId:  event.deviceId,
    eventType: event.eventType,
    payload:   event.payload,
    timestamp: event.timestamp,
    resolved:  event.resolved,
  });

  // ─── 4. Act on critical events ──────────────────────────────────────
  if (eventType === 'fall') {
    await handleFallAlert(deviceId, params, event.id, io);
  }

  if (eventType === 'heartbeat') {
    logger.warn(`⚠️  Anees: heartbeat ABNORMAL from device ${deviceId}`);
  }

  if (eventType === 'offline') {
    logger.warn(`🔴 Anees: device ${deviceId} went OFFLINE`);
  }
}

// ─── Fall alert ───────────────────────────────────────────────────────────────
/**
 * Handles a confirmed fall detection event:
 * - Emits a high-priority "anees:fall" socket event to the dashboard.
 * - Creates a system Notification record in the database.
 *   (Expo push tokens are not yet wired up — the Notification row acts as the
 *    source of truth; the mobile app polls it via GET /api/v1/notifications.)
 */
async function handleFallAlert(
  deviceId: string,
  params: Record<string, string>,
  eventId: string,
  io: Server,
): Promise<void> {
  logger.warn(`🚨 FALL DETECTED — device: ${deviceId} params: ${JSON.stringify(params)}`);

  // Emit a dedicated fall event so the dashboard can show the red banner.
  io.to('anees-dashboard').emit('anees:fall', {
    eventId,
    deviceId,
    posX: params.posX ?? null,
    posY: params.posY ?? null,
    timestamp: new Date().toISOString(),
  });

  // Save a Notification row for every system user as an in-app alert.
  // TODO: replace this with targeted push to family members once the
  //       Anees user-device linkage table is built.
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    if (users.length > 0) {
      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId:  u.id,
          type:    'system' as const,
          titleEn: 'Fall Detected!',
          titleAr: 'تم اكتشاف سقوط!',
          bodyEn:  `Device ${deviceId} detected a fall. Please check immediately.`,
          bodyAr:  `الجهاز ${deviceId} اكتشف حالة سقوط. يرجى التحقق فوراً.`,
        })),
      });
      logger.info(`Anees: created fall notification for ${users.length} user(s)`);
    }
  } catch (err) {
    // Notification failure should not crash the alert pipeline.
    logger.error(`Anees: failed to create fall notification: ${(err as Error).message}`);
  }
}

// ─── Event classifier ─────────────────────────────────────────────────────────
/**
 * Inspects the `params` object from the radar to decide the event type.
 * Returns null for messages that carry no actionable data.
 *
 * Radar60FL param reference:
 *   fallStatus     "1" = fall detected, "0" = no fall
 *   someoneExists  "1" = person present, "0" = nobody
 *   heartBeat      "0" = abnormal (device malfunction), "1" = normal
 *   online         "0" = device just went offline
 */
function classifyEvent(params: Record<string, string>): RadarEventType | null {
  if (params.fallStatus === '1')         return 'fall';
  if ('someoneExists' in params)         return 'presence';
  if (params.heartBeat === '0')          return 'heartbeat';
  if (params.online === '0')             return 'offline';
  return null;
}
