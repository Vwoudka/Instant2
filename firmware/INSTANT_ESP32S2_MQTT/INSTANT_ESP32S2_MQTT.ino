/*
 * ESP32S2 - Moniteur d'énergie IoT (INSTANT 2)
 * ZMPT101B + SCT-013 + EmonLib + MQTT (sans ThingSpeak)
 *
 *  - Mesure V, I, P, PF, fréquence (Hz) et énergie cumulée (kWh).
 *  - Publie les mesures toutes les 2 s sur MQTT (topics energy/*).
 *  - S'abonne aux commandes relais (relay/command) et seuils de
 *    sécurité (settings/*) via MQTT — la synchronisation est instantanée.
 *
 * Librairies requises : EmonLib + PubSubClient (knolleary).
 */

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <EmonLib.h>

// WiFi
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// Broker MQTT public (HiveMQ) — le dashboard WEB utilise le même broker
// en WebSocket (wss://broker.hivemq.com:8000/mqtt).
const char* MQTT_HOST = "broker.hivemq.com";
const int   MQTT_PORT = 1883;

// Topics MQTT
#define TOPIC_VOLTAGE     "energy/voltage"
#define TOPIC_CURRENT     "energy/current"
#define TOPIC_POWER       "energy/power"
#define TOPIC_PF          "energy/pf"
#define TOPIC_ENERGY      "energy/energy"
#define TOPIC_FREQUENCY   "energy/frequency"
#define TOPIC_RELAY_STATE "relay/state"
#define TOPIC_RELAY_CMD   "relay/command"
#define TOPIC_FAULT       "fault/status"
#define TOPIC_VMAX        "settings/vmax"
#define TOPIC_IMAX        "settings/imax"
#define TOPIC_PMAX        "settings/pmax"

// Broches
#define VOLT_PIN  34
#define CURR_PIN  35
#define RELAY_PIN 18

// Polarité du relais
#define RELAY_ACTIVE_LOW false

inline uint8_t relayLevel(bool wantOn) {
    return RELAY_ACTIVE_LOW ? (wantOn ? LOW : HIGH) : (wantOn ? HIGH : LOW);
}

// Calibration
#define V_CAL  215.0
#define I_CAL  11.0
#define PHASE  1.732

// EmonLib
EnergyMonitor emon;
#define SAMPLES    20
#define TIMEOUT_MS 2000

// Seuils de sécurité
float vMax = 240.0, iMax = 15.0, pMax = 3000.0;
bool relayCmd = false, relayOn = false, fault = false;
unsigned long faultTimer = 0;
bool relayChanged = false, faultChanged = false;

// Énergie cumulée (kWh) — persiste en RAM ; à chaque redémarrage repart à 0
float energyKwh = 0.0;
unsigned long lastMeasureMs = 0;

// Cadencement
const unsigned long T_MEASURE    = 1000;
const unsigned long T_PUBLISH    = 2000;
const unsigned long T_RECONNECT  = 5000;
unsigned long tMeasure = 0, tPublish = 0, tReconnect = 0;

WiFiClient espClient;
PubSubClient mqtt(espClient);

float voltage = 0, current = 0, power = 0, pf = 0, frequency = 0;

// --------------------------------------------------------------------------
// Mesure
// --------------------------------------------------------------------------
void measure() {
    emon.calcVI(SAMPLES, TIMEOUT_MS);
    voltage = emon.Vrms;
    current = emon.Irms;
    power   = emon.realPower;
    pf      = emon.powerFactor;
    frequency = emon.frequency;

    // Filtrage des valeurs aberrantes
    if (voltage < 50 || voltage > 350)   voltage = 0;
    if (current < 0.05 || current > 30)  current = 0;
    if (frequency < 40 || frequency > 70) frequency = 0;  // hors plage 50/60 Hz
    if (power < 0.1 && voltage > 0 && current > 0) power = voltage * current;

    // Accumulation d'énergie : E(kWh) += P(W) × dt(h) / 1000
    unsigned long now = millis();
    if (lastMeasureMs > 0) {
        float dtHours = (now - lastMeasureMs) / 3600000.0;
        energyKwh += power * dtHours / 1000.0;
    }
    lastMeasureMs = now;

    Serial.printf("V=%.1f I=%.2f P=%.1f PF=%.2f Hz=%.1f E=%.4f %s\n",
                  voltage, current, power, pf, frequency, energyKwh,
                  relayOn ? "ON" : "OFF");
}

// --------------------------------------------------------------------------
// Callback MQTT : commande relais + seuils de sécurité
// --------------------------------------------------------------------------
void onMqttMessage(char* topic, byte* payload, unsigned int length) {
    String msg;
    for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];
    msg.trim();
    String t = String(topic);

    if (t == TOPIC_RELAY_CMD) {
        relayCmd = msg.equalsIgnoreCase("ON") || msg == "1";
        Serial.printf("MQTT cmd relay=%d\n", (int)relayCmd);
    } else if (t == TOPIC_VMAX) {
        if (msg.toFloat() > 0) vMax = msg.toFloat();
    } else if (t == TOPIC_IMAX) {
        if (msg.toFloat() > 0) iMax = msg.toFloat();
    } else if (t == TOPIC_PMAX) {
        if (msg.toFloat() > 0) pMax = msg.toFloat();
    }
    Serial.printf("CFG vMax=%.0f iMax=%.1f pMax=%.0f\n", vMax, iMax, pMax);
}

