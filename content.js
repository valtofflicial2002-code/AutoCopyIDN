// =========================================
// AUTOCOPYIDN CONTENT.JS
// FINAL ULTRA STABLE VERSION - ARCHITECTURE FIXED
// =========================================

console.log("✅ AUTOCOPYIDN LOADED");

// =========================================
// TARGET URL
// =========================================
const TARGET_URL = /^https:\/\/agent\.idns889\.com\/(deposit|withdraw)\/pending/i;

// =========================================
// GLOBAL
// =========================================
let observer = null;
let notifyTimeout = null;
let isRendering = false;

// =========================================
// PAGE DETECTOR
// =========================================
function getPageType() {
    if (/\/deposit\/pending/i.test(location.href)) return "deposit";
    if (/\/withdraw\/pending/i.test(location.href)) return "withdraw";
    return null;
}

// =========================================
// SAFE STORAGE
// =========================================
async function getStorage(keys = []) {
    try {
        if (
            typeof chrome !== "undefined" &&
            chrome.storage &&
            chrome.storage.local
        ) {
            return await chrome.storage.local.get(keys);
        }
    } catch (err) {
        console.log("❌ STORAGE ERROR:", err);
    }

    return {
        mode: "bonus",
        enabled: true
    };
}

// =========================================
// START DIRECTIVES
// =========================================
if (TARGET_URL.test(location.href)) {
    initExtension();
}

// =========================================
// INIT EXTENSION
// =========================================
async function initExtension() {
    const storage = await getStorage(["mode", "enabled"]);

    const enabled = storage.enabled ?? true;
    const mode = storage.mode || "bonus";

    if (!enabled) {
        console.log("❌ EXTENSION DISABLED");
        return;
    }

    console.log("✅ EXTENSION ACTIVE");

    const pageType = getPageType();
    if (!pageType) return;

    createButtons(mode, pageType);
    observeTable();
    autoClearCache();
}

// =========================================
// AUTO CLEAR CACHE
// =========================================
function autoClearCache() {
    try {
        if (window.autoClearCacheTimer) {
            clearInterval(window.autoClearCacheTimer);
        }

        window.autoClearCacheTimer = setInterval(() => {
            console.clear();

            if (window.performance && performance.clearResourceTimings) {
                performance.clearResourceTimings();
            }

            window.autoCopyRefresh = null;
            isRendering = false;

            console.log("🧹 CACHE CLEARED");
        }, 5 * 60 * 1000);
    } catch (err) {
        console.log("❌ AUTO CLEAR ERROR:", err);
    }
}

// =========================================
// OBSERVER SYSTEM
// =========================================
function observeTable() {
    if (observer) {
        observer.disconnect();
    }

    observer = new MutationObserver(async () => {
        if (isRendering) return;

        clearTimeout(window.autoCopyRefresh);

        window.autoCopyRefresh = setTimeout(async () => {
            const storage = await getStorage(["mode", "enabled"]);

            if (!storage.enabled) return;

            isRendering = true;
            removeButtons();
            createButtons(storage.mode || "bonus", getPageType());

            setTimeout(() => {
                isRendering = false;
            }, 100);
        }, 300);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// =========================================
// AUTO REFRESH ON MODE CHANGE
// =========================================
if (chrome?.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== "local") return;

        if (changes.mode || changes.enabled) {
            console.log("🔄 RELOAD MODE");
            location.reload();
        }
    });
}

// =========================================
// SYSTEM TOAST NOTIFICATION
// =========================================
function systemNotify() {
    const old = document.getElementById("autocopy-toast");
    if (old) old.remove();

    clearTimeout(notifyTimeout);

    const toast = document.createElement("div");
    toast.id = "autocopy-toast";
    toast.textContent = "🗸 COPIED";

    Object.assign(toast.style, {
        position: "fixed",
        top: "18px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#22c55e",
        color: "#fff",
        padding: "10px 16px",
        borderRadius: "8px",
        fontWeight: "700",
        fontSize: "14px",
        zIndex: "999999999",
        opacity: "0",
        transition: ".15s ease",
        pointerEvents: "none",
        boxShadow: "0 4px 10px rgba(0,0,0,.2)"
    });

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = "1";
    });

    notifyTimeout = setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => { toast.remove(); }, 200);
    }, 1000);
}

