// =============================================
//  admindash.js  –  FoodAdmin Dashboard Logic
//  Firebase SDK v12.15.0
// =============================================

import { auth, db } from "./firebase.js";

import {
    collection, addDoc, getDocs, getDoc,
    doc, deleteDoc, updateDoc,
    onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import {
    signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";



// ── Global helper ─────────────────────────
const toNumber = price => parseFloat(String(price).replace(/,/g, "").replace(/[^0-9.]/g, "")) || 0;

// Format orderedItems array into a readable string
function formatItems(order) {
    const items = order.orderedItems || order.items || [];
    return items.map(i => `${i.name} ×${i.quantity || i.qty || 1}`).join(", ") || "—";
}


// ─────────────────────────────────────────────
//  🔒  AUTH GUARD
// ─────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = "login.html"; return; }

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
        const data = userDoc.data();
        setText("adminName", data.name || user.email.split("@")[0]);
        if (data.role !== "admin") {
            alert("Access denied. Admins only.");
            window.location.href = "index.html";
            return;
        }
    }

    loadDashboard();
    listenOrders();
    loadMenuItems();
    loadUsers();
});


// ─────────────────────────────────────────────
//  🚪  LOGOUT
// ─────────────────────────────────────────────
document.getElementById("logoutBtn").addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "signin.html";
});


// ─────────────────────────────────────────────
//  📌  SIDEBAR NAV
// ─────────────────────────────────────────────
document.querySelectorAll(".sidebar-nav li").forEach(li => {
    li.addEventListener("click", () => {
        document.querySelectorAll(".sidebar-nav li").forEach(l => l.classList.remove("active"));
        li.classList.add("active");
        showSection(li.dataset.section);
    });
});

function showSection(name) {
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    const target = document.getElementById(`sec-${name}`);
    if (target) {
        target.classList.add("active");
        document.querySelector(".main").scrollTo({ top: 0, behavior: "smooth" });
    }
}


// ─────────────────────────────────────────────
//  📊  DASHBOARD STATS
// ─────────────────────────────────────────────
async function loadDashboard() {
    const [ordersSnap, menuSnap] = await Promise.all([
        getDocs(collection(db, "orders")),
        getDocs(collection(db, "foods"))
    ]);

    const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const total     = orders.length;
    const pending   = orders.filter(o => o.status === "Pending").length;
    const preparing = orders.filter(o => o.status === "Preparing").length;
    const ready     = orders.filter(o => o.status === "Ready").length;
    const delivered = orders.filter(o => o.status === "Delivered").length;

    // Revenue: sum all orders (Paid status or any status — adjust as needed)
    const revenue = orders
        .filter(o => o.status === "Paid" || o.paymentMethod)   // include all that have a payment
        .reduce((sum, o) => sum + toNumber(o.totalAmount), 0);

    setText("totalOrders",    total);
    setText("pendingOrders",  pending);
    setText("totalMenuItems", menuSnap.size);
    setText("totalRevenue",   "Rs." + revenue.toLocaleString());

    setBar("barPending",   "countPending",   pending,   total);
    setBar("barPreparing", "countPreparing", preparing, total);
    setBar("barReady",     "countReady",     ready,     total);
    setBar("barDelivered", "countDelivered", delivered, total);

    // Recent orders — show last 5
    const recent = [...orders]
        .sort((a, b) => {
            // Sort by createdAt descending if available
            const aTime = a.createdAt?.seconds || 0;
            const bTime = b.createdAt?.seconds || 0;
            return bTime - aTime;
        })
        .slice(0, 5);

    const tbody = document.getElementById("recentOrdersBody");
    tbody.innerHTML = recent.length
        ? recent.map(o => `
            <tr>
                <td><span class="order-id">${o.id.slice(0, 8).toUpperCase()}</span></td>
                <td>${o.customerName || "—"}</td>
                <td>Rs.${toNumber(o.totalAmount).toLocaleString()}</td>
                <td>${statusBadge(o.status)}</td>
            </tr>`).join("")
        : `<tr><td colspan="4" class="no-data">No orders yet.</td></tr>`;

    const feed = document.getElementById("paymenthisContainer");
    feed.innerHTML = recent.length
        ? recent.map(o => `
            <div class="activity-item">
                <div class="activity-dot">💳</div>
                <div class="activity-body">
                    <div class="activity-title">Order from ${o.customerName || "Customer"}</div>
                    <div class="activity-meta">
                        #${o.id.slice(0, 8).toUpperCase()} &nbsp;·&nbsp;
                        Rs.${toNumber(o.totalAmount).toLocaleString()} &nbsp;·&nbsp; ${o.paymentMethod || "—"} &nbsp;·&nbsp; ${o.status || "Pending"}
                    </div>
                </div>
            </div>`).join("")
        : `<div class="no-data">No recent activity.</div>`;
}


