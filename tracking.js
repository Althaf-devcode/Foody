import { db, auth } from "./firebase.js";

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const steps = [
  { key: "Paid", label: "Order Placed", desc: "We got your order", icon: "ri-box-3-line" },
  { key: "Preparing", label: "Preparing", desc: "Chef is cooking", icon: "ri-restaurant-line" },
  { key: "Out for Delivery", label: "Out for Delivery", desc: "On the way to you", icon: "ri-e-bike-2-line" },
  { key: "Delivered", label: "Delivered", desc: "Enjoy your meal!", icon: "ri-checkbox-circle-line" }
];

const headlineText = {
  "Paid": "Order Received!",
  "Preparing": "Your Food is Being Prepared!",
  "Out for Delivery": "Your Order is on its Way!",
  "Delivered": "Order Delivered!"
};

async function loadTracking(user) {
  const customerName = user?.displayName || user?.email || "Unknown User";

  const q = query(
    collection(db, "orders"),
    where("customerName", "==", customerName),
    orderBy("createdAt", "desc"),
    limit(1)
  );

  try {
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      document.getElementById("statusHeadline").textContent = "No orders found.";
      return;
    }

    const orderDoc = snapshot.docs[0];
    renderTracking(orderDoc.id, orderDoc.data());

  } catch (error) {
    console.error(error);
    document.getElementById("statusHeadline").textContent = "Could not load order.";
  }
}

function renderTracking(orderId, order) {
  document.getElementById("orderIdText").textContent = orderId.slice(-4).toUpperCase();
  document.getElementById("orderAddress").textContent = order.address || "No address provided";
  document.getElementById("statusHeadline").textContent =
    headlineText[order.status] || "Order Status Unknown";

  const currentIndex = steps.findIndex(s => s.key === order.status);
  const timelineCard = document.getElementById("timelineCard");

  timelineCard.innerHTML = steps.map((step, i) => {
    let stateClass = "";
    if (i < currentIndex) stateClass = "done";
    else if (i === currentIndex) stateClass = "current done";

    return `
      <div class="timeline-step ${stateClass}">
        <div class="line"></div>
        <div class="icon-circle"><i class="${step.icon}"></i></div>
        <div class="step-info">
          <h4>${step.label}</h4>
          <p>${step.desc}</p>
        </div>
      </div>
    `;
  }).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      loadTracking(user);
    } else {
      document.getElementById("statusHeadline").textContent = "Please log in to view your order.";
    }
  });

  fetch("navbar.html")
    .then(res => res.text())
    .then(data => {
      document.getElementById("navbar").innerHTML = data;
    });
});