// =========================================
// DATE / TIME PARSERS
// =========================================
function getFormattedDate() {
    const d = new Date();
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function getFormattedTime() {
    return new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
    });
}

// =========================================
// ENGINE COPY TO CLIPBOARD
// =========================================
async function copyText(text, manualTime = null) {
    try {
        await navigator.clipboard.writeText(text);
        await new Promise(resolve => setTimeout(resolve, 100));

        const verify = await navigator.clipboard.readText();
        if (verify !== text) {
            console.log("❌ CLIPBOARD VERIFY FAILED");
            return;
        }

        console.log("🗸 COPIED:", text);
        
        // Kirim waktu saat ini sebagai kunci
        const waktuTepat = manualTime || new Date().toLocaleString("id-ID");
        saveCopyHistory(text, waktuTepat); 
        
        systemNotify();
    } catch (err) {
        console.log("✗ COPY FAILED:", err);
    }
}

// =========================================
// SAVE HISTORY & PARSER
// =========================================
async function saveCopyHistory(text, waktuTepat) {
    try {
        if (!text || text.trim() === "") return;

        const storage = await chrome.storage.local.get(["history"]);
        let history = storage.history || [];
        const parsed = parseCopy(text);

        history.unshift({
            text: text,
            username: parsed.username,
            akun: parsed.akun,
            jumlah: parsed.jumlah,
            waktuCopy: waktuTepat, 
            keterangan: parsed.keterangan,
            mode: parsed.mode, // Sekarang sudah benar mengambil dari parseCopy
            url: location.href,
            timestamp: Date.now()
        });

        if (history.length > 500) history.length = 500;
        await chrome.storage.local.set({ history });
    } catch (err) {
        console.error("Critical Save Error:", err);
    }
}

// Definisi fungsi bantu agar tidak error
function cleanNum(val) {
    if (!val) return "0";
    return val.toString().split('.')[0].replace(/[^0-9]/g, "");
}

function parseCopy(text) {
    const kolom = text.split("\t").map(v => v.trim());
    let username = "-", akun = "-", jumlah = "0", keterangan = "-", mode = "DEPOSIT";

    // 1. Logika WITHDRAW
    if (text.includes("AGENT") && text.includes("OK")) {
        mode = "WITHDRAW";
        keterangan = "WITHDRAW";
        username = kolom[7] || "-";
        akun = (kolom[0] + " " + (kolom[6] || "")).replace(/add_alert|remove_circle/gi, "").trim();
        jumlah = kolom[8] || "0";
    } 
    // 2. Logika BONUS
    else if (/\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\s+(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)/i.test(kolom[1])) {
        mode = "BONUS";
        
        // Mengambil kata pertama dari kolom 0 sebagai Keterangan
        // Misalnya "XTRAWINX1 21 Jun 5:14" -> ambil "XTRAWINX1"
        keterangan = kolom[0].split(" ")[0]; 
        
        akun = "PROMOSI";
        username = kolom[3] || "-"; 
        jumlah = kolom[kolom.length - 1] || "0";
    }
    // 3. Logika PULSA
    else if (/PS\b|Cellular|08\d{8,}/i.test(text) || text.match(/\d{12,20}/)) {
        mode = "PULSA";
        const idMatch = text.match(/\d{12,20}/);
        keterangan = idMatch ? idMatch[0] : "PULSA";
        akun = kolom[1] || "PULSA/EWALLET";
        username = kolom[3] || kolom[2] || "-";
        jumlah = kolom[kolom.length - 1] || "0";
    }
    // 4. Logika DEPOSIT (Default)
    else {
        mode = "DEPOSIT";
        keterangan = "-";
        akun = kolom[1] || "-";
        username = kolom[2] || "-";
        jumlah = kolom[kolom.length - 1] || "0";
    }

    return {
        username: username.replace(/add_alert|remove_circle/gi, "").trim(),
        akun: akun.replace(/add_alert|remove_circle/gi, "").trim(),
        jumlah: cleanNum(jumlah),
        keterangan: keterangan,
        mode: mode
    };
}

