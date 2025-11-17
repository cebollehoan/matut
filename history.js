// Dummy data history per hari
const historyData = {
  "Senin": [
    { time: "07:00", tanggal: "10-11-2025", kondisi: "Kering", aksi: "Siram" },
    { time: "10:30", tanggal: "10-11-2025", kondisi: "Lembab", aksi: "-" },
    { time: "15:00", tanggal: "10-11-2025", kondisi: "Kering", aksi: "Siram" }
  ],
  "Selasa": [
    { time: "08:00", tanggal: "11-11-2025", kondisi: "Basah", aksi: "-" },
    { time: "13:00", tanggal: "11-11-2025", kondisi: "Lembab", aksi: "-" }
  ],
  "Rabu": [
    { time: "06:30", tanggal: "12-11-2025", kondisi: "Kering", aksi: "Siram" }
  ]
};

// Menangani klik tombol hari
document.querySelectorAll(".day-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".day-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const selectedDay = btn.dataset.day;
    showHistory(selectedDay);
  });
});

// Menampilkan data ke tampilan
function showHistory(day) {
  const dayTitle = document.getElementById("day-title");
  const dayDataDiv = document.getElementById("day-data");
  const data = historyData[day] || [];

  dayTitle.textContent = `Data Hari ${day}`;
  dayDataDiv.innerHTML = "";

  if (data.length === 0) {
    dayDataDiv.innerHTML = "<p>Belum ada data untuk hari ini.</p>";
    return;
  }

  data.forEach(item => {
    const row = document.createElement("div");
    row.className = "data-item";
    row.innerHTML = `
      <span>${item.tanggal}</span>
      <span>${item.time}</span>
      <span>${item.kondisi}</span>
      <span>${item.aksi}</span>
    `;
    dayDataDiv.appendChild(row);
  });
}

// Tampilkan default (Senin)
showHistory("Senin");
