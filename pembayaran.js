/*
==================================================
FORMAT RUPIAH
==================================================
*/
function rupiah(number) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(number);
}

let activeEditOrderId = null;

/*
==================================================
TAMPILKAN LIST PESANAN PENDING (DENGAN TATA LETAK RAPI)
==================================================
*/
function renderPendingOrders() {
    const pendingOrders = JSON.parse(localStorage.getItem("angkringan_pending_orders")) || [];
    const container = document.getElementById("pendingList");
    container.innerHTML = "";

    if (pendingOrders.length === 0) {
        container.innerHTML = `<div class="empty" style="grid-column: 1/-1;">Tidak ada pesanan yang menunggu pembayaran.</div>`;
        return;
    }

    pendingOrders.forEach((order) => {
        let itemsHTML = "";
        order.items.forEach((item) => {
            itemsHTML += `
                <div class="pending-item-row">
                    <span>${item.name} x ${item.quantity}</span>
                    <span>${rupiah(item.price * item.quantity)}</span>
                </div>
            `;
        });

        const sourceClass = order.source === "Rokok" ? "rokok" : "kasir";
        const initialMethod = order.paymentMethod || "Cash";

        const card = document.createElement("div");
        card.className = "pending-card";
        card.innerHTML = `
            <!-- HEADER TANGGAL & SUMBER -->
            <div class="pending-header">
                <span>🕒 ${order.date}</span>
                <span class="history-source ${sourceClass}">${order.source}</span>
            </div>

            <!-- DAFTAR ITEM PESANAN -->
            <div class="pending-items">
                ${itemsHTML}
            </div>

            <!-- OPSI TAMBAH MENU & RINGKASAN TOTAL -->
            <div class="pending-action-row">
                <button class="btn-add-item-order" onclick="openAddItemModal(${order.id})">➕ Tambah</button>
                <div class="pending-total-row">
                    <span style="font-size: 12px; color: #aaa; font-weight: normal;">TOTAL: </span>
                    <span>${rupiah(order.total)}</span>
                </div>
            </div>

            <!-- SECTION PEMBAYARAN -->
            <div class="pending-payment">
                <div class="pending-field">
                    <label for="payInput_${order.id}">Uang Pembeli</label>
                    <input type="number" id="payInput_${order.id}" placeholder="Contoh: 50000" oninput="calculatePendingChange(${order.id}, ${order.total})">
                </div>
                
                <div class="pending-change-row">
                    <span>Kembalian</span>
                    <span id="changeVal_${order.id}" style="color: #ff0000;">${rupiah(0)}</span>
                </div>

                <div class="pending-field">
                    <label for="payMethod_${order.id}">Metode Pembayaran</label>
                    <select id="payMethod_${order.id}">
                        <option value="Cash" ${initialMethod === 'Cash' ? 'selected' : ''}>Cash</option>
                        <option value="Dana" ${initialMethod === 'Dana' ? 'selected' : ''}>Dana</option>
                    </select>
                </div>
            </div>

            <!-- TOMBOL AKSI -->
            <div class="pending-buttons">
                <button class="btn-pay-pending" onclick="processPendingPayment(${order.id})">💰</button>
                <button class="btn-cancel-pending" onclick="cancelPendingOrder(${order.id})">Batalkan</button>
            </div>
        `;

        container.appendChild(card);
    });
}

/*
==================================================
FITUR TAMBAH ITEM KE PESANAN PENDING
==================================================
*/
function openAddItemModal(orderId) {
    activeEditOrderId = orderId;
    const pendingOrders = JSON.parse(localStorage.getItem("angkringan_pending_orders")) || [];
    const order = pendingOrders.find(o => o.id === orderId);

    if (!order) return;

    const select = document.getElementById("selectMenuItem");
    select.innerHTML = `<option value="">-- Pilih Menu Tersedia --</option>`;

    // Ambil daftar menu sesuai sumber pesanan (Kasir / Rokok) dari LocalStorage
    const storageKey = order.source === "Rokok" ? "angkringan_rokok_menu" : "angkringan_menu";
    const availableMenu = JSON.parse(localStorage.getItem(storageKey)) || [];

    availableMenu.forEach((menuItem, idx) => {
        const option = document.createElement("option");
        option.value = idx;
        option.innerText = `${menuItem.name} - ${rupiah(menuItem.price)}`;
        option.dataset.name = menuItem.name;
        option.dataset.price = menuItem.price;
        select.appendChild(option);
    });

    const customOption = document.createElement("option");
    customOption.value = "custom";
    customOption.innerText = "+ Input Manual / Lainnya";
    select.appendChild(customOption);

    // Reset input
    document.getElementById("inputItemName").value = "";
    document.getElementById("inputItemPrice").value = "";
    document.getElementById("inputItemQty").value = 1;

    document.getElementById("addItemModal").style.display = "flex";
}