// =========================================
// TEXT CLEANING UTILITIES
// =========================================
function cleanText(text = "") {
    return text.replace(/1st deposit/gi, "").replace(/\s+/g, " ").trim();
}

function getText(row, index) {
    return cleanText(row?.cells?.[index]?.textContent || "");
}

// =========================================
// SHIFT BONUS LOGIC
// =========================================
function getTierShift(text = "") {
    const t = text.toUpperCase();
    if (t.includes("WTOBETHH")) return 12;
    if (t.includes("WEEKLY BONUS ROLLINGAN")) return 11;
    if (t.includes("VVIP") || t.includes("VIP")) return 9;
    if (t.includes("PLATINUM")) return 8;
    if (t.includes("DIAMOND")) return 7;
    if (t.includes("GOLD")) return 6;
    if (t.includes("SILVER")) return 5;
    if (t.includes("BRONZE")) return 4;
    if (/XTRAWINX1|XTRAWINX2|XTRABUYSPINX1|XTRABUYSPINX2/i.test(t)) return 3;
    if (t.includes("WTO100SO")) return 2;
    return 10;
}

// =========================================
// UI BUTTON GENERATOR
// =========================================
function createButton(text, color) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "autocopy-btn";
    btn.textContent = text;

    Object.assign(btn.style, {
        border: "none",
        borderRadius: "6px",
        padding: "8px 16px",
        background: color,
        color: "#fff",
        fontSize: "16px",
        fontWeight: "700",
        cursor: "pointer",
        transition: ".15s ease",
        boxShadow: "0 2px 6px rgba(0,0,0,.2)"
    });

    btn.addEventListener("mouseenter", () => { btn.style.transform = "scale(1.05)"; });
    btn.addEventListener("mouseleave", () => { btn.style.transform = "scale(1)"; });

    return btn;
}

function removeButtons() {
    document.querySelectorAll(".autocopy-btn").forEach(btn => btn.remove());
    document.querySelectorAll("tbody tr td:first-child").forEach(td => { td.dataset.autocopy = ""; });
}

