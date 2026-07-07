import { db } from "./firebase.js";
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
                    <button>Add to Cart</button>
                </div>
            </div>
        `;
    });
}

//  Filter foods
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