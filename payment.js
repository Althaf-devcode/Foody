import { db, auth } from "./firebase.js";



import {
    collection,
    addDoc,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {

    // -----------------------------
    // Load Total Amount
    // -----------------------------
    const total = localStorage.getItem("totalAmount") || "0";
    document.getElementById("totalAmount").innerText = total;

    // -----------------------------
    // Elements
    // -----------------------------
    const paymentOptions = document.querySelectorAll('input[name="payment"]');
    const cardForm = document.getElementById("cardForm");

    const cardNameInput = document.getElementById("cardName");
    const cardNumberInput = document.getElementById("cardNumber");
    const expiryInput = document.getElementById("expiryDate");
    const cvvInput = document.getElementById("cvv");

    // -----------------------------
    // Show / Hide Card Form
    // -----------------------------


paymentOptions.forEach(option => {
    option.addEventListener("change", () => {

        if (option.value === "card" && option.checked) {
            cardForm.style.display = "block";
            document.getElementById("codAddress").style.display = "none";
        } 
        else if (option.value === "cod" && option.checked) {
            cardForm.style.display = "none";
            document.getElementById("codAddress").style.display = "block";
        }

    });
});

    // -----------------------------
    // Card Number (10 digits only)
    // -----------------------------
    cardNumberInput.addEventListener("input", (e) => {

        let value = e.target.value.replace(/\D/g, "");

        if (value.length > 10) {
            value = value.substring(0, 10);
        }

        e.target.value = value;

    });

    // -----------------------------
    // CVV (3 digits only)
    // -----------------------------
    cvvInput.addEventListener("input", (e) => {

        let value = e.target.value.replace(/\D/g, "");

        if (value.length > 3) {
            value = value.substring(0, 3);
        }

        e.target.value = value;

    });

    // -----------------------------
    // Expiry Date MM/YY
    // -----------------------------
    expiryInput.addEventListener("input", (e) => {

        let value = e.target.value.replace(/\D/g, "");

        if (value.length > 4) {
            value = value.substring(0, 4);
        }

        if (value.length >= 3) {
            value = value.substring(0, 2) + "/" + value.substring(2);
        }

        e.target.value = value;

    });

    
    
    // -----------------------------
    // Submit Payment
    // -----------------------------
    document.getElementById("submitPayment").addEventListener("click", async () => {

       
       
        const selectedPayment =
            document.querySelector('input[name="payment"]:checked').value;


let address = "";

if (selectedPayment === "cod") {
    address = document.getElementById("address").value.trim();

    if (!address) {
        alert("Please enter delivery address!");
        return;
    }
}



        if (selectedPayment === "card") {

            const name = cardNameInput.value.trim();
            const number = cardNumberInput.value.trim();
            const expiry = expiryInput.value.trim();
            const cvv = cvvInput.value.trim();

            // Empty fields
            if (!name || !number || !expiry || !cvv) {
                alert("Please fill all card details!");
                return;
            }

            // Card Number Validation
            if (!/^\d{10}$/.test(number)) {
                alert("Card number must contain exactly 10 digits!");
                return;
            }

            // Expiry Validation
            if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
                alert("Please enter expiry date in MM/YY format.");
                return;
            }

            // CVV Validation
            if (!/^\d{3}$/.test(cvv)) {
                alert("CVV must contain exactly 3 digits!");
                return;
            }
        }

const user = auth.currentUser;

const customerName = user?.displayName || user?.email || "Unknown User";

// Get all cart items
const cartSnapshot = await getDocs(
    collection(db, "users", user.uid, "cart")
);

const orderedItems = [];

cartSnapshot.forEach(doc => {
    orderedItems.push(doc.data());
});



        try {

            await addDoc(collection(db, "orders"), {
              customerName: customerName,
              totalAmount: total,
              paymentMethod: selectedPayment,
              address: address,
              orderedItems: orderedItems,
              status: "Paid",
              createdAt: new Date().toISOString()
          });

            alert("Payment Successful!");

            localStorage.removeItem("totalAmount");

            window.location.href = "index.html";

        } catch (error) {

            console.error(error);
            alert("Payment failed. Try again.");

        }

    });

});



async function updateCartCount(user) {

    const snapshot = await getDocs(
        collection(db, "users", user.uid, "cart")
    );

    let totalItems = 0;

    snapshot.forEach(doc => {
        totalItems += doc.data().quantity;
    });

    const cartCount = document.querySelector(".cart-count");

    if (cartCount) {
        cartCount.innerText = totalItems;
    }
}



// -----------------------------
// Load Navbar
// -----------------------------
fetch("navbar.html")
.then(res => res.text())
.then(data => {

    document.getElementById("navbar").innerHTML = data;

    // Wait a bit so DOM updates properly
    setTimeout(() => {

        onAuthStateChanged(auth, (user) => {

            if (user) {
                updateCartCount(user);
            } else {
                const cartCount = document.querySelector(".cart-count");
                if (cartCount) cartCount.innerText = "0";
            }

        });

    }, 100);

});
