// ─── MQTT SERVICE — ANEES RADAR INTEGRATION ──────────────────────────────────
// Manages the single persistent MQTT connection to the local EMQX broker.
// All Radar60FL devices publish their events to a wildcard topic; this service
// subscribes once and fans the messages out to the Anees handler.
//
// Topic convention:
//   SUBSCRIBE  /Radar60FL/+/sys/property/post   (+ = any deviceId)
//   PUBLISH    /Radar60FL/{deviceId}/sys/property/set

import mqtt, { MqttClient } from 'mqtt';
import { Server } from 'socket.io';
import { logger } from '../utils/logger';
import { handleRadarMessage } from './anees.service';

// ─── Topic constants ─────────────────────────────────────────────────────────
export const RADAR_TOPIC_SUBSCRIBE = '/Radar60FL/+/sys/property/post';
export const RADAR_TOPIC_PUBLISH   = (deviceId: string) =>
  `/Radar60FL/${deviceId}/sys/property/set`;

// Module-level client so radarCommand.service can reuse it without reconnecting.
let _client: MqttClient | null = null;

/** Returns the active MQTT client (throws if not yet initialised). */
export function getMqttClient(): MqttClient {
  if (!_client) throw new Error('MQTT service not initialised — call initMqtt() first');
  return _client;
}

/**
 * Connects to the EMQX broker and subscribes to all Radar60FL devices.
 * Pass the Socket.IO server so fall-alert events can be broadcast to the
 * Anees demo dashboard in real time.
 *
 * This function is intentionally non-blocking: connection happens
 * asynchronously and the Express server starts regardless.
 */
export function initMqtt(io: Server): void {
  const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
  const clientId  = `barq-anees-${Date.now()}`;

  logger.info(`🛰  MQTT connecting to ${brokerUrl} as ${clientId}`);

  _client = mqtt.connect(brokerUrl, {
    clientId,
    clean:          true,
    reconnectPeriod: 5_000,  // auto-reconnect every 5 s on disconnect
    connectTimeout:  10_000,
  });

  // ─── Connection established ─────────────────────────────────────────
  _client.on('connect', () => {
    logger.info('✅ MQTT connected to EMQX broker');

    // Subscribe with QoS 1 so the broker retransmits if we miss a message.
    _client!.subscribe(RADAR_TOPIC_SUBSCRIBE, { qos: 1 }, (err) => {
      if (err) {
        logger.error(`MQTT subscribe error: ${err.message}`);
      } else {
        logger.info(`📡 MQTT subscribed to ${RADAR_TOPIC_SUBSCRIBE}`);
      }
    });
  });

  // ─── Incoming message ───────────────────────────────────────────────
  _client.on('message', (topic: string, rawPayload: Buffer) => {
    try {
      // Extract deviceId from the wildcard position in the topic.
      // Topic shape: /Radar60FL/{deviceId}/sys/property/post
      const segments = topic.split('/');
      const deviceId = segments[2]; // index 0 = '', 1 = 'Radar60FL', 2 = deviceId

      if (!deviceId) {
        logger.warn(`MQTT: cannot extract deviceId from topic "${topic}"`);
        return;
      }

      const message = JSON.parse(rawPayload.toString());
      const params  = message?.params as Record<string, string> | undefined;

      if (!params) {
        logger.warn(`MQTT: message on "${topic}" has no params field`);
        return;
      }

      logger.debug(`MQTT message from ${deviceId}: ${JSON.stringify(params)}`);

      // Hand off to the Anees business-logic handler (async, errors caught there).
      handleRadarMessage(deviceId, params, io).catch((err) =>
        logger.error(`Anees handler error for ${deviceId}: ${err.message}`)
      );
    } catch (err) {
      logger.error(`MQTT: failed to parse message on "${topic}": ${(err as Error).message}`);
    }
  });

  // ─── Lifecycle events ───────────────────────────────────────────────
  _client.on('reconnect', () => logger.info('🔄 MQTT reconnecting…'));
  _client.on('offline',   () => logger.warn('⚠️  MQTT client went offline'));
  _client.on('error',     (err) => logger.error(`MQTT error: ${err.message}`));
  _client.on('close',     () => logger.warn('🔌 MQTT connection closed'));
}
