// ─── RADAR COMMAND SERVICE ────────────────────────────────────────────────────
// Publishes control commands to Radar60FL devices via MQTT.
// All commands follow the standard message envelope:
//   { "version": "1.0", "method": "set", "params": { ... } }
//
// Publish topic: /Radar60FL/{deviceId}/sys/property/set

import { MqttClient } from 'mqtt';
import { RADAR_TOPIC_PUBLISH } from './mqtt.service';
import { logger } from '../utils/logger';

// ─── Internal publish helper ──────────────────────────────────────────────────
function publish(
  client: MqttClient,
  deviceId: string,
  params: Record<string, unknown>,
): void {
  const topic   = RADAR_TOPIC_PUBLISH(deviceId);
  const payload = JSON.stringify({
    version: '1.0',
    method:  'set',
    params,
  });

  client.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) {
      logger.error(`RadarCommand: publish to ${deviceId} failed: ${err.message}`);
    } else {
      logger.info(`RadarCommand: sent to ${deviceId} → ${JSON.stringify(params)}`);
    }
  });
}

// ─── Public command functions ─────────────────────────────────────────────────

/**
 * Enables fall detection on a specific device.
 * Send this after device registration or after a reboot.
 */
export function enableFallDetection(client: MqttClient, deviceId: string): void {
  publish(client, deviceId, { fallDetectionEnable: '1' });
}

/**
 * Disables fall detection (e.g. during maintenance or sensor calibration).
 */
export function disableFallDetection(client: MqttClient, deviceId: string): void {
  publish(client, deviceId, { fallDetectionEnable: '0' });
}

/**
 * Sets the installation scene mode for the radar.
 * Common modes (consult Radar60FL datasheet for full list):
 *   0 = default / living room
 *   1 = bedroom
 *   2 = bathroom / wet room
 */
export function setSceneMode(client: MqttClient, deviceId: string, mode: number): void {
  publish(client, deviceId, { sceneMode: String(mode) });
}

/**
 * Requests the device to report its current status immediately.
 * Useful for checking if a device is alive after an offline event.
 */
export function requestStatusReport(client: MqttClient, deviceId: string): void {
  publish(client, deviceId, { reportNow: '1' });
}

/**
 * Sets the sensitivity of fall detection (1 = low, 3 = high).
 * Higher sensitivity may increase false positives in busy rooms.
 */
export function setFallSensitivity(
  client: MqttClient,
  deviceId: string,
  level: 1 | 2 | 3,
): void {
  publish(client, deviceId, { fallSensitivity: String(level) });
}
