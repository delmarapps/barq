import { BleManager, Device } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform } from 'react-native';
// @ts-ignore — no type declarations for this SDK
import { BleSDK } from '@moshenguo/ms-data-sdk';

// React Native / Hermes has no Node.js Buffer
function bytesToB64(bytes: number[]): string {
  return btoa(bytes.map(b => String.fromCharCode(b)).join(''));
}
function b64ToBytes(b64: string): number[] {
  return atob(b64).split('').map(c => c.charCodeAt(0));
}

// FFF0 service UUIDs — the only ones the SDK commands go to
const SVC_FFF0  = '0000fff0-0000-1000-8000-00805f9b34fb';
const CHAR_FFF6 = '0000fff6-0000-1000-8000-00805f9b34fb'; // write (command channel)
const CHAR_FFF7 = '0000fff7-0000-1000-8000-00805f9b34fb'; // notify (data channel)

const manager = new BleManager();
let connectedDevice: Device | null = null;
let reconnectCbs: null | {
  onStatus:  (s: string) => void;
  onReading: (r: BandReading) => void;
  onDebug?:  (s: string) => void;
} = null;

export type BandReading = { heartRate?: number; battery?: number };

async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const results = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ]);
  return Object.values(results).every(r => r === PermissionsAndroid.RESULTS.GRANTED);
}

async function writeFFF6(device: Device, cmd: number[], log: (m: string) => void) {
  try {
    const b64 = bytesToB64(cmd);
    await device.writeCharacteristicWithoutResponseForService(SVC_FFF0, CHAR_FFF6, b64);
    log(`CMD → fff6: [${cmd.slice(0,4).join(',')}…]`);
  } catch (e: any) {
    log(`CMD fff6 error: ${e?.message}`);
  }
}

function handleNotification(
  value: string,
  onReading: (r: BandReading) => void,
  log: (m: string) => void,
) {
  const bytes = b64ToBytes(value);
  const hex   = bytes.map(b => b.toString(16).padStart(2,'0')).join(' ');
  log(`NOTIFY fff7 (${bytes.length}b): ${hex}`);

  // HARDCODED TEST — remove once 82 appears on screen
  onReading({ heartRate: 82 });

  const types = ['V8', '2208A', '2208', 'V4', 'V5', '2025'] as const;
  let delivered = false;
  for (const t of types) {
    const p = BleSDK.dataParsingWithData(bytes, t);
    if (p && Object.keys(p).length > 0) log(`  parsed(${t}): ${JSON.stringify(p)}`);

    const rawHr  = p?.heart_rate  ?? p?.data?.heart_rate;
    const rawBat = p?.battery_level ?? p?.data?.battery_level;
    if (rawHr  != null) log(`  >>> HR=${rawHr} (${t})`);
    if (rawBat != null) log(`  >>> BAT=${rawBat} (${t})`);

    if (!delivered) {
      const bpm     = typeof rawHr  === 'string' ? parseInt(rawHr,  10) : (rawHr  as number | undefined);
      const battery = typeof rawBat === 'string' ? parseInt(rawBat, 10) : (rawBat as number | undefined);
      if (typeof bpm === 'number' && !isNaN(bpm) && bpm > 0) {
        onReading({ heartRate: bpm }); delivered = true;
      } else if (typeof battery === 'number' && !isNaN(battery) && battery >= 0) {
        onReading({ battery }); delivered = true;
      }
    }
  }
}

export async function connectAndRead(
  onStatus:  (status: string) => void,
  onReading: (reading: BandReading) => void,
  onDebug?:  (info: string) => void,
): Promise<void> {
  const log = (msg: string) => {
    console.log('[BandService]', msg);
    onDebug?.(msg);
  };

  reconnectCbs = { onStatus, onReading, onDebug };

  const granted = await requestBlePermissions();
  if (!granted) { onStatus('Permission denied'); return; }

  onStatus('Scanning…');
  log('Starting BLE scan');

  return new Promise((resolve, reject) => {
    manager.startDeviceScan(null, { allowDuplicates: false }, async (error, device) => {
      if (error) {
        log(`Scan error: ${error.message}`);
        onStatus(`Scan error: ${error.message}`);
        reject(error);
        return;
      }
      if (!device) return;

      const name = device.name ?? device.localName ?? '';
      if (!name.includes('JCVital') && !name.includes('2208') && !name.includes('J2208')) return;

      log(`Found device: ${name} (${device.id})`);
      manager.stopDeviceScan();
      onStatus('Connecting…');

      try {
        const connected = await device.connect({ timeout: 10000 });
        connectedDevice = connected;
        await connected.discoverAllServicesAndCharacteristics();
        onStatus('Band: connected ✓');
        log('Connected — subscribing to fff7…');

        // Subscribe to the data channel
        connected.monitorCharacteristicForService(SVC_FFF0, CHAR_FFF7, (err, ch) => {
          if (err) { log(`Monitor error: ${err.message}`); return; }
          if (!ch?.value) return;
          handleNotification(ch.value, onReading, log);
        });

        // Auto-reconnect on disconnect
        connected.onDisconnected(() => {
          log('Band disconnected — reconnecting in 3s…');
          onStatus('Reconnecting…');
          connectedDevice = null;
          setTimeout(() => {
            if (reconnectCbs) {
              connectAndRead(reconnectCbs.onStatus, reconnectCbs.onReading, reconnectCbs.onDebug)
                .catch(e => log(`Reconnect failed: ${e?.message}`));
            }
          }, 3000);
        });

        // Send SDK commands to sync time and start real-time step+HR streaming
        await writeFFF6(connected, BleSDK.setDeviceTime(new Date()), log);
        await new Promise(r => setTimeout(r, 200));
        await writeFFF6(connected, BleSDK.realTimeStep(true, false), log);
        await new Promise(r => setTimeout(r, 200));
        // Also trigger active HR measurement (dataType=2, open=true)
        await writeFFF6(connected, BleSDK.healthMeasurementWithDataType(0x02, true, null), log);
        await new Promise(r => setTimeout(r, 200));
        await writeFFF6(connected, BleSDK.getDeviceBatteryLevel(), log);

        log('Init sequence complete — waiting for data…');
        resolve();
      } catch (e: any) {
        log(`Connect failed: ${e?.message}`);
        onStatus(`Connect failed: ${e?.message}`);
        reject(e);
      }
    });
  });
}

export async function disconnectBand(): Promise<void> {
  reconnectCbs = null;
  if (connectedDevice) {
    // Stop real-time step before disconnecting
    try { await writeFFF6(connectedDevice, BleSDK.realTimeStep(false, false), () => {}); } catch {}
    try { await connectedDevice.cancelConnection(); } catch {}
    connectedDevice = null;
  }
}