// =========================================
// MAIN RENDER ENGINE (CORE FUNCTION FIX)
// =========================================
function createButtons(mode, pageType) {
    if (!pageType) return;

    const rows = document.querySelectorAll("tbody tr");

    rows.forEach(tr => {
        if (!tr.cells || tr.cells.length < 7) return;

        const cell = tr.cells[0];
        if (!cell) return;

        if (cell.dataset.autocopy === "done") return;

        cell.dataset.autocopy = "done";
        cell.textContent = "";

        // PERBAIKAN: Flexbox layout agar posisi tombol presisi di tengah kolom
        cell.style.display = "center";
        cell.style.alignItems = "center";
        cell.style.justifyContent = "center";

        const wrap = document.createElement("div");
        wrap.style.marginLeft = "8px";

// =====================================
// ALUR EXECUTE: HALAMAN WITHDRAW (FIXED)
// =====================================
const DAFTAR_BANK = /\b(ACEH|ACEH SYARIAH|AKULAKU|ALADIN|ALADIN SYARIAH|ALLOBANK|BANK BJB|BANK BUKOPIN|BANK DBS INDONESIA|BANK DKI|BANK HANA|BANK LAIN|BANK MUAMALAT INDONESIA|BANK NATIONAL NOBU|BANK NTT|BANK PAPUA|BANK RAYA|BCA|BCA DIGITAL|BCA SYARIAH|BII|BNI|BPD BALI|BPD DIY|BPD MALUKU|BRI|BSI|BTN|CIMB|DANA|DANAMON|DOKU|GOPAY|JAGO|JENIUS|KALBAR|KALSEL|INDOSAT|KALTIM|KOSPIN|LINKAJA|MANDIRI|MAYBANK|MEGA|MESTIKA|NEO|OTHERBANK|OVO|PANIN|PERMATA|QRIS|SAKUKU|SEABANK|SHOPEEPAY|SINARMAS|SMBC|SUPERBANK|TELKOMSEL|TRI|UOB|USDTTRC20|XL|ACB|AGRI|BIDV|DONGA|SACOM|TECHCOM|VCB|VIETIN)\b/i;

if (pageType === "withdraw") {
    const btn = createButton("WD", "#6f42c1");

    // Gunakan mousedown untuk respon instan dan matikan observer
    btn.addEventListener("mousedown", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // 1. Matikan observer agar tidak terjadi re-render saat proses
        if (observer) observer.disconnect();

        // 2. Logika data
        let namaAgent = localStorage.getItem("namaAgent") || "AGENT";
        const line1 = getText(tr, 2); 
        const username = getText(tr, 1);
        const nominal = getText(tr, 3);

        let bankRek = "";
        let namaRek = "";
        const match = line1.match(/^([a-zA-Z]+)\s+([\d\-]+)\s+(.+)/);

        if (match) {
            const cleanNoRek = match[2].replace(/\-/g, ""); 
            bankRek = `${match[1]} ${cleanNoRek}`;
            namaRek = match[3].trim(); 
        } else {
            bankRek = line1;
        }

        const now = new Date();
        const date = `${String(now.getDate()).padStart(2, "0")} ` +
                     `${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][now.getMonth()]} ` +
                     `${now.getFullYear()}`;

        const amount = parseInt(nominal.replace(/,/g, ""), 10) || 0;
        const cleanNominal = amount.toLocaleString("en-US");

        const result = [
            bankRek, "OK", namaAgent, "", date, "", namaRek, username, cleanNominal
        ].join("\t");

        // 3. Eksekusi copy
        const waktuKlik = new Date().toLocaleString("id-ID");
        await copyText(result, waktuKlik);

        // 4. Nyalakan kembali observer setelah jeda singkat
        setTimeout(() => {
            if (observer) observeTable();
        }, 300);
    });

    wrap.appendChild(btn);
    cell.appendChild(wrap);
    return; 
}

        // =====================================
        // ALUR EXECUTE: HALAMAN DEPOSIT
        // =====================================
        const col2Raw = tr?.cells?.[2]?.innerText || "";
        const col2 = col2Raw.toUpperCase();

        const lineCount = col2Raw
            .split(/\r?\n/)
            .map(v => v.trim())
            .filter(v => v.length > 0)
            .length;

        let rowMode = "bonus";

        if (col2.includes("TELKOMSEL") || col2.includes("XL") || col2.includes("AXIATA")) {
            rowMode = "pulsa";
        }
        else if (lineCount >= 2) {
            rowMode = "depo";
        }

        // --- SUB MAPPING DEPOSIT BUTTONS ---
        if (rowMode === "bonus") {
    const btn = createButton("BN", "#ff9800");

    btn.addEventListener("mousedown", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // 1. Matikan observer agar tidak terjadi konflik DOM saat proses
        if (observer) observer.disconnect();

        // 2. Logika pengambilan data
        const col6 = getText(tr, 6);
        const col1 = getText(tr, 1);
        const col3 = getText(tr, 3);

        const tabs = "\t".repeat(getTierShift(col6));
        const result = `${col6}\t${getFormattedDate()}\t${getFormattedTime()}\t${col1}${tabs}${col3}`;

        const waktuKlik = new Date().toLocaleString("id-ID");
        
        // 3. Eksekusi copy
        await copyText(result, waktuKlik);

        // 4. PENTING: Nyalakan kembali observer agar tabel tetap terpantau
        // Gunakan jeda singkat agar DOM stabil terlebih dahulu
        setTimeout(() => {
            if (observer) observeTable();
        }, 300);
    });

    wrap.appendChild(btn);
}
        else if (rowMode === "pulsa") {
    const btn = createButton("PS", "#ff1744");

    btn.addEventListener("mousedown", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // 1. Matikan observer agar stabil saat proses
        if (observer) observer.disconnect();

        // 2. Logika pengambilan data
        const kolom2 = tr.cells[2] || tr.querySelectorAll('td')[2];
        const nama = kolom2 ? kolom2.innerText.split('\n')[0].trim() : "";
        const username = getText(tr, 1);

        const result = `${getFormattedTime()}\t${nama}\t${getText(tr, 6)}\t${username}\t\t${getText(tr, 3)}`;

        // 3. Eksekusi copy
        const waktuKlik = new Date().toLocaleString("id-ID");
        await copyText(result, waktuKlik);

        // 4. Nyalakan kembali observer setelah jeda 300ms
        setTimeout(() => {
            if (observer) observeTable();
        }, 300);
    });

    wrap.appendChild(btn);
}
        else if (rowMode === "depo") {
    const btn = createButton("DP", "#007bff");

    btn.addEventListener("mousedown", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        // 1. Matikan observer agar tidak terjadi konflik saat proses
        if (observer) observer.disconnect();

        // 2. Logika pengambilan data
        const rawCell = tr.cells[2]?.innerText || "";
        const lines = rawCell.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
        const firstLine = lines[0] || "";

        let nama = firstLine
            .replace(/^(ACEH|ACEH SYARIAH|AKULAKU|ALADIN|ALADIN SYARIAH|ALLOBANK|BANK BJB|BANK BUKOPIN|BANK DBS INDONESIA|BANK DKI|BANK HANA|BANK LAIN|BANK MUAMALAT INDONESIA|BANK NATIONAL NOBU|BANK NTT|BANK PAPUA|BANK RAYA|BCA|BCA DIGITAL|BCA SYARIAH|BII|BNI|BPD BALI|BPD DIY|BPD MALUKU|BRI|BSI|BTN|CIMB|DANA|DANAMON|DOKU|GOPAY|JAGO|JENIUS|KALBAR|KALSEL|INDOSAT|KALTIM|KOSPIN|LINKAJA|MANDIRI|MAYBANK|MEGA|MESTIKA|NEO|OTHERBANK|OVO|PANIN|PERMATA|QRIS|SAKUKU|SEABANK|SHOPEEPAY|SINARMAS|SMBC|SUPERBANK|TELKOMSEL|TRI|UOB|USDTTRC20|XL|ACB|AGRI|BIDV|DONGA|SACOM|TECHCOM|VCB|VIETIN)[\s:-]*/i, "")
            .replace(/\d+[-\d]*/g, "")
            .replace(/^[\s:-]+|[\s:-]+$/g, "")
            .replace(/\s*-\s*/g, " ") 
            .replace(/\s+/g, " ")
            .trim();

        const username = getText(tr, 1);
        const detector = firstLine.toUpperCase();
        const isEwallet = /OVO|DANA|GOPAY|SHOPEEPAY|LINKAJA|QRIS/i.test(detector);

        const result = isEwallet
            ? `${getFormattedTime()}\t${nama}\t${username}\t\t${getText(tr, 3)}`
            : `${getFormattedTime()}\t${nama}\t${username}\t${getText(tr, 3)}`;

        // 3. Eksekusi copy
        const waktuKlik = new Date().toLocaleString("id-ID");
        await copyText(result, waktuKlik);

        // 4. Nyalakan kembali observer setelah jeda 300ms
        setTimeout(() => {
            if (observer) observeTable();
        }, 300);
    });

    wrap.appendChild(btn);
}

        // Tempelkan tombol ke kolom pertama DOM secara aman
        const rejectBtn = cell.querySelector(".btn-danger");
        if (rejectBtn) {
            rejectBtn.insertAdjacentElement("afterend", wrap);
        } else {
            cell.appendChild(wrap);
        }
    });
}