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

/*
==================================================
TAMPILKAN LIST PESANAN PENDING
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
            <div>
                <div class="pending-header">
                    <span>🕒 ${order.date}</span>
                    <span class="history-source ${sourceClass}">${order.source}</span>
                </div>

                <div class="pending-items">
                    ${itemsHTML}
                </div>

                <div class="pending-total-row">
                    <span>TOTAL</span>
                    <span>${rupiah(order.total)}</span>
                </div>
            </div>

            <div>
                <div class="pending-payment">
                    <label for="payInput_${order.id}">Uang Pembeli</label>
                    <input type="number" id="payInput_${order.id}" placeholder="Contoh: 50000" oninput="calculatePendingChange(${order.id}, ${order.total})">
                    
                    <div class="pending-change-row">
                        <span>Kembalian</span>
                        <span id="changeVal_${order.id}">${rupiah(0)}</span>
                    </div>

                    <!-- DROPDOWN METODE PEMBAYARAN -->
                    <div class="payment-method" style="margin-top: 10px; margin-bottom: 15px;">
                        <label for="payMethod_${order.id}" style="display: block; font-size: 13px; font-weight: bold; margin-bottom: 5px;">Metode Pembayaran</label>
                        <select id="payMethod_${order.id}" style="width: 100%; padding: 10px; border: 1px solid #ff0000; background: #000; color: #ff0000; border-radius: 6px; font-size: 15px; cursor: pointer;">
                            <option value="Cash" ${initialMethod === 'Cash' ? 'selected' : ''}>Cash</option>
                            <option value="Dana" ${initialMethod === 'Dana' ? 'selected' : ''}>Dana</option>
                        </select>
                    </div>
                </div>

                <button class="btn-pay-pending" onclick="processPendingPayment(${order.id})">💰 Bayar Now / Lunas</button>
                <button class="btn-cancel-pending" onclick="cancelPendingOrder(${order.id})">Batalkan Pesanan</button>
            </div>
        `;

        container.appendChild(card);
    });
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