/*
==================================================
DAFTAR MENU
==================================================
*/

const foods = [
    { name: "Nasi Kucing", price: 2500 },
    { name: "Sate Usus", price: 2000 },
    { name: "Sate Ati", price: 2000 },
    { name: "Sate Ampela", price: 2000 },
    { name: "Sate Kulit", price: 3000 },
    { name: "Sate Sosis", price: 2500 },
    { name: "Sate Telur", price: 2500 },
    { name: "Sate Bakso", price: 2500 },
    { name: "Mandoan Bakar", price: 2000 },
];

const drinks = [
    { name: "Es Teh", price: 3000 },
    { name: "Teh Panas", price: 2000 },
    { name: "Kopi Hitam", price: 5000 },
    { name: "Es Kopi Hitam", price: 6000 },
    { name: "Jahesu", price: 6000 },
    { name: "Es Jahesu", price: 7000 },
    { name: "Beng-beng", price: 5000 },
    { name: "Es Beng-beng", price: 6000 },
    { name: "G.Day", price: 4000 },
    { name: "Es G.Day", price: 5000 },
    { name: "Mix", price: 4000 },
    { name: "Es Mix", price: 5000 },
    { name: "Nut", price: 4000 },
    { name: "Es Nut", price: 5000 },
];

/*
==================================================
DATA PESANAN & REKAP
==================================================
*/

let order = {};
let transactionCount = 0;
let todayIncome = 0;

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
MEMBUAT TOMBOL MENU
==================================================
*/

function createMenu(menu, elementId) {
    const container = document.getElementById(elementId);

    menu.forEach((item) => {
        const button = document.createElement("button");
        button.className = "menu-button";

        button.innerHTML = `
            <span class="menu-name">${item.name}</span>
            <span class="menu-price">${rupiah(item.price)}</span>
        `;

        button.onclick = function() {
            addItem(item);
        };

        container.appendChild(button);
    });
}

/*
==================================================
TAMBAH BARANG
==================================================
*/

function addItem(item) {
    if (order[item.name]) {
        order[item.name].quantity++;
    } else {
        order[item.name] = {
            name: item.name,
            price: item.price,
            quantity: 1
        };
    }
    renderOrder();
}

/*
==================================================
UBAH JUMLAH
==================================================
*/

function changeQuantity(name, amount) {
    if (!order[name]) return;

    order[name].quantity += amount;

    if (order[name].quantity <= 0) {
        delete order[name];
    }
    renderOrder();
}

/*
==================================================
TAMPILKAN PESANAN
==================================================
*/

function renderOrder() {
    const orderList = document.getElementById("orderList");
    orderList.innerHTML = "";

    const items = Object.values(order);

    if (items.length === 0) {
        orderList.innerHTML = `<div class="empty">Belum ada pesanan</div>`;
        document.getElementById("totalItems").innerText = "0";
        document.getElementById("grandTotal").innerText = rupiah(0);
        document.getElementById("change").innerText = rupiah(0);
        return;
    }

    let total = 0;
    let totalItems = 0;

    items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        totalItems += item.quantity;

        const div = document.createElement("div");
        div.className = "order-item";

        div.innerHTML = `
            <div class="order-info">
                <div class="order-name">${item.name}</div>
                <div class="order-price">${rupiah(item.price)} / pcs</div>
            </div>
            <div class="quantity">
                <button onclick="changeQuantity('${item.name}', -1)">−</button>
                <span>${item.quantity}</span>
                <button onclick="changeQuantity('${item.name}', 1)">+</button>
            </div>
            <div class="item-total">${rupiah(itemTotal)}</div>
        `;

        orderList.appendChild(div);
    });

    document.getElementById("totalItems").innerText = totalItems;
    document.getElementById("grandTotal").innerText = rupiah(total);

    calculateChange();
}

/*
==================================================
HITUNG KEMBALIAN
==================================================
*/

function calculateChange() {
    const payment = Number(document.getElementById("paymentInput").value) || 0;
    const total = calculateTotal();
    const change = payment - total;

    if (change >= 0) {
        document.getElementById("change").innerText = rupiah(change);
    } else {
        document.getElementById("change").innerText = "Kurang " + rupiah(Math.abs(change));
    }
}

