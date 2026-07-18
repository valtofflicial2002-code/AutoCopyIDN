// =========================================
// AUTOCOPYIDN POPUP.JS
// AUTO MODE VERSION
// =========================================

document.addEventListener("DOMContentLoaded", async () => {
    console.log("✅ POPUP AUTO MODE");

    // =====================================
    // ELEMENTS
    // =====================================
    const cards = {
        deposit: document.getElementById("depositCard"),
        withdraw: document.getElementById("withdrawCard")
    };

    // =====================================
    // VALIDATE ELEMENTS
    // =====================================
    if (!cards.deposit || !cards.withdraw) {
        console.log("❌ CARD ELEMENT NOT FOUND");
        return;
    }

    // =====================================
    // FORCE ENABLE
    // =====================================
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ enabled: true });
    }

    // =====================================
    // ALWAYS ACTIVE UI
    // =====================================
    Object.keys(cards).forEach(key => {
        const card = cards[key];
        const status = card.querySelector(".status");

        card.classList.add("active");
        card.classList.remove("disabled");
        card.classList.remove("inactive");

        if (status) {
            status.innerHTML = `
                <span class="dot"></span>
                ON
            `;
        }

        card.style.cursor = "default";
        card.onclick = e => {
            e.preventDefault();
            console.log("✅ AUTO MODE ACTIVE");
        };
    });

    // =====================================
    // HISTORY BUTTON ROUTING
    // =====================================
    const historyBtn = document.getElementById("historyBtn");
    if (historyBtn && typeof chrome !== "undefined" && chrome.runtime) {
        historyBtn.addEventListener("click", () => {
            chrome.tabs.create({
                url: chrome.runtime.getURL("dashboard/history.html")
            });
        });
    }
});

// =========================================
// STUB FUNCTIONS FOR COMPATIBILITY
// =========================================
function updateCache() { console.log("✅ AUTO CACHE MODE"); }
async function reloadContent() { console.log("✅ AUTO CONTENT MODE"); }