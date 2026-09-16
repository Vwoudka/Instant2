// MQTT client wrapper for instant2. The browser connects straight to the
// broker over WebSockets (mqtt.js) — no backend, no REST polling. The ESP32
// firmware publishes readings on energy/* and listens on relay/command and
// settings/*.
//
// Broker : HiveMQ public broker (WebSocket). The ESP32 firmware targets the
// same broker over TCP 1883, so this single shared broker links device and UI.

import mqtt from 'mqtt';

const MQTT = {
  url: 'wss://broker.hivemq.com:8000/mqtt',
  // Public broker — long clientId prefix required by HiveMQ's enforcements.
  clientIdPrefix: 'instant2',
  reconnectPeriod: 3000,
  connectTimeout: 10000,
  keepalive: 30,
};

// Topic schema shared with the firmware.
export const TOPICS = {
  voltage: 'energy/voltage',
  current: 'energy/current',
  power: 'energy/power',
  pf: 'energy/pf',
  energy: 'energy/energy',
  frequency: 'energy/frequency',
  relayState: 'relay/state',
  relayCmd: 'relay/command',
  fault: 'fault/status',
  vmax: 'settings/vmax',
  imax: 'settings/imax',
  pmax: 'settings/pmax',
};

const SUBSCRIBE_TO = ['energy/#', 'relay/#', 'fault/#', 'settings/#'];

function num(value) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function sanitize(value) {
  const n = num(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Thin bridge between the app and an MQTT client.
 *  - onMessage(topic, payload)   -> every subscribed message, payload as string
 *  - onStatus(status)            -> 'connecting' | 'connected' | 'reconnecting' | 'offline'
 */
export class MqttClient {
  constructor({ onMessage, onStatus }) {
    this.onMessage = onMessage;
    this.onStatus = onStatus;
    this.client = null;
    this.intentional = false;
  }

  connect() {
    this.intentional = false;
    const client = mqtt.connect(MQTT.url, {
      clientId: `${MQTT.clientIdPrefix}-${Math.random().toString(16).slice(2, 10)}`,
      reconnectPeriod: MQTT.reconnectPeriod,
      connectTimeout: MQTT.connectTimeout,
      keepalive: MQTT.keepalive,
      clean: true,
    });
    this.client = client;

    client.on('connect', () => {
      this.onStatus('connected');
      client.subscribe(SUBSCRIBE_TO, { qos: 0 });
    });

    client.on('reconnect', () => this.onStatus('reconnecting'));
    client.on('close', () => {
      if (!this.intentional) this.onStatus('offline');
    });
    client.on('offline', () => this.onStatus('offline'));
    client.on('error', (err) => console.warn('[mqtt]', err));

    client.on('message', (topic, payload) => {
      this.onMessage(String(topic), String(payload));
    });
  }

  publish(topic, message, opts = {}) {
    if (!this.client || !this.client.connected) return false;
    this.client.publish(topic, String(message), opts);
    return true;
  }

  end() {
    this.intentional = true;
    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
  }
}

// Parse plain-string payloads into a normalised reading shape.
export function parseReading(topic, payload) {
  if (!topic || payload == null) return null;

  switch (topic) {
    case TOPICS.voltage:
      return { voltage: sanitize(payload) };
    case TOPICS.current:
      return { current: sanitize(payload) };
    case TOPICS.power:
      return { power: sanitize(payload) };
    case TOPICS.pf:
      return { pf: Math.max(0, Math.min(1, sanitize(payload))) };
    case TOPICS.energy:
      return { energy: sanitize(payload) };
    case TOPICS.frequency:
      return { frequency: sanitize(payload) };
    case TOPICS.relayState:
      return { relay: String(payload).toUpperCase() === 'ON' ? 'ON' : 'OFF' };
    case TOPICS.fault:
      return { fault: String(payload).trim().toUpperCase() === 'NONE' || String(payload).trim() === '' ? null : String(payload).trim() };
    case TOPICS.vmax:
      return { vmax: sanitize(payload) };
    case TOPICS.imax:
      return { imax: sanitize(payload) };
    case TOPICS.pmax:
      return { pmax: sanitize(payload) };
    default:
      return null;
  }
}