/*
==================================================
HITUNG TOTAL
==================================================
*/

function calculateTotal() {
    let total = 0;
    Object.values(order).forEach(item => {
        total += item.price * item.quantity;
    });
    return total;
}

/*
==================================================
SIMPAN TRANSAKSI KE LOCALSTORAGE FOR STATISTIK
==================================================
*/

function saveTransactionToStorage(sourceName) {
    const now = new Date();
    const formattedDate = now.toLocaleDateString("id-ID") + " " + now.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
    const paymentMethod = document.getElementById("paymentMethod") ? document.getElementById("paymentMethod").value : "Cash";

    const newTransaction = {
        id: Date.now(),
        date: formattedDate,
        source: sourceName,
        items: Object.values(order),
        total: calculateTotal(),
        payment: Number(document.getElementById("paymentInput").value) || 0,
        change: (Number(document.getElementById("paymentInput").value) || 0) - calculateTotal(),
        paymentMethod: paymentMethod // Menyimpan Metode Pembayaran (Cash / Dana)
    };

    const existingTransactions = JSON.parse(localStorage.getItem("angkringan_transactions")) || [];
    existingTransactions.push(newTransaction);
    localStorage.setItem("angkringan_transactions", JSON.stringify(existingTransactions));
}

/*
==================================================
HAPUS PESANAN
==================================================
*/

function clearOrder() {
    if (Object.keys(order).length === 0) return;

    const confirmDelete = confirm("Hapus semua pesanan?");
    if (confirmDelete) {
        order = {};
        document.getElementById("paymentInput").value = "";
        renderOrder();
    }
}

/*
==================================================
SELESAIKAN TRANSAKSI
==================================================
*/

function finishTransaction() {
    const total = calculateTotal();

    if (total === 0) {
        alert("Belum ada pesanan.");
        return;
    }

    const payment = Number(document.getElementById("paymentInput").value) || 0;

    if (payment < total) {
        alert("Uang pembeli masih kurang " + rupiah(total - payment));
        return;
    }

    const change = payment - total;
    transactionCount++;
    todayIncome += total;

    document.getElementById("transactionCount").innerText = transactionCount;
    document.getElementById("todayIncome").innerText = rupiah(todayIncome);

    // Simpan data transaksi ke LocalStorage agar masuk Statistik
    saveTransactionToStorage("Kasir Utama");

    alert(
        "Transaksi berhasil!\n\n" +
        "Total: " + rupiah(total) + "\n" +
        "Bayar: " + rupiah(payment) + "\n" +
        "Kembalian: " + rupiah(change)
    );

    order = {};
    document.getElementById("paymentInput").value = "";
    renderOrder();
}

/*
==================================================
KONFIRMASI PESANAN (KIRIM KE MENU PEMBAYARAN)
==================================================
*/
function confirmOrder() {
    const total = calculateTotal();

    if (total === 0) {
        alert("Belum ada pesanan untuk dikonfirmasi.");
        return;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString("id-ID") + " " + now.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' });
    const paymentMethod = document.getElementById("paymentMethod") ? document.getElementById("paymentMethod").value : "Cash";

    const pendingOrder = {
        id: Date.now(),
        date: formattedDate,
        source: "Kasir Utama",
        items: Object.values(order),
        total: total,
        paymentMethod: paymentMethod
    };

    const pendingList = JSON.parse(localStorage.getItem("angkringan_pending_orders")) || [];
    pendingList.push(pendingOrder);
    localStorage.setItem("angkringan_pending_orders", JSON.stringify(pendingList));

    alert("Pesanan berhasil dikonfirmasi!");

    order = {};
    document.getElementById("paymentInput").value = "";
    if (document.getElementById("paymentMethod")) document.getElementById("paymentMethod").value = "Cash";
    renderOrder();
}

/*
==================================================
JALANKAN APLIKASI
==================================================
*/

createMenu(foods, "foodMenu");
createMenu(drinks, "drinkMenu");
renderOrder();