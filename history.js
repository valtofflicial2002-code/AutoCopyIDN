// =========================================================
// AUTOCOPYIDN - DASHBOARD ENGINE (OPTIMAL & SINKRON)
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
    loadHistoryData();
    initFilterEvents();
    initClearEvent();
    initAgentEvent(); 
});

chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes.history) {
        loadHistoryData();
    }
});

function escapeHTML(str) {
    if (!str) return "-";
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}

async function loadHistoryData(filterType = "all") {
    const tbody = document.getElementById("history-table-body");
    const emptyState = document.getElementById("empty-notification");
    
    if (!tbody) return;
    tbody.innerHTML = ""; 

    const storage = await chrome.storage.local.get(["history"]);
    let historyList = storage.history || [];

    const filteredList = historyList.filter(item => {
        if (filterType === "all") return true;
        // Gunakan deteksiMode yang sudah dioptimalkan
        return deteksiMode(item).toLowerCase() === filterType.toLowerCase();
    });

    if (filteredList.length === 0) {
        emptyState.style.display = "block";
        return;
    } else {
        emptyState.style.display = "none";
    }

    filteredList.forEach(item => {
        const tr = document.createElement("tr");
        const mode = deteksiMode(item);
        
        // Perbaikan: Ambil keterangan langsung dari item, jangan menebak
        let displayKeterangan = escapeHTML((item.keterangan || "").toUpperCase());

        // Logika tampilan keterangan agar lebih bersih
        if (mode === "DEPOSIT" || mode === "WITHDRAW") {
            displayKeterangan = "-";
        }

        let rawWaktu = item.waktuCopy || "-";
        let formatWaktu = rawWaktu.replace(/,/g, "").replace(/\./g, ":"); 
        const safeWaktu = escapeHTML(formatWaktu);

        const safeHost = item.url ? escapeHTML(new URL(item.url).hostname) : "-";
        const safeUsername = escapeHTML((item.username || "").replace(/add_alert|remove_circle/gi, "").trim());
        const safeAkun = escapeHTML((item.akun || "").replace(/add_alert|remove_circle/gi, "").trim());
        
        // Perbaikan parsing jumlah: hapus semua selain angka
        let rawJumlah = (item.jumlah || "").toString().replace(/[^0-9]/g, "");
        let formatJumlah = rawJumlah ? parseInt(rawJumlah, 10).toLocaleString("id-ID") : "-";
        const safeJumlah = escapeHTML(formatJumlah);

        tr.innerHTML = `
            <td>${safeWaktu}</td>
            <td>${safeHost}</td>
            <td>${safeUsername}</td>
            <td>${safeAkun}</td>
            <td>${safeJumlah}</td> 
            <td><span class="badge badge-${mode.toLowerCase()}">${mode}</span></td>
            <td>${displayKeterangan}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- FUNGSI DETEKSI MODE (SUMBER KEBENARAN) ---
function deteksiMode(item) {
    // Jika content.js sudah menentukan mode, gunakan itu 100%
    if (item.mode) return item.mode.toUpperCase();

    // Fallback jika tidak ada data mode (untuk data lama)
    let ket = (item.keterangan || "").toUpperCase().trim();
    if (ket.includes("BONUS") || ket.includes("PROMOSI")) return "BONUS";
    if (ket.includes("WITHDRAW")) return "WITHDRAW";
    if (/^\d{12,20}$/.test(ket)) return "PULSA";
    
    return "DEPOSIT"; 
}

// --- FUNGSI EVENT LAINNYA ---
function initFilterEvents() {
    document.querySelectorAll(".btn-filter").forEach(btn => {
        btn.addEventListener("click", function() {
            document.querySelectorAll(".btn-filter").forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            loadHistoryData(this.getAttribute("data-filter"));
        });
    });
}

async function initClearEvent() {
    const btnClear = document.getElementById("clear-history");
    if (btnClear) {
        btnClear.addEventListener("click", async () => {
            if (confirm("Hapus seluruh riwayat data?")) {
                await chrome.storage.local.set({ history: [] });
                loadHistoryData();
            }
        });
    }
}

async function initAgentEvent() {
    const btnSetAgent = document.getElementById("set-agent");
    if (btnSetAgent) {
        btnSetAgent.addEventListener("click", async () => {
            const data = await chrome.storage.local.get(["namaAgent"]);
            let namaLama = data.namaAgent || "";
            let namaBaru = prompt("Masukkan Nama Agent:", namaLama);
            if (namaBaru !== null && namaBaru.trim() !== "") {
                await chrome.storage.local.set({ namaAgent: namaBaru.trim() });
            }
        });
    }
}