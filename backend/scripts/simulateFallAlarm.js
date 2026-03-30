#!/usr/bin/env node
// ─── ANEES FALL ALARM SIMULATOR ──────────────────────────────────────────────
// Standalone script — no compilation needed, runs with plain Node.js.
// Publishes a fake fall alarm to EMQX so you can test the full Anees
// pipeline without physical Radar60FL hardware.
//
// Usage:
//   node scripts/simulateFallAlarm.js                  # default: device001, fall
//   node scripts/simulateFallAlarm.js device002 fall   # explicit
//   node scripts/simulateFallAlarm.js device001 presence
//   node scripts/simulateFallAlarm.js device001 offline
//   node scripts/simulateFallAlarm.js device001 heartbeat
//
// Make sure the EMQX broker is running on localhost:1883 first.

const mqtt = require('mqtt');

// ─── CLI args ─────────────────────────────────────────────────────────────────
const deviceId  = process.argv[2] || 'device001';
const eventType = process.argv[3] || 'fall';

// ─── Build params payload per event type ─────────────────────────────────────
const PAYLOADS = {
  fall: {
    fallStatus:    '1',
    someoneExists: '1',
    posX:          '2.34',
    posY:          '1.87',
    distance:      '2.98',
  },
  presence: {
    someoneExists: '1',
    posX:          '1.20',
    posY:          '0.95',
  },
  absence: {
    someoneExists: '0',
  },
  heartbeat: {
    heartBeat: '0',   // '0' = abnormal
  },
  offline: {
    online: '0',
  },
};

const params = PAYLOADS[eventType];
if (!params) {
  console.error(`Unknown event type: "${eventType}"`);
  console.error(`Valid types: ${Object.keys(PAYLOADS).join(', ')}`);
  process.exit(1);
}

// ─── MQTT message envelope ────────────────────────────────────────────────────
const topic   = `/Radar60FL/${deviceId}/sys/property/post`;
const payload = JSON.stringify({
  version: '1.0',
  method:  'post',
  params,
});

// ─── Connect and publish ──────────────────────────────────────────────────────
const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';

console.log(`\n🔌 Connecting to EMQX at ${BROKER_URL}…`);

const client = mqtt.connect(BROKER_URL, {
  clientId: `anees-simulator-${Date.now()}`,
  clean:    true,
});

client.on('connect', () => {
  console.log(`✅ Connected\n`);
  console.log(`📤 Publishing ${eventType.toUpperCase()} event`);
  console.log(`   Topic  : ${topic}`);
  console.log(`   Payload: ${payload}\n`);

  client.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) {
      console.error(`❌ Publish failed: ${err.message}`);
    } else {
      console.log(`✅ Published successfully!`);
      console.log(`\nCheck the Anees dashboard at http://localhost:3000/anees-dashboard`);
    }
    // Give the broker a moment to route the message, then disconnect.
    setTimeout(() => {
      client.end();
      process.exit(0);
    }, 500);
  });
});

client.on('error', (err) => {
  console.error(`❌ MQTT error: ${err.message}`);
  process.exit(1);
});
