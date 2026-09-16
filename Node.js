npm install mqtt firebase-admin

const mqtt = require('mqtt');
const admin = require('firebase-admin');

// Initialize Firebase Admin (uses service account credentials)
// Download your service account key from the Firebase Console
const serviceAccount = require('./serviceAccountKey.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://instant-ee26-default-rtdb.firebaseio.com'
});

const db = admin.database();

// Connect to your MQTT Broker
const mqttClient = mqtt.connect('mqtt://your-broker-address');

mqttClient.on('connect', () => {
  console.log('Connected to MQTT Broker');
  mqttClient.subscribe('device/data'); // Replace with your topic
});

mqttClient.on('message', (topic, message) => {
  const payload = JSON.parse(message.toString());
  
  // Push data to Realtime Database
  db.ref('sensor_data').push({
    topic: topic,
    value: payload,
    timestamp: admin.database.ServerValue.TIMESTAMP
  });
});

//      HTTP CONNECT 

import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

const firebaseConfig = {
  databaseURL: "https://instant-ee26-default-rtdb.firebaseio.com",
  // Add your other web app config details here
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const dataRef = ref(database, 'sensor_data');
onValue(dataRef, (snapshot) => {
  const data = snapshot.val();
  console.log("Realtime data update:", data);
  // Update your website's UI here
});

