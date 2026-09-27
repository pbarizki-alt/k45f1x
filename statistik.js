/*
==================================================
FORMAT RUPIAH & TANGGAL
==================================================
*/
function rupiah(number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(number);
}

// Mengambil format YYYY-MM-DD dari transaksi
function getTxDateKey(tx) {
    if (tx.dateKey) return tx.dateKey;
    if (tx.id) {
        const d = new Date(tx.id);
        if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }
    }
    return "";
}

// Format YYYY-MM-DD ke format lokal (contoh: 2026-09-28 -> 28/09/2026)
function getTodayString() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

let activeFilterMode = "today"; // 'today', 'custom', atau 'all'

/*
==================================================
TAMPILKAN DATA STATISTIK
==================================================
*/
function loadStatistics() {
    const transactions = JSON.parse(localStorage.getItem("angkringan_transactions")) || [];
    const dateInput = document.getElementById("filterDate");
    const selectedDate = dateInput.value;

    let filteredTransactions = [];

    if (activeFilterMode === "all") {
        filteredTransactions = transactions;
        document.getElementById("historyTitle").innerText = "📑 Riwayat Transaksi (Semua Tanggal)";
    } else {
        filteredTransactions = transactions.filter(tx => getTxDateKey(tx) === selectedDate);
        document.getElementById("historyTitle").innerText = `📑 Riwayat Transaksi (${selectedDate.split('-').reverse().join('/')})`;
    }

    let grandTotal = 0;
    let kasirTotal = 0;
    let rokokTotal = 0;

    const historyList = document.getElementById("historyList");
    historyList.innerHTML = "";

    if (filteredTransactions.length === 0) {
        historyList.innerHTML = `<div class="empty">Tidak ada riwayat transaksi pada tanggal ini.</div>`;
        document.getElementById("grandTotalIncome").innerText = rupiah(0);
        document.getElementById("totalTransactions").innerText = "0";
        document.getElementById("kasirIncome").innerText = rupiah(0);
        document.getElementById("rokokIncome").innerText = rupiah(0);
        return;
    }

    // Tampilkan transaksi dari yang paling baru
    filteredTransactions.slice().reverse().forEach((tx) => {
        grandTotal += tx.total;

        if (tx.source === "Kasir Utama") {
            kasirTotal += tx.total;
        } else if (tx.source === "Rokok") {
            rokokTotal += tx.total;
        }

        const sourceClass = tx.source === "Rokok" ? "rokok" : "kasir";

        let itemsHTML = "";
        tx.items.forEach((item) => {
            itemsHTML += `
                <div class="history-item-row">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>${rupiah(item.price * item.quantity)}</span>
                </div>
            `;
        });

        const card = document.createElement("div");
        card.className = "history-card";
        card.innerHTML = `
            <div class="history-header">
                <span>🕒 ${tx.date}</span>
                <span class="history-source ${sourceClass}">${tx.source}</span>
            </div>
            <div class="history-items">
                ${itemsHTML}
            </div>
            <div class="history-footer">
                <span>TOTAL</span>
                <span>${rupiah(tx.total)}</span>
            </div>
        `;

        historyList.appendChild(card);
    });

    // Ringkasan
    document.getElementById("grandTotalIncome").innerText = rupiah(grandTotal);
    document.getElementById("totalTransactions").innerText = filteredTransactions.length;
    document.getElementById("kasirIncome").innerText = rupiah(kasirTotal);
    document.getElementById("rokokIncome").innerText = rupiah(rokokTotal);
}

/*
==================================================
KONTROL FILTER TANGGAL
==================================================
*/
function filterToday() {
    activeFilterMode = "today";
    document.getElementById("filterDate").value = getTodayString();
    updateButtonStyles();
    loadStatistics();
}

function filterAll() {
    activeFilterMode = "all";
    updateButtonStyles();
    loadStatistics();
}

function onDateInputChange() {
    activeFilterMode = "custom";
    updateButtonStyles();
    loadStatistics();
}

function updateButtonStyles() {
    document.getElementById("btnToday").classList.toggle("active", activeFilterMode === "today");
    document.getElementById("btnAll").classList.toggle("active", activeFilterMode === "all");
}

/*
==================================================
HAPUS SEMUA RIWAYAT
==================================================
*/
function clearAllHistory() {
    const confirmDelete = confirm("Apakah Anda yakin ingin menghapus SELURUH riwayat transaksi?");
    if (confirmDelete) {
        localStorage.removeItem("angkringan_transactions");
        loadStatistics();
    }
}

// Inisialisasi awal
document.getElementById("filterDate").value = getTodayString();
filterToday();