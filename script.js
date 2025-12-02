// ==============================
// MQTT DASHBOARD FINAL (MATCH ESP32)
// ==============================

// ==============================
// FIXED EMQX WEBSOCKET TLS URL
// ==============================
let MQTT_URL = "wss://be18723f.ala.eu-central-1.emqxsl.com:8084/mqtt";

// ==============================
// MQTT OPTIONS (AUTH = SAMA SEPERTI ESP32)
// ==============================
let MQTT_OPTIONS = {
  username: "matutu",
  password: "makresslariss",
  clean: true,
  reconnectPeriod: 2000,
  connectTimeout: 5000
};

let client = null;

// ==============================
// TOPICS (100% MATCH ESP32)
// ==============================
const TOPIC_SENSOR      = "kebun/sensor/kelembapan";
const TOPIC_POMPA_CTRL  = "kebun/control/pompa";
const TOPIC_POMPA_STAT  = "kebun/status/pompa";
const TOPIC_KALIB       = "kebun/control/kalibrasi";
const TOPIC_THRESHOLD   = "kebun/control/threshold";
const TOPIC_MODE        = "kebun/control/mode";
const TOPIC_WARNING     = "kebun/status/warning";
const TOPIC_LOG         = "kebun/log/kelembapan";
const TOPIC_HEARTBEAT   = "kebun/status/heartbeat";

// ==============================
// UI ELEMENTS
// ==============================
const statusIndikator = document.getElementById("status-indikator");
const warningArea = document.getElementById("warningArea");

// ==============================
// CONNECT BUTTON
// ==============================
document.getElementById("connectBtn").onclick = () => {
  MQTT_URL = document.getElementById("brokerUrl").value;

  client = mqtt.connect(MQTT_URL, MQTT_OPTIONS);
  setupClientEvents();
};

// ==============================
// DISCONNECT BUTTON
// ==============================
document.getElementById("disconnectBtn").onclick = () => {
  if (client) {
    client.end(true);
    setStatus(false);
    console.log("Disconnected");
  }
};

// ==============================
// MQTT EVENT LISTENER SETUP
// ==============================
function setupClientEvents() {
  client.on("connect", () => {
    console.log("✓ MQTT Connected");
    setStatus(true);

    // WAJIB SESUAI ESP32
    client.subscribe(TOPIC_SENSOR);
    client.subscribe(TOPIC_POMPA_STAT);
    client.subscribe(TOPIC_WARNING);
    client.subscribe(TOPIC_LOG);
    client.subscribe(TOPIC_HEARTBEAT);
  });

  client.on("reconnect", () => console.log("Reconnecting..."));
  client.on("close", () => setStatus(false));
  client.on("error", err => console.log("Error:", err));
  client.on("message", mqttMessageHandler);
}

// ==============================
// MQTT MESSAGE HANDLER
// ==============================
function mqttMessageHandler(topic, payload) {
  let msg = payload.toString();
  console.log(topic + " → " + msg);

  // === SENSOR ===
  if (topic === TOPIC_SENSOR) {
    try {
      const j = JSON.parse(msg);
      updateDashboard(j.raw, j.percent);
    } catch (e) {
      console.warn("JSON Error:", e);
    }
  }

  // === STATUS POMPA ===
  if (topic === TOPIC_POMPA_STAT) {
    const el = document.getElementById("pumpStatus");

    if (msg === "1" || msg === "ON") {
      el.textContent = "ON";
      el.classList.add("status-green");
      el.classList.remove("status-red");
    } else {
      el.textContent = "OFF";
      el.classList.add("status-red");
      el.classList.remove("status-green");
    }
  }

  // === WARNING ===
  if (topic === TOPIC_WARNING) {
    warningArea.textContent = msg;
  }

  // === LOG ===
  if (topic === TOPIC_LOG) {
    try {
      const j = JSON.parse(msg);
      if (j.percent !== undefined) {
        document.getElementById("countVal").textContent = j.count || "-";
      }
    } catch {}
  }
}

// ==============================
// COMMAND BUTTONS
// ==============================
document.getElementById("btnPumpOn").onclick   = () => client.publish(TOPIC_POMPA_CTRL, "ON");
document.getElementById("btnPumpOff").onclick  = () => client.publish(TOPIC_POMPA_CTRL, "OFF");

document.getElementById("btnModeAuto").onclick   = () => client.publish(TOPIC_MODE, "AUTO");
document.getElementById("btnModeManual").onclick = () => client.publish(TOPIC_MODE, "MANUAL");

document.getElementById("btnKalib").onclick = () => {
  client.publish(TOPIC_KALIB, document.getElementById("kalibInput").value);
};

document.getElementById("btnThreshold").onclick = () => {
  client.publish(TOPIC_THRESHOLD, document.getElementById("thresholdInput").value);
};

// ==============================
// STATUS UI
// ==============================
function setStatus(isOK) {
  statusIndikator.style.background = isOK ? "lime" : "gray";
}

// ==============================
// CHART.JS SETUP
// ==============================
const ctx1 = document.getElementById("moistureChart").getContext("2d");
const moistureChart = new Chart(ctx1, {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "Kelembapan (%)",
      data: [],
      borderColor: "#a56cff",
      backgroundColor: "rgba(165,108,255,0.3)",
      fill: true,
      tension: 0.4
    }]
  }
});

const ctx2 = document.getElementById("pieChart").getContext("2d");
const pieChart = new Chart(ctx2, {
  type: "pie",
  data: {
    labels: ["Kering", "Normal", "Basah"],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ["#ff6666", "#ffaa00", "#66ff99"]
    }]
  }
});

// ==============================
// UPDATE DASHBOARD
// ==============================
function updateDashboard(rawValue, percentValue) {
  document.getElementById("rawVal").textContent = rawValue;
  document.getElementById("percentVal").textContent = percentValue;

  // === UPDATE LINE CHART ===
  const now = new Date().toLocaleTimeString();
  moistureChart.data.labels.push(now);
  moistureChart.data.datasets[0].data.push(percentValue);

  if (moistureChart.data.labels.length > 20) {
    moistureChart.data.labels.shift();
    moistureChart.data.datasets[0].data.shift();
  }

  moistureChart.update();

  // === UPDATE PIE CHART ===
  pieChart.data.datasets[0].data = [
    percentValue < 40 ? 100 : 0, 
    percentValue >= 40 && percentValue < 70 ? 100 : 0,
    percentValue >= 70 ? 100 : 0
  ];
  pieChart.update();
}
