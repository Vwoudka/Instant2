# INSTANT 2

Professional real-time IoT energy monitoring and relay control dashboard, communicating over **MQTT** with an **ESP32S2**.

[![stack](https://img.shields.io/badge/stack-React%20%2B%20MQTT.js-brightgreen)]()
[![real-time](https://img.shields.io/badge/data-live%202%20s%20stream-34D399)]()
[![hosting](https://img.shields.io/badge/host-GitHub%20Pages-ff007f)]()
[![protocol](https://img.shields.io/badge/protocol-MQTT%20over%20WebSocket-yellow)]()

---

## Architecture

```
ESP32S2 (PubSubClient + EmonLib)
  ├─ publishes V, I, P, PF, energy, frequency on  energy/*  every 2 s
  ├─ publishes relay state on  relay/state  (retained)
  └─ subscribes to  relay/command, settings/vmax, settings/imax, settings/pmax
          │
          │  MQTT (HiveMQ public broker)
          │  ESP32  →  TCP 1883  |  Browser  →  WebSocket :8000
          v
  +---------------------------------------------+
  |  FRONTEND  (React, static site)              |
  |  connects via mqtt.js over WebSocket         |
  |  Dashboard / History / Settings               |
  +---------------------------------------------+
```

The app connects directly to the HiveMQ public broker (WebSocket) — no backend server, no REST polling. Messages arrive in real-time as the device publishes.

---

## Project structure

```
instant2/
├─ package.json                      # root convenience scripts
├─ .github/workflows/deploy.yml      # auto-deploys to GitHub Pages
├─ firmware/
│  └─ INSTANT_ESP32S2_MQTT/          # ESP32S2 sketch (MQTT only, no ThingSpeak)
│     └─ INSTANT_ESP32S2_MQTT.ino
└─ frontend/
   ├─ public/                        # index.html, favicon, manifest, icons
   └─ src/
      ├─ App.js                      # routes + theming shell
      ├─ theme.js                    # green/turquoise/yellow dark/light palettes
      ├─ context/AppContext.js        # global state + MQTT lifecycle
      ├─ api/mqtt.js                  # mqtt.js wrapper + topic schema
      ├─ hooks/useAnimatedNumber.js   # smooth gauge animation
      ├─ components/                  # Header, MetricCard, Gauge, AppLineChart,
      │                               # RelaySwitch, FaultBanner, Toast, StatusDot, Icons
      └─ pages/                       # Dashboard, History, Settings
```

---

## MQTT topics

| Direction | Topic            | Payload             | Retained |
|-----------|------------------|---------------------|----------|
| Device →  | `energy/voltage` | `230.4` (float V)  | no       |
| Device →  | `energy/current` | `1.23` (float A)   | no       |
| Device →  | `energy/power`   | `283.5` (float W)  | no       |
| Device →  | `energy/pf`      | `0.95` (float 0-1) | no       |
| Device →  | `energy/energy`  | `0.0412` (kWh)     | no       |
| Device →  | `energy/frequency` | `50.0` (Hz)        | no       |
| Device →  | `relay/state`    | `ON` / `OFF`        | **yes**  |
| Device →  | `fault/status`   | `Safety limit exceeded` / `NONE` | **yes** |
| ← Browser | `relay/command`  | `ON` / `OFF`        | yes      |
| ← Browser | `settings/vmax`  | `240` (float V)     | **yes**  |
| ← Browser | `settings/imax`  | `15` (float A)      | **yes**  |
| ← Browser | `settings/pmax`  | `3000` (float W)    | **yes**  |

---

## Getting started

### Prerequisites

- Node.js **18+** (tested on 22)
- npm
- (optional) ESP32S2 hardware + Arduino IDE / PlatformIO

### Install & run

```bash
cd frontend
npm install
npm start
```

Open **http://localhost:3000**. No `.env` files or API keys — the app connects to the public HiveMQ broker out of the box.

### Production build

```bash
cd frontend
npm run build
npx serve -s build
```

### GitHub Pages

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and publishes to your GitHub Pages URL.

---

## Firmware (ESP32S2)

`firmware/INSTANT_ESP32S2_MQTT/INSTANT_ESP32S2_MQTT.ino` publishes measurements over MQTT and listens for relay commands and threshold settings. **No ThingSpeak** — pure MQTT.

**Libraries:** `EmonLib` + `PubSubClient`

**Wiring / config:**

| Item | Value |
|------|-------|
| Voltage sensor | ZMPT101B on pin 34 |
| Current sensor | SCT-013 on pin 35 |
| Relay | pin 18 |
| Calibration | `V_CAL=215`, `I_CAL=11`, `PHASE=1.732` |
| WiFi | Update `ssid` and `password` in sketch |
| Publish cadence | 2 s (measurements) |
| Fault reset delay | 5 s |

---

## Security note

The HiveMQ public broker has no authentication — anyone on the internet can read and write these topics. This is intentional for a demo. For production, deploy a private MQTT broker with TLS and credentials.

---

## License

MIT