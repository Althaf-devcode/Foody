import { db } from "./firebase.js";
import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

async function updateCartCount() {

    const snapshot = await getDocs(collection(db, "cart"));

    let count = 0;

    snapshot.forEach((doc) => {
        count += doc.data().quantity;
    });

    const cartCount = document.querySelector(".cart-count");

    if (cartCount) {
        cartCount.innerText = count;
    }
}

window.addEventListener("navbarLoaded", () => {
    updateCartCount();
});