// ==============================
// FINAL MQTT DASHBOARD (DATA RILL)
// Tampilan sama seperti kode awal, namun menggunakan data asli (raw + percent)
// ==============================

// ==============================
// MQTT CONFIG
// ==============================
const MQTT_OPTIONS = {
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 3000,
};

const MQTT_URL = "wss://broker.hivemq.com:8884/mqtt";

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
// CHART.JS - LINE CHART (KELEMBAPAN)
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
        backgroundColor: "rgba(165, 108, 255, 0.2)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: { display: true, text: "Kelembapan (%)" },
      },
      x: {
        title: { display: true, text: "Waktu (Jam)" },
      },
    },
    plugins: {
      legend: {
        labels: { color: "white" },
      },
    },
  },
});

// ==============================
// PIE CHART (STATUS TANAH REAL)
// ==============================
const ctx2 = document.getElementById("pieChart").getContext("2d");
const pieChart = new Chart(ctx2, {
  type: "pie",
  data: {
    labels: ["Kering", "Lembab", "Basah"],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ["#8b5cf6", "#a78bfa", "#c4b5fd"],
      },
    ],
  },
});

// ==============================
// MQTT CONNECT
// ==============================
const client = mqtt.connect(MQTT_URL, MQTT_OPTIONS);

client.on("connect", () => {
  console.log("✓ MQTT Connected");
  client.subscribe(TOPIC_SENSOR);
  client.subscribe(TOPIC_POMPA_STAT);
  client.subscribe(TOPIC_WARNING);
  client.subscribe(TOPIC_LOG);
  client.subscribe(TOPIC_HEARTBEAT);
});

// ==============================
// MQTT RECEIVE MESSAGE
// ==============================
client.on("message", (topic, payload) => {
  const msg = payload.toString();
  console.log(topic + " → " + msg);

  if (topic === TOPIC_SENSOR) {
    try {
      const j = JSON.parse(msg);
      updateDashboard(j.raw, j.percent);
    } catch (e) {
      console.log("Error parsing JSON sensor", e);
    }
  }

  if (topic === TOPIC_POMPA_STAT) {
    const pumpStatus = document.getElementById("pumpStatusReal");
    if (msg === "1" || msg === "ON") {
      pumpStatus.textContent = "ON";
      pumpStatus.style.color = "lime";
    } else {
      pumpStatus.textContent = "OFF";
      pumpStatus.style.color = "red";
    }
  }

  if (topic === TOPIC_WARNING) {
    document.getElementById("warningArea").textContent = msg;
  }

  if (topic === TOPIC_LOG) {
    try {
      const j = JSON.parse(msg);
      if (j.count !== undefined) {
        document.getElementById("countVal").textContent = j.count;
      }
    } catch (e) {}
  }
});

// ==============================
// KIRIM PERINTAH POMPA KE ESP32
// ==============================
function pompaOn() {
  client.publish(TOPIC_POMPA_CTRL, "ON");
  console.log("Pompa ON (manual)");
}

function pompaOff() {
  client.publish(TOPIC_POMPA_CTRL, "OFF");
  console.log("Pompa OFF (manual)");
}

document.getElementById("testBtn").addEventListener("click", () => {
  pompaOn();
  setTimeout(pompaOff, 2000);
});

// ==============================
// UPDATE DASHBOARD (REAL DATA)
// ==============================
function updateDashboard(rawValue, percentValue) {
  document.getElementById("rawVal").textContent = rawValue;
  document.getElementById("percentVal").textContent = percentValue;

  const now = new Date();
  const timeLabel = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Tentukan kondisi berdasarkan data % asli
  let condition = percentValue < 40 ? "Kering" : percentValue < 70 ? "Lembab" : "Basah";

  // === UPDATE LINE CHART ===
  moistureChart.data.labels.push(timeLabel);
  moistureChart.data.datasets[0].data.push(percentValue);

  if (moistureChart.data.labels.length > 15) {
    moistureChart.data.labels.shift();
    moistureChart.data.datasets[0].data.shift();
  }

  moistureChart.update();

  // === UPDATE PIE CHART ===
  pieChart.data.datasets[0].data = [
    percentValue < 40 ? 100 : 0,
    percentValue >= 40 && percentValue < 70 ? 100 : 0,
    percentValue >= 70 ? 100 : 0,
  ];
  pieChart.update();

  // === INDIKATOR STATUS ===
  const indikator = document.getElementById("status-indikator");
  indikator.style.backgroundColor = percentValue < 40 ? "red" : "limegreen";

  // === HISTORY ===
  const historyDiv = document.getElementById("history");
  const item = document.createElement("div");
  item.className = "history-item";

  item.innerHTML = `
    <span>${now.toLocaleDateString("id-ID")}</span>
    <span>${timeLabel}</span>
    <span>${condition}</span>
    <span>${percentValue}%</span>
  `;

  historyDiv.prepend(item);

  if (historyDiv.children.length > 15) {
    historyDiv.removeChild(historyDiv.lastChild);
  }
}