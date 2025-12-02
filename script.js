// ==============================
// MQTT DASHBOARD FINAL (EMQX)
// ==============================

// ==============================
// DEFAULT BROKER EMQX
// ==============================
let MQTT_URL = "wss://be18723f.ala.eu-central-1.emqxsl.com:8084/mqtt";

// ==============================
// MQTT OPTIONS
// ==============================
let MQTT_OPTIONS = {
  clean: true,
  connectTimeout: 5000,
  reconnectPeriod: 3000,
  // Jika EMQX pakai auth:
  // username: "your-user",
  // password: "your-pass",
};

let client = null;

// ==============================
// TOPICS (REAL ESP32)
// ==============================
const TOPIC_SENSOR = "kebun/sensor/kelembapan";
const TOPIC_POMPA_CTRL = "kebun/control/pompa";
const TOPIC_POMPA_STAT = "kebun/status/pompa";
const TOPIC_KALIB = "kebun/control/kalibrasi";
const TOPIC_THRESHOLD = "kebun/control/threshold";
const TOPIC_MODE = "kebun/control/mode";
const TOPIC_WARNING = "kebun/status/warning";
const TOPIC_LOG = "kebun/log/kelembapan";
const TOPIC_HEARTBEAT = "kebun/status/heartbeat";

// ==============================
// UI ELEMENTS
// ==============================
const statusIndikator = document.getElementById("status-indikator");
const warningArea = document.getElementById("warningArea");

// ==============================
// CONNECT BUTTON HANDLER
// ==============================
document.getElementById("connectBtn").onclick = () => {
  MQTT_URL = document.getElementById("brokerUrl").value;

  console.log("Connecting to:", MQTT_URL);

  client = mqtt.connect(MQTT_URL, MQTT_OPTIONS);

  setupClientEvents();
};

// ==============================
// DISCONNECT BUTTON HANDLER
// ==============================
document.getElementById("disconnectBtn").onclick = () => {
  if (client) {
    client.end(true);
    console.log("Disconnected manually");
    setStatus(false);
  }
};

// ==============================
// SETUP MQTT EVENT HANDLERS
// ==============================
function setupClientEvents() {
  client.on("connect", () => {
    console.log("✓ Connected to EMQX");
    setStatus(true);

    client.subscribe(TOPIC_SENSOR);
    client.subscribe(TOPIC_POMPA_STAT);
    client.subscribe(TOPIC_WARNING);
    client.subscribe(TOPIC_LOG);
    client.subscribe(TOPIC_HEARTBEAT);
  });

  client.on("reconnect", () => {
    console.log("Reconnecting...");
  });

  client.on("close", () => {
    setStatus(false);
  });

  client.on("error", (err) => {
    console.log("MQTT Error:", err);
  });

  client.on("message", mqttMessageHandler);
}

// ==============================
// MQTT MESSAGE HANDLER
// ==============================
function mqttMessageHandler(topic, payload) {
  const msg = payload.toString();
  console.log(topic + " → " + msg);

  if (topic === TOPIC_SENSOR) {
    try {
      const j = JSON.parse(msg);
      updateDashboard(j.raw, j.percent);
    } catch (e) {
      console.warn("Sensor JSON error:", e);
    }
  }

  if (topic === TOPIC_POMPA_STAT) {
    const pump = document.getElementById("pumpStatus");
    if (msg === "1" || msg === "ON") {
      pump.textContent = "ON";
      pump.classList.remove("status-red");
      pump.classList.add("status-green");
    } else {
      pump.textContent = "OFF";
      pump.classList.add("status-red");
      pump.classList.remove("status-green");
    }
  }

  if (topic === TOPIC_WARNING) {
    warningArea.textContent = msg;
  }

  if (topic === TOPIC_LOG) {
    try {
      const j = JSON.parse(msg);
      if (j.count !== undefined) {
        document.getElementById("countVal").textContent = j.count;
      }
    } catch {}
  }
}

// ==============================
// SEND COMMANDS
// ==============================
document.getElementById("btnPumpOn").onclick = () => {
  client.publish(TOPIC_POMPA_CTRL, "ON");
};

document.getElementById("btnPumpOff").onclick = () => {
  client.publish(TOPIC_POMPA_CTRL, "OFF");
};

document.getElementById("btnModeAuto").onclick = () => {
  client.publish(TOPIC_MODE, "AUTO");
};

document.getElementById("btnModeManual").onclick = () => {
  client.publish(TOPIC_MODE, "MANUAL");
};

document.getElementById("btnKalib").onclick = () => {
  const val = document.getElementById("kalibInput").value;
  client.publish(TOPIC_KALIB, val);
};

document.getElementById("btnThreshold").onclick = () => {
  const val = document.getElementById("thresholdInput").value;
  client.publish(TOPIC_THRESHOLD, val);
};

// ==============================
// STATUS UI HELPER
// ==============================
function setStatus(isConnected) {
  if (isConnected) {
    statusIndikator.style.background = "limegreen";
  } else {
    statusIndikator.style.background = "gray";
  }
}

// ==============================
// CHART.JS SETUP
// ==============================
const ctx1 = document.getElementById("moistureChart").getContext("2d");
const moistureChart = new Chart(ctx1, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Kelembapan Tanah (%)",
        data: [],
        borderColor: "#a56cff",
        backgroundColor: "rgba(165,108,255,0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  },
  options: { responsive: true },
});

const ctx2 = document.getElementById("pieChart").getContext("2d");
const pieChart = new Chart(ctx2, {
  type: "pie",
  data: {
    labels: ["Kering", "Lembab", "Basah"],
    datasets: [{ data: [0, 0, 0] }],
  },
});

// ==============================
// UPDATE DASHBOARD DATA
// ==============================
function updateDashboard(rawValue, percentValue) {
  document.getElementById("rawVal").textContent = rawValue;
  document.getElementById("percentVal").textContent = percentValue;

  // === LINE CHART ===
  const now = new Date().toLocaleTimeString("id-ID");
  moistureChart.data.labels.push(now);
  moistureChart.data.datasets[0].data.push(percentValue);

  if (moistureChart.data.labels.length > 15) {
    moistureChart.data.labels.shift();
    moistureChart.data.datasets[0].data.shift();
  }

  moistureChart.update();

  // === PIE CHART ===
  pieChart.data.datasets[0].data = [
    percentValue < 40 ? 100 : 0,
    percentValue >= 40 && percentValue < 70 ? 100 : 0,
    percentValue >= 70 ? 100 : 0,
  ];
  pieChart.update();
}
