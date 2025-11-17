// === INISIALISASI GRAFIK LINE (KELEMBAPAN) ===
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

// === INISIALISASI PIE CHART ===
const ctx2 = document.getElementById("pieChart").getContext("2d");
const pieChart = new Chart(ctx2, {
  type: "pie",
  data: {
    labels: ["Kering", "Lembab", "Basah"],
    datasets: [{
      data: [60, 30, 10],
      backgroundColor: ["#8b5cf6", "#a78bfa", "#c4b5fd"]
    }]
  }
});

// === UPDATE DASHBOARD ===
function updateDashboard(data) {
  const now = new Date();
  const timeLabel = now.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  // Update line chart
  moistureChart.data.labels.push(timeLabel);
  moistureChart.data.datasets[0].data.push(data.moistureValue);

  if (moistureChart.data.labels.length > 10) {
    moistureChart.data.labels.shift();
    moistureChart.data.datasets[0].data.shift();
  }

  moistureChart.update();

  // Update pie chart
  pieChart.data.datasets[0].data = [data.kering, data.lembab, data.basah];
  pieChart.update();

  // Update indikator status
  const indikator = document.getElementById("status-indikator");
  indikator.style.backgroundColor = data.isWatering ? "limegreen" : "red";

  // Update history
  const historyDiv = document.getElementById("history");
  const item = document.createElement("div");
  item.className = "history-item";
  item.innerHTML = `
    <span>${now.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })}</span>
    <span>${now.toLocaleTimeString("id-ID")}</span>
    <span>${data.condition}</span>
    <span>${data.isWatering ? "Siram" : "-"}</span>
  `;

  historyDiv.prepend(item);

  // Limit maksimal 15 history
  if (historyDiv.children.length > 15) {
    historyDiv.removeChild(historyDiv.lastChild);
  }
}

// === SIMULASI DUMMY DATA SETIAP 5 DETIK ===
setInterval(() => {
  const dummyValue = Math.floor(Math.random() * 100);
  const dummyData = {
    moistureValue: dummyValue,
    kering: 100 - dummyValue,
    lembab: Math.floor(dummyValue / 2),
    basah: Math.floor(dummyValue / 3),
    isWatering: dummyValue < 40, // Menyiram kalau kelembapan < 40%
    condition:
      dummyValue < 40
        ? "Kering"
        : dummyValue < 70
        ? "Lembab"
        : "Basah",
  };
  updateDashboard(dummyData);
}, 5000);

// === TEST BUTTON (MANUAL SIRAM) ===
document.getElementById("testBtn").addEventListener("click", () => {
  const indikator = document.getElementById("status-indikator");
  const isGreen = indikator.style.backgroundColor === "limegreen";
  indikator.style.backgroundColor = isGreen ? "red" : "limegreen";
});
