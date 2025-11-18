// ==============================
// CONFIG MQTT
// ==============================
const MQTT_OPTIONS = {
  clean: true,
  connectTimeout: 4000,
  reconnectPeriod: 3000,
};

// BROKER PUBLIK (langsung bisa konek)
const MQTT_URL = "wss://broker.hivemq.com:8884/mqtt";

// TOPIC
const TOPIC_SENSOR = "kebun/sensor/kelembapan";
const TOPIC_POMPA = "kebun/control/pompa";

// CONNECT
const client = mqtt.connect(MQTT_URL, MQTT_OPTIONS);

client.on("connect", () => {
  console.log("✓ MQTT Connected");
  client.subscribe(TOPIC_SENSOR);
});

// ==============================
// TERIMA DATA SENSOR DARI ESP32
// ==============================
client.on("message", (topic, payload) => {
  if (topic === TOPIC_SENSOR) {
    const value = parseInt(payload.toString());
    console.log("Kelembapan:", value);

    // Update grafik kamu di sini:
    updateMoistureChart(value);

    // Update indikator kondisi
    updateMoistureStatus(value);

    // Masukkan riwayat
    addHistoryItem(value);
  }
});

// ==============================
// KIRIM PERINTAH KE ESP32 (Tombol di Web)
// ==============================
function pompaOn() {
  client.publish(TOPIC_POMPA, "1");
  console.log("Pompa hidup");
}

function pompaOff() {
  client.publish(TOPIC_POMPA, "0");
  console.log("Pompa mati");
}

// Contoh untuk button HTML
document.getElementById("testBtn").addEventListener("click", () => {
  pompaOn();       // klik = ON
  setTimeout(pompaOff, 2000); // 2 detik → OFF otomatis
});

// =====================================================
// ==== FUNGSI UNTUK UPDATE DASHBOARD (BUAT MU SENDIRI)
// =====================================================

// Update grafik
function updateMoistureChart(value) {
  moistureChart.data.labels.push(new Date().toLocaleTimeString());
  moistureChart.data.datasets[0].data.push(value);
  moistureChart.update();
}

// Status penyiraman / kondisi tanah
function updateMoistureStatus(value) {
  const indikator = document.getElementById("status-indikator");
  indikator.style.backgroundColor = value < 30 ? "red" : "limegreen";
}

// Riwayat
function addHistoryItem(value) {
  const h = document.getElementById("history");
  const div = document.createElement("div");
  div.className = "history-item";

  div.innerHTML = `
    <span>${new Date().toLocaleTimeString()}</span>
    <span>${value}%</span>
    <span>${value < 30 ? "Kering" : "Normal"}</span>
  `;

  h.prepend(div);
}
