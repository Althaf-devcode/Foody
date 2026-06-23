import { db } from "./firebase.js";
import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const foodContainer = document.getElementById("food-container");
const buttons = document.querySelectorAll(".category-filter button");

let allFoods = []; // store all foods from Firebase

//  Load foods from firebase
async function loadFoods() {

    const querySnapshot = await getDocs(collection(db, "foods"));

    allFoods = [];

    querySnapshot.forEach((doc) => {
        allFoods.push(doc.data());
    });

    displayFoods(allFoods);
}

// Display foods
function displayFoods(foods) {

    foodContainer.innerHTML = "";

    foods.forEach((food) => {
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
        const filteredFoods = allFoods.filter(
            (food) => food.category === category
        );

        displayFoods(filteredFoods);
    }
}

//  Category button events
buttons.forEach((btn) => {

    btn.addEventListener("click", () => {

        // remove active class from all buttons
        buttons.forEach(b => b.classList.remove("active"));

        // add active to clicked button
        btn.classList.add("active");

        const category = btn.getAttribute("data-category");
        filterFoods(category);
    });
});

//  Init
loadFoods();