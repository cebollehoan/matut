// ==============================
// MQTT CONFIG
// ==============================
const MQTT_OPTIONS = {
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 3000,
};

const MQTT_URL = "wss://broker.hivemq.com:8884/mqtt";

const TOPIC_SENSOR = "kebun/sensor/kelembapan";
const TOPIC_POMPA  = "kebun/control/pompa";

const client = mqtt.connect(MQTT_URL, MQTT_OPTIONS);

// ==============================
// CHART.JS - LINE CHART (KELEMBAPAN)
// ==============================
const ctx1 = document.getElementById("moistureChart").getContext("2d");
const moistureChart = new Chart(ctx1, {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "Kelembapan Tanah (%)",
      data: [],
      borderColor: "#a56cff",
      backgroundColor: "rgba(165, 108, 255, 0.2)",
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  },
  options: {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: { display: true, text: "Kelembapan (%)" }
      },
      x: {
        title: { display: true, text: "Waktu (Jam)" }
      }
    },
    plugins: {
      legend: {
        labels: { color: "white" }
      }
    }
  }
});

// ==============================
// PIE CHART
// ==============================
const ctx2 = document.getElementById("pieChart").getContext("2d");
const pieChart = new Chart(ctx2, {
  type: "pie",
  data: {
    labels: ["Kering", "Lembab", "Basah"],
    datasets: [{
      data: [40, 30, 30],
      backgroundColor: ["#8b5cf6", "#a78bfa", "#c4b5fd"]
    }]
  }
});

// ==============================
// MQTT CONNECT
// ==============================
client.on("connect", () => {
  console.log("✓ MQTT Connected");
  client.subscribe(TOPIC_SENSOR);
});

// ==============================
// TERIMA DATA SENSOR DARI MQTT
// ==============================
client.on("message", (topic, payload) => {
  if (topic === TOPIC_SENSOR) {
    const value = parseInt(payload.toString());
    console.log("Data diterima:", value);

    updateDashboard(value);
  }
});

// ==============================
// KIRIM PERINTAH POMPA KE ESP32
// ==============================
function pompaOn() {
  client.publish(TOPIC_POMPA, "1");
  console.log("Pompa ON");
}

function pompaOff() {
  client.publish(TOPIC_POMPA, "0");
  console.log("Pompa OFF");
}

document.getElementById("testBtn").addEventListener("click", () => {
  pompaOn();
  setTimeout(pompaOff, 2000);
});

// ==============================
// UPDATE DASHBOARD (FINAL)
// ==============================
function updateDashboard(moistureValue) {

  const now = new Date();
  const timeLabel = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  // Tentukan kondisi tanah
  let condition = "";
  if (moistureValue < 40) condition = "Kering";
  else if (moistureValue < 70) condition = "Lembab";
  else condition = "Basah";

  // === UPDATE LINE CHART ===
  moistureChart.data.labels.push(timeLabel);
  moistureChart.data.datasets[0].data.push(moistureValue);

  if (moistureChart.data.labels.length > 10) {
    moistureChart.data.labels.shift();
    moistureChart.data.datasets[0].data.shift();
  }
  moistureChart.update();

  // === UPDATE PIE CHART ===
  pieChart.data.datasets[0].data = [
    100 - moistureValue,             // Kering
    Math.floor(moistureValue / 2),   // Lembab
    moistureValue                    // Basah
  ];
  pieChart.update();

  // === INDIKATOR STATUS ===
  const indikator = document.getElementById("status-indikator");
  indikator.style.backgroundColor = moistureValue < 40 ? "red" : "limegreen";

  // === HISTORY ===
  const historyDiv = document.getElementById("history");
  const item = document.createElement("div");
  item.className = "history-item";

  item.innerHTML = `
    <span>${now.toLocaleDateString("id-ID")}</span>
    <span>${timeLabel}</span>
    <span>${condition}</span>
    <span>${moistureValue < 40 ? "Siram" : "-"}</span>
  `;

  historyDiv.prepend(item);

  // Batasi 15 item history
  if (historyDiv.children.length > 15) {
    historyDiv.removeChild(historyDiv.lastChild);
  }
}
