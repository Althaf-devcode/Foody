import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const cartContainer = document.getElementById("cart-container");

async function loadCart() {

    const snapshot = await getDocs(collection(db, "cart"));

    cartContainer.innerHTML = "";

    let totalItems = 0;
    let subtotal = 0;

    // Empty Cart
    if (snapshot.empty) {

        cartContainer.innerHTML = `
            <div class="empty-cart">
                <h2>Your Cart is Empty</h2>
                <p>Add some delicious food to your cart 🍔🍕🥤</p>
            </div>
        `;

        document.getElementById("subtotal").innerText = "Rs. 0";
        document.getElementById("total").innerText = "Rs. 0";

        return;
    }

    snapshot.forEach((cartDoc) => {

        const item = cartDoc.data();

        totalItems += item.quantity;

        let price = parseInt(
            item.price.toString()
                .replace("LKR", "")
                .replace("Rs.", "")
                .replace(/,/g, "")
                .trim()
        );

        const itemTotal = price * item.quantity;

        subtotal += itemTotal;

       cartContainer.innerHTML += `
<div class="cart-item">

    <div class="left-section">

        <img src="${item.image}" alt="${item.name}">

        <div class="item-info">
            <h3>${item.name}</h3>

            <p>Fresh & Delicious Food</p>

            <div class="item-price">
                Rs. ${price.toLocaleString()}
            </div>
        </div>

    </div>

    <div class="right-section">

     <div class="action-row">

        <button class="remove-btn"
            data-id="${cartDoc.id}">
            <i class="ri-delete-bin-6-line"></i>
        </button>

        <div class="quantity-box">

            <button class="decrease-btn"
                data-id="${cartDoc.id}"
                data-qty="${item.quantity}">
                -
            </button>

            <span>${item.quantity}</span>

            <button class="increase-btn"
                data-id="${cartDoc.id}"
                data-qty="${item.quantity}">
                +
            </button>

        </div>

    </div>

    <div class="item-total">
        Rs. ${itemTotal.toLocaleString()}
    </div>

</div>

</div>
`;

    });

    // Increase Button
    document.querySelectorAll(".increase-btn").forEach(btn => {

        btn.addEventListener("click", async () => {

            const id = btn.dataset.id;
            const qty = Number(btn.dataset.qty);

            await updateDoc(doc(db, "cart", id), {
                quantity: qty + 1
            });

            loadCart();
        });

    });

    // Decrease Button
    document.querySelectorAll(".decrease-btn").forEach(btn => {

        btn.addEventListener("click", async () => {

            const id = btn.dataset.id;
            const qty = Number(btn.dataset.qty);

            if (qty > 1) {

                await updateDoc(doc(db, "cart", id), {
                    quantity: qty - 1
                });

            } else {

                await deleteDoc(doc(db, "cart", id));
            }

            loadCart();
        });

    });

    // Remove Button
    document.querySelectorAll(".remove-btn").forEach(btn => {

        btn.addEventListener("click", async () => {

            const id = btn.dataset.id;

            await deleteDoc(doc(db, "cart", id));

            loadCart();
        });

    });

    // Navbar Count
    const cartCount = document.querySelector(".cart-count");

    if (cartCount) {
        cartCount.innerText = totalItems;
    }

    // Summary
    const deliveryFee = 200;

    const total = subtotal + deliveryFee;

    document.getElementById("subtotal").innerText =
        "Rs. " + subtotal.toLocaleString();

    document.getElementById("total").innerText =
        "Rs. " + total.toLocaleString();
}

// Load Cart
loadCart();