// ─────────────────────────────────────────────
//  📋  ORDERS – real-time
// ─────────────────────────────────────────────
let allOrders = [];

function listenOrders() {
    onSnapshot(collection(db, "orders"), (snapshot) => {
        allOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        renderOrders(allOrders);
        loadDashboard();
    });
}

function renderOrders(orders) {
    const tbody = document.getElementById("allOrdersBody");
    if (!tbody) return;

    tbody.innerHTML = orders.length
        ? orders.map(o => {
            // Support both orderedItems (your Firestore field) and items (legacy)
            const itemsStr = formatItems(o);
            return `
            <tr>
                <td><span class="order-id">${o.id.slice(0, 8).toUpperCase()}</span></td>
                <td>${o.customerName || "—"}</td>
                <td>${o.phone || o.address || "—"}</td>
                <td class="items-cell">${itemsStr}</td>
                <td>Rs.${toNumber(o.totalAmount).toLocaleString()}</td>
                <td>${statusBadge(o.status)}</td>
                <td>
                    <select class="status-select" data-id="${o.id}">
                        <option value="Pending"   ${o.status === "Pending"   ? "selected" : ""}>⏳ Pending</option>
                        <option value="Preparing" ${o.status === "Preparing" ? "selected" : ""}>🍳 Preparing</option>
                        <option value="Ready"     ${o.status === "Ready"     ? "selected" : ""}>✅ Ready</option>
                        <option value="Delivered" ${o.status === "Delivered" ? "selected" : ""}>🚚 Delivered</option>
                        <option value="Paid"      ${o.status === "Paid"      ? "selected" : ""}>💰 Paid</option>
                    </select>
                </td>
            </tr>`;
        }).join("")
        : `<tr><td colspan="7" class="no-data">No orders found.</td></tr>`;

    document.querySelectorAll(".status-select").forEach(sel => {
        sel.addEventListener("change", async (e) => {
            const id = e.target.dataset.id;
            const status = e.target.value;
            await updateDoc(doc(db, "orders", id), { status });
            showToast(`Order ${id.slice(0, 8).toUpperCase()} → ${status}`, "success");
        });
    });
}

document.getElementById("orderStatusFilter")?.addEventListener("change", filterOrders);
document.getElementById("orderSearch")?.addEventListener("input", filterOrders);

function filterOrders() {
    const status = document.getElementById("orderStatusFilter").value;
    const search = document.getElementById("orderSearch").value.toLowerCase();
    renderOrders(allOrders.filter(o =>
        (!status || o.status === status) &&
        (!search || (o.customerName || "").toLowerCase().includes(search))
    ));
}


// ─────────────────────────────────────────────
//  🍔  MENU ITEMS
// ─────────────────────────────────────────────
let allMenuItems = [];

async function loadMenuItems() {
    const snap = await getDocs(collection(db, "foods"));
    allMenuItems = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderMenu(allMenuItems);
}

function renderMenu(items) {
    const grid = document.getElementById("menuGrid");
    if (!grid) return;

    if (items.length === 0) {
        grid.innerHTML = `<p class="no-data">No menu items yet. Add one!</p>`;
        return;
    }

    grid.innerHTML = items.map(item => createMenuCard(item)).join("");
}

function createMenuCard(item) {
    return `
        <div class="menu-card">
            <div class="menu-img-wrap">
                <img 
                    src="${item.image}" 
                    alt="${item.name}" 
                    class="menu-img"
                    onerror="this.src='https://via.placeholder.com/200x130?text=No+Image'"
                >
                <span class="menu-cat-tag">${item.category}</span>
            </div>
            <div class="menu-body">
                <div class="menu-name">${item.name}</div>
                <div class="menu-desc">${item.description}</div>
                <div class="menu-price">Rs. ${toNumber(item.price).toLocaleString()} <span>/ serving</span></div>
            </div>
            <div class="menu-actions">
                <button class="btn-edit"   onclick="editItem('${item.id}')">✏️ Edit</button>
                <button class="btn-delete" onclick="deleteItem('${item.id}', '${item.name.replace(/'/g, "\\'")}')">🗑️ Delete</button>
            </div>
        </div>
    `;
}

