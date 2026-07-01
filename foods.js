import { db, auth } from "./firebase.js";

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const foodContainer = document.getElementById("food-container");
const buttons = document.querySelectorAll(".category-filter button");

let allFoods = [];

// Load Foods
async function loadFoods() {

    const snapshot = await getDocs(collection(db, "foods"));

    allFoods = [];

    snapshot.forEach((doc) => {
        allFoods.push(doc.data());
    });

    displayFoods(allFoods);
}

// Display Foods
function displayFoods(foods) {

    foodContainer.innerHTML = "";

    foods.forEach((food, index) => {

        foodContainer.innerHTML += `
        <div class="food-card">

            <img src="${food.image}" alt="${food.name}">

            <h3>${food.name}</h3>

            <p>${food.description}</p>

            <div class="food-footer">

                <span>Rs. ${food.price}</span>

                <button class="cart-btn" data-index="${index}">
                    Add to Cart
                </button>

            </div>

        </div>
        `;
    });

    document.querySelectorAll(".cart-btn").forEach(btn => {

        btn.addEventListener("click", async () => {

            const user = auth.currentUser;

            if (!user) {

                alert("Please login first.");
                window.location.href = "signin.html";
                return;

            }

            const food = foods[btn.dataset.index];

            const cartRef = collection(
                db,
                "users",
                user.uid,
                "cart"
            );

            const q = query(
                cartRef,
                where("name", "==", food.name)
            );

            const snapshot = await getDocs(q);

            if (!snapshot.empty) {

                const cartDoc = snapshot.docs[0];

                await updateDoc(cartDoc.ref, {
                    quantity: cartDoc.data().quantity + 1
                });

            } else {

                await addDoc(cartRef, {
                    name: food.name,
                    image: food.image,
                    price: food.price,
                    quantity: 1
                });

            }

            alert("Added to Cart!");

            window.location.href = "cart.html";

        });

    });

}

// Filter
function filterFoods(category) {

    if (category === "all") {

        displayFoods(allFoods);

    } else {

        const filteredFoods = allFoods.filter(food => food.category === category);

        displayFoods(filteredFoods);

    }

}

// Category Buttons
buttons.forEach(btn => {

    btn.addEventListener("click", () => {

        buttons.forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        filterFoods(btn.dataset.category);

    });

});

// Start
loadFoods();