// =========================================
// AUTOCOPYIDN BACKGROUND SERVICE WORKER
// =========================================

console.log("✅ AUTOCOPYIDN BACKGROUND RUNNING");

// 1. Inisialisasi Saat Terpasang
chrome.runtime.onInstalled.addListener(() => {
    console.log("✅ AutoCopyIDN Installed & Ready");
});

// 2. Klik Ikon Buka Dashboard History
chrome.action.onClicked.addListener((tab) => {
    chrome.tabs.create({ url: "dashboard/history.html" });
});

// 3. Router Pesan (Pusat Kendali - Anti Crash)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
        if (message.action === "updateCache") {
            updateCache().then(result => {
                sendResponse({ success: true, data: result });
            }).catch(err => sendResponse({ success: false, error: err.message }));
            return true; // Wajib ada untuk komunikasi asinkron
        }

        if (message.action === "notify") {
            showNotification(message.message || "Notification");
            sendResponse({ success: true });
            return true;
        }
    } catch (error) {
        console.error("❌ MESSAGE ROUTER CRITICAL ERROR:", error);
        sendResponse({ success: false, error: error.message });
    }
    return true;
});

// 4. Update Cache (Fetch yang Aman)
async function updateCache() {
    try {
        const response = await fetch("https://domain-api-anda.com/autocopy");
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        
        const cacheData = {
            deposit: data.deposit || data.depo || "",
            withdraw: data.withdraw || "",
            updated: Date.now()
        };

        await chrome.storage.local.set(cacheData);
        showNotification("Cache Updated ✔");
        return cacheData;
        
    } catch (error) {
        console.error("❌ CACHE UPDATE FAILED:", error);
        await chrome.storage.local.set({ cacheFailed: true, lastError: Date.now() });
        showNotification("Cache Failed ✖");
        return null;
    }
}

// 5. Fungsi Notifikasi yang Lebih Aman (Anti Error)
function showNotification(message) {
    try {
        // Cek apakah API notifications tersedia di manifest
        if (typeof chrome.notifications !== 'undefined' && chrome.notifications.create) {
            chrome.notifications.create({
                type: "basic",
                iconUrl: "icons/icon128.png",
                title: "AutoCopyIDN",
                message: message,
                priority: 1
            }, (id) => {
                if (chrome.runtime.lastError) {
                    console.warn("Notification error (usually icon path):", chrome.runtime.lastError.message);
                }
            });
        }
    } catch (error) {
        console.error("❌ NOTIFICATION FUNCTION ERROR:", error);
    }
}