document.getElementById("menuSearch")?.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    renderMenu(allMenuItems.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query)
    ));
});


// ─────────────────────────────────────────────
//  ➕  LIVE PREVIEW
// ─────────────────────────────────────────────
function updatePreview() {
    const name    = document.getElementById("foodName").value.trim();
    const price   = document.getElementById("foodPrice").value;
    const cat     = document.getElementById("foodCategory").value;
    const image   = document.getElementById("foodImage").value.trim();
    const desc    = document.getElementById("foodDesc").value.trim();
    const avail   = document.getElementById("foodAvailable").value;
    const box     = document.getElementById("previewBox");

    if (!name && !price && !cat) {
        box.innerHTML = `
            <div class="preview-empty">
                <div class="preview-empty-icon">🍽️</div>
                <p>Fill in the form to see a preview of your menu card.</p>
            </div>`;
        return;
    }

    const imgHtml = image
        ? `<img src="${image}" class="menu-img" alt="preview"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : "";

    box.innerHTML = `
        <div class="preview-menu-card">
            <div class="menu-img-wrap">
                ${imgHtml}
                <div class="menu-img-placeholder" style="${image ? 'display:none' : ''}">🍽️</div>
                ${cat ? `<span class="menu-cat-tag">${cat}</span>` : ""}
            </div>
            <div class="menu-body">
                <div class="menu-name">${name || "Food Name"}</div>
                <div class="menu-desc">${desc || "No description yet."}</div>
                <div class="menu-footer">
                    <div class="menu-price">Rs. ${price ? Number(price).toLocaleString() : "0"}</div>
                    <span class="menu-avail ${avail === 'true' ? 'avail-yes' : 'avail-no'}">
                        ${avail === 'true' ? 'Available' : 'Unavailable'}
                    </span>
                </div>
            </div>
        </div>`;
}

["foodName", "foodPrice", "foodCategory", "foodImage", "foodDesc", "foodAvailable"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", updatePreview);
    document.getElementById(id)?.addEventListener("change", updatePreview);
});


// ─────────────────────────────────────────────
//  ➕  SAVE FOOD
// ─────────────────────────────────────────────
document.getElementById("saveItemBtn")?.addEventListener("click", async () => {
    const name     = document.getElementById("foodName").value.trim();
    const price    = document.getElementById("foodPrice").value;
    const category = document.getElementById("foodCategory").value;
    const image    = document.getElementById("foodImage").value.trim();
    const desc     = document.getElementById("foodDesc").value.trim();
    const editId   = document.getElementById("editItemId").value;

    if (!name || !category || !price || !image || !desc) {
        showFormMsg("Please fill in all required fields.", "error");
        return;
    }

    const data = { name, price: Number(price), category, image, description: desc };

    try {
        if (editId) {
            await updateDoc(doc(db, "foods", editId), data);
            showFormMsg("Item updated successfully!", "success");
            showToast("Menu item updated.", "success");
        } else {
            data.createdAt = serverTimestamp();
            await addDoc(collection(db, "foods"), data);
            showFormMsg("Item added successfully!", "success");
            showToast("New item added to menu.", "success");
        }
        clearForm();
        loadMenuItems();
        loadDashboard();
    } catch (err) {
        showFormMsg("Error: " + err.message, "error");
    }
});

document.getElementById("clearFormBtn")?.addEventListener("click", clearForm);

function clearForm() {
    ["editItemId", "foodName", "foodPrice", "foodImage", "foodDesc"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    const cat = document.getElementById("foodCategory");
    if (cat) cat.value = "";
    const avail = document.getElementById("foodAvailable");
    if (avail) avail.value = "true";
    setText("formTitle", "Add New Food Item");
    const msg = document.getElementById("formMsg");
    if (msg) { msg.textContent = ""; msg.className = "form-msg"; }
    updatePreview();
}


// ─────────────────────────────────────────────
//  ✏️  EDIT FOOD
// ─────────────────────────────────────────────
window.editItem = async (id) => {
    const snap = await getDoc(doc(db, "foods", id));
    if (!snap.exists()) return;

    const d = snap.data();
    document.getElementById("editItemId").value   = id;
    document.getElementById("foodName").value     = d.name || "";
    document.getElementById("foodCategory").value = d.category || "";
    document.getElementById("foodPrice").value    = d.price || "";
    document.getElementById("foodImage").value    = d.image || "";
    document.getElementById("foodDesc").value     = d.description || "";
    setText("formTitle", "✏️ Edit Food Item");

    document.querySelectorAll(".sidebar-nav li").forEach(l => l.classList.remove("active"));
    document.querySelector('[data-section="add-item"]').classList.add("active");
    showSection("add-item");
    updatePreview();
};


// ─────────────────────────────────────────────
//  🗑️  DELETE FOOD
// ─────────────────────────────────────────────
window.deleteItem = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await deleteDoc(doc(db, "foods", id));
    showToast(`"${name}" deleted from menu.`, "success");
    loadMenuItems();
    loadDashboard();
};


// ─────────────────────────────────────────────
//  👥  USERS  (with cart subcollection)
// ─────────────────────────────────────────────
async function loadUsers() {
    const snap = await getDocs(collection(db, "users"));

    const tbody = document.getElementById("usersBodyFull");
    if (!tbody) return;

    if (snap.empty) {
        tbody.innerHTML = `<tr><td colspan="5" class="no-data">No users found.</td></tr>`;
        return;
    }

    // Fetch cart counts in parallel for all users
    const userRows = await Promise.all(snap.docs.map(async (d) => {
        const u = d.data();
        const initial = (u.name || u.email || "?")[0].toUpperCase();

        // Count cart items (subcollection inside users/{uid}/cart)
        let cartQty = 0;
        try {
            const cartSnap = await getDocs(collection(db, "users", d.id, "cart"));
            cartSnap.docs.forEach(cartDoc => {
                const item = cartDoc.data();
                cartQty += item.quantity || 1;
            });
        } catch (_) { /* cart might not exist */ }

        // Count orders for this user
        const userOrders = allOrders.filter(o => o.customerName === u.email || o.uid === d.id);

        return `
        <tr>
            <td><span class="order-id">${d.id.slice(0, 10)}…</span></td>
            <td><span class="user-avatar">${initial}</span>${u.name || u.displayName || "—"}</td>
            <td>${u.email || "—"}</td>
            <td>${userOrders.length}</td>
            <td>
                ${cartQty > 0
                    ? `<span class="badge badge-pending">🛒 ${cartQty} item${cartQty !== 1 ? "s" : ""}</span>`
                    : `<span style="color:var(--text-muted);font-size:12px">Empty</span>`
                }
            </td>
        </tr>`;
    }));

    tbody.innerHTML = userRows.join("");
}


// ─────────────────────────────────────────────
//  🛠️  MODAL
// ─────────────────────────────────────────────
document.getElementById("modalClose")?.addEventListener("click", () => {
    document.getElementById("modalOverlay").classList.remove("show");
});
document.getElementById("modalOverlay")?.addEventListener("click", (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove("show");
});


// ─────────────────────────────────────────────
//  🛠️  HELPERS
// ─────────────────────────────────────────────
function statusBadge(status) {
    const cls  = { Pending: "badge-pending", Preparing: "badge-preparing", Ready: "badge-ready", Delivered: "badge-delivered", Paid: "badge-delivered" };
    const icon = { Pending: "⏳", Preparing: "🍳", Ready: "✅", Delivered: "🚚", Paid: "💰" };
    const c = cls[status] || "badge-pending";
    return `<span class="badge ${c}">${icon[status] || ""} ${status || "Pending"}</span>`;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function setBar(barId, countId, count, total) {
    const pct = total ? Math.round((count / total) * 100) : 0;
    const bar = document.getElementById(barId);
    const cnt = document.getElementById(countId);
    if (bar) bar.style.width = pct + "%";
    if (cnt) cnt.textContent = count;
}

function showFormMsg(msg, type) {
    const el = document.getElementById("formMsg");
    if (!el) return;
    el.textContent = msg;
    el.className = `form-msg ${type} show`;
    setTimeout(() => { el.textContent = ""; el.className = "form-msg"; }, 4000);
}

function showToast(msg, type = "default") {
    const icons = { success: "✅", error: "❌", default: "ℹ️" };
    const t = document.createElement("div");
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span class="toast-icon">${icons[type]}</span>${msg}`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3100);
}