function onMenuItemSelect() {
    const select = document.getElementById("selectMenuItem");
    const selectedOption = select.options[select.selectedIndex];

    if (select.value !== "" && select.value !== "custom") {
        document.getElementById("inputItemName").value = selectedOption.dataset.name;
        document.getElementById("inputItemPrice").value = selectedOption.dataset.price;
    } else if (select.value === "custom") {
        document.getElementById("inputItemName").value = "";
        document.getElementById("inputItemPrice").value = "";
    }
}

function closeAddItemModal() {
    document.getElementById("addItemModal").style.display = "none";
    activeEditOrderId = null;
}

function saveItemToPendingOrder() {
    if (!activeEditOrderId) return;

    const name = document.getElementById("inputItemName").value.trim();
    const price = Number(document.getElementById("inputItemPrice").value) || 0;
    const qty = Number(document.getElementById("inputItemQty").value) || 1;

    if (!name || price <= 0 || qty <= 0) {
        alert("Mohon isi nama pesanan, harga, dan jumlah dengan benar.");
        return;
    }

    let pendingOrders = JSON.parse(localStorage.getItem("angkringan_pending_orders")) || [];
    const orderIndex = pendingOrders.findIndex(o => o.id === activeEditOrderId);

    if (orderIndex !== -1) {
        const existingItem = pendingOrders[orderIndex].items.find(i => i.name.toLowerCase() === name.toLowerCase());

        if (existingItem) {
            existingItem.quantity += qty;
        } else {
            pendingOrders[orderIndex].items.push({
                name: name,
                price: price,
                quantity: qty
            });
        }

        // Hitung ulang total harga pesanan
        pendingOrders[orderIndex].total = pendingOrders[orderIndex].items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        localStorage.setItem("angkringan_pending_orders", JSON.stringify(pendingOrders));
        closeAddItemModal();
        renderPendingOrders();
    }
}

/*
==================================================
HITUNG KEMBALIAN DI MENU PEMBAYARAN
==================================================
*/
function calculatePendingChange(id, total) {
    const input = document.getElementById(`payInput_${id}`);
    const changeVal = document.getElementById(`changeVal_${id}`);
    const payment = Number(input.value) || 0;
    const change = payment - total;

    if (change >= 0) {
        changeVal.innerText = rupiah(change);
        changeVal.style.color = "#ff0000";
    } else {
        changeVal.innerText = "Kurang " + rupiah(Math.abs(change));
        changeVal.style.color = "#ff8888";
    }
}

/*
==================================================
PROSES PEMBAYARAN & PINDAH KE RIWAYAT / STATISTIK
==================================================
*/
function processPendingPayment(id) {
    let pendingOrders = JSON.parse(localStorage.getItem("angkringan_pending_orders")) || [];
    const orderIndex = pendingOrders.findIndex(o => o.id === id);

    if (orderIndex === -1) return;

    const order = pendingOrders[orderIndex];
    const input = document.getElementById(`payInput_${id}`);
    const methodSelect = document.getElementById(`payMethod_${id}`);
    
    const payment = Number(input.value) || 0;
    const selectedMethod = methodSelect ? methodSelect.value : (order.paymentMethod || "Cash");

    if (payment < order.total) {
        alert("Uang pembeli masih kurang " + rupiah(order.total - payment));
        return;
    }

    const change = payment - order.total;

    // Simpan ke riwayat transaksi untuk statistik
    const newTransaction = {
        id: order.id,
        date: order.date,
        source: order.source,
        items: order.items,
        total: order.total,
        payment: payment,
        change: change,
        paymentMethod: selectedMethod
    };

    const existingTransactions = JSON.parse(localStorage.getItem("angkringan_transactions")) || [];
    existingTransactions.push(newTransaction);
    localStorage.setItem("angkringan_transactions", JSON.stringify(existingTransactions));

    // Hapus dari pending orders
    pendingOrders.splice(orderIndex, 1);
    localStorage.setItem("angkringan_pending_orders", JSON.stringify(pendingOrders));

    alert(
        "Pembayaran Berhasil!\n\n" +
        "Metode: " + selectedMethod + "\n" +
        "Total: " + rupiah(order.total) + "\n" +
        "Bayar: " + rupiah(payment) + "\n" +
        "Kembalian: " + rupiah(change)
    );

    renderPendingOrders();
}

/*
==================================================
BATALKAN PESANAN PENDING
==================================================
*/
function cancelPendingOrder(id) {
    if (confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) {
        let pendingOrders = JSON.parse(localStorage.getItem("angkringan_pending_orders")) || [];
        pendingOrders = pendingOrders.filter(o => o.id !== id);
        localStorage.setItem("angkringan_pending_orders", JSON.stringify(pendingOrders));
        renderPendingOrders();
    }
}

document.addEventListener("DOMContentLoaded", renderPendingOrders);