// --------------------------------------------------------------------------
// Connexion MQTT (avec retry) + abonnements + publication retained
// --------------------------------------------------------------------------
bool connectMqtt() {
    if (!WiFi.isConnected()) return false;
    if (mqtt.connected()) return true;

    String clientId = "INSTANT2_" + WiFi.macAddress();
    clientId.replace(":", "");

    if (mqtt.connect(clientId.c_str())) {
        Serial.println("MQTT OK");
        mqtt.subscribe(TOPIC_RELAY_CMD);
        mqtt.subscribe(TOPIC_VMAX);
        mqtt.subscribe(TOPIC_IMAX);
        mqtt.subscribe(TOPIC_PMAX);

        // Publie la config courante en "retained" : le dashboard INSTANT 2 la
        // reçoit dès qu'il se connecte (remplace l'ancien GET ThingSpeak).
        mqtt.publish(TOPIC_VMAX, String(vMax, 0).c_str(), true);
        mqtt.publish(TOPIC_IMAX, String(iMax, 1).c_str(), true);
        mqtt.publish(TOPIC_PMAX, String(pMax, 0).c_str(), true);
        mqtt.publish(TOPIC_RELAY_STATE, relayOn ? "ON" : "OFF", true);
        mqtt.publish(TOPIC_FAULT, fault ? "Safety limit exceeded" : "NONE", true);
        return true;
    }
    return false;
}

// --------------------------------------------------------------------------
// Vérifie le Wi-Fi puis le broker MQTT toutes les 5 s (pattern Blynk)
// --------------------------------------------------------------------------
void reconnect() {
    if (WiFi.status() != WL_CONNECTED) {
        WiFi.begin(ssid, password);
        return;
    }
    if (!mqtt.connected()) {
        connectMqtt();
    }
}

// --------------------------------------------------------------------------
// Publication périodique des mesures + changements d'état immédiats
// --------------------------------------------------------------------------
void publishStatus() {
    if (!mqtt.connected()) return;
    mqtt.publish(TOPIC_VOLTAGE, String(voltage, 2).c_str());
    mqtt.publish(TOPIC_CURRENT, String(current, 2).c_str());
    mqtt.publish(TOPIC_POWER, String(power, 2).c_str());
    mqtt.publish(TOPIC_PF, String(pf, 2).c_str());
    mqtt.publish(TOPIC_ENERGY, String(energyKwh, 4).c_str());
    mqtt.publish(TOPIC_FREQUENCY, String(frequency, 1).c_str());

    if (relayChanged) {
        mqtt.publish(TOPIC_RELAY_STATE, relayOn ? "ON" : "OFF", true);
        relayChanged = false;
    }
    if (faultChanged) {
        mqtt.publish(TOPIC_FAULT, fault ? "Safety limit exceeded" : "NONE", true);
        faultChanged = false;
    }
}

// --------------------------------------------------------------------------
// Application de la commande relais avec protection prioritaire
// --------------------------------------------------------------------------
void controlRelay() {
    bool trip = (voltage > vMax) ||
                (voltage > 0 && voltage < vMax * 0.8) || // sous-tension
                (current > iMax) ||
                (power > pMax);

    if (trip) {
        // Déclenchement de sécurité : on coupe, quoi que demande l'utilisateur
        digitalWrite(RELAY_PIN, relayLevel(false));
        relayOn = false;
        fault = true;
        faultTimer = millis();
        relayChanged = true;
    } else if (fault) {
        // "Refroidissement" de 5 s avant d'accepter une nouvelle commande
        if (millis() - faultTimer > 5000) {
            fault = false;
            faultChanged = true;
        }
    } else {
        if (relayCmd != relayOn) {
            digitalWrite(RELAY_PIN, relayLevel(relayCmd));
            relayOn = relayCmd;
            relayChanged = true;
        }
    }
}

// --------------------------------------------------------------------------
// Setup / Loop
// --------------------------------------------------------------------------
void setup() {
    Serial.begin(115200);
    delay(1000);

    pinMode(RELAY_PIN, OUTPUT);
    digitalWrite(RELAY_PIN, relayLevel(false)); // état sûr au démarrage

    analogReadResolution(10);
    analogSetAttenuation(ADC_11db);

    emon.voltage(VOLT_PIN, V_CAL, PHASE);
    emon.current(CURR_PIN, I_CAL);

    // Quelques cycles de calibration à vide pour stabiliser EmonLib
    for (int i = 0; i < 10; i++) emon.calcVI(SAMPLES, TIMEOUT_MS);

    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED && millis() < 15000) delay(500);
    Serial.println(WiFi.status() == WL_CONNECTED ? "WiFi OK" : "WiFi FAIL");

    mqtt.setServer(MQTT_HOST, MQTT_PORT);
    mqtt.setCallback(onMqttMessage);

    connectMqtt();
}

void loop() {
    unsigned long now = millis();

    // Vérifie la connexion toutes les 5 s
    if (now - tReconnect >= T_RECONNECT) {
        reconnect();
        tReconnect = now;
    }
    mqtt.loop();

    if (now - tMeasure >= T_MEASURE) { measure(); tMeasure = now; }
    if (now - tPublish >= T_PUBLISH) { publishStatus(); tPublish = now; }

    controlRelay();
    delay(10);
}