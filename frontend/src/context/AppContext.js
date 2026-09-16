import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { MqttClient, TOPICS, parseReading } from '../api/mqtt';

const AppContext = createContext(null);

const FRESH_MS = 10 * 1000; // no message for >10 s -> device considered offline
const HISTORY_MS = 5 * 60 * 1000; // rolling chart window
const HISTORY_CAP = 300;

const initialState = {
  voltage: 0,
  current: 0,
  power: 0,
  pf: 0,
  energy: 0,
  frequency: 0,
  relay: 'OFF',
  fault: null,
  connected: false,
  live: false,
  lastMessageAt: null,
  lastUpdated: null,
  history: [],
  thresholds: { vmax: 240, imax: 15, pmax: 3000 },
  thresholdsSource: 'mqtt',
  relayLog: [],
};

export function AppProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [theme, setTheme] = useState(() => localStorage.getItem('instant2-theme') || 'dark');
  const [mqttStatus, setMqttStatus] = useState('connecting');
  const [toasts, setToasts] = useState([]);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  const clientRef = useRef(null);

  const notify = useCallback((type, message) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  // MQTT lifecycle: connect once, merge every incoming message into state and
  // keep the rolling history window fresh.
  useEffect(() => {
    const client = new MqttClient({
      onMessage: (topic, payload) => {
        const reading = parseReading(topic, payload);
        if (!reading) return;

        const now = Date.now();
        setState((s) => {
          const merged = { ...s, ...reading, lastMessageAt: now, lastUpdated: now };

          const measurements = ['voltage', 'current', 'power', 'pf', 'energy', 'frequency'];
          const hasNewMeasurement = measurements.some(
            (k) => reading[k] !== undefined && Math.abs(reading[k] - s[k]) > 1e-9
          );

          let history = s.history;
          if (hasNewMeasurement) {
            const point = {
              t: now,
              voltage: merged.voltage,
              current: merged.current,
              power: merged.power,
              pf: merged.pf,
              energy: merged.energy,
              frequency: merged.frequency,
            };
            history = [...s.history, point]
              .filter((p) => p.t > now - HISTORY_MS)
              .slice(-HISTORY_CAP);
          }

          // Log relay state transitions.
          let relayLog = s.relayLog;
          if (reading.relay && reading.relay !== s.relay) {
            relayLog = [...s.relayLog, { t: now, state: reading.relay }].slice(-50);
          }

          const thresholds = {
            vmax: reading.vmax || s.thresholds.vmax,
            imax: reading.imax || s.thresholds.imax,
            pmax: reading.pmax || s.thresholds.pmax,
          };

          return { ...merged, history, relayLog, thresholds, live: true };
        });
      },
      onStatus: (status) => setMqttStatus(status),
    });

    clientRef.current = client;
    client.connect();

    return () => {
      client.end();
      clientRef.current = null;
    };
  }, []);

  // A device is only considered "live" while messages keep arriving. MQTT has
  // no timestamps, so we infer freshness from our last received message.
  useEffect(() => {
    const id = setInterval(() => {
      setState((s) => {
        const fresh = s.lastMessageAt && Date.now() - s.lastMessageAt < FRESH_MS;
        if (s.live === !!fresh && s.connected === !!fresh) return s;
        return { ...s, live: !!fresh, connected: !!fresh };
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // Relay command: publish ON/OFF to relay/command. The device applies it and
  // echoes the new state on relay/state, which is what the UI ultimately shows.
  const toggleRelay = useCallback(() => {
    const next = stateRef.current.relay === 'ON' ? 'OFF' : 'ON';
    const ok = clientRef.current && clientRef.current.publish(TOPICS.relayCmd, next);
    if (ok) {
      notify('success', `Relay command sent: ${next}`);
      return true;
    }
    notify('error', 'Not connected to MQTT broker — command not sent');
    return false;
  }, [notify]);

  // Thresholds: publish each value on its own topic (retained, so the device
  // receives them even if it connects later).
  const saveThresholds = useCallback(
    async (payload) => {
      const c = clientRef.current;
      if (!c) return false;

      const vmax = Number(payload.vmax);
      const imax = Number(payload.imax);
      const pmax = Number(payload.pmax);

      if (!Number.isFinite(vmax) || !Number.isFinite(imax) || !Number.isFinite(pmax)) {
        notify('error', 'Thresholds must be valid numbers');
        return false;
      }

      const published =
        c.publish(TOPICS.vmax, String(vmax), { retain: true }) &&
        c.publish(TOPICS.imax, String(imax), { retain: true }) &&
        c.publish(TOPICS.pmax, String(pmax), { retain: true });

      if (published) {
        setState((s) => ({ ...s, thresholds: { vmax, imax, pmax }, thresholdsSource: 'mqtt' }));
        notify('success', 'Thresholds published over MQTT');
        return true;
      }
      notify('error', 'Not connected to MQTT broker — settings not published');
      return false;
    },
    [notify]
  );

  const resetFault = useCallback(() => {
    setState((s) => ({ ...s, fault: null }));
    notify('info', 'Fault indicator cleared');
  }, [notify]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem('instant2-theme', next);
      return next;
    });
  }, []);

  const connected = mqttStatus === 'connected';

  const value = {
    state,
    connected,
    live: state.live && connected,
    mqttStatus,
    theme,
    toasts,
    notify,
    dismissToast,
    toggleRelay,
    saveThresholds,
    resetFault,
    toggleTheme,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}