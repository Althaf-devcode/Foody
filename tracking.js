import { db, auth } from "./firebase.js";

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

const steps = [
  {
    key: "Pending",
    label: "Order Placed",
    desc: "We got your order",
    icon: "ri-box-3-line"
  },
  {
    key: "Preparing",
    label: "Preparing",
    desc: "Chef is cooking",
    icon: "ri-restaurant-line"
  },
  {
    key: "Ready",
    label: "Out for Delivery",
    desc: "Your order is on the way",
    icon: "ri-e-bike-2-line"
  },
  {
    key: "Delivery",
    label: "Delivered",
    desc: "Enjoy your meal!",
    icon: "ri-checkbox-circle-line"
  }
];

const headlineText = {
  Pending: "Order Received!",
  Preparing: "Your Food is Being Prepared!",
  Ready: "Your Order is on its Way!",
  Delivery: "Order Delivered!"
};

function startTracking(user) {
  const customerName =
    user?.displayName ||
    user?.email ||
    "Unknown User";

  const q = query(
    collection(db, "orders"),
    where("customerName", "==", customerName),
    orderBy("createdAt", "desc"),
    limit(1)
  );

  onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        document.getElementById("statusHeadline").textContent =
          "No orders found.";
        return;
      }

      const orderDoc = snapshot.docs[0];

      renderTracking(
        orderDoc.id,
        orderDoc.data()
      );
    },
    (error) => {
      console.error(error);

      document.getElementById("statusHeadline").textContent =
        "Could not load order.";
    }
  );
}

function renderTracking(orderId, order) {
  document.getElementById("orderIdText").textContent =
    orderId.slice(-4).toUpperCase();

  document.getElementById("orderAddress").textContent =
    order.address || "No address provided";

  const currentStatus = order.status || "Pending";

  document.getElementById("statusHeadline").textContent =
    headlineText[currentStatus] || "Order Status Unknown";

  let currentIndex = steps.findIndex(
    step =>
      step.key.toLowerCase() ===
      currentStatus.toLowerCase()
  );

  if (currentIndex === -1) currentIndex = 0;

  const timelineCard =
    document.getElementById("timelineCard");

  timelineCard.innerHTML = steps
    .map((step, index) => {
      let stateClass = "";

      if (index < currentIndex) {
        stateClass = "done";
      } else if (index === currentIndex) {
        stateClass = "current done";
      }

      return `
        <div class="timeline-step ${stateClass}">
          <div class="line"></div>

          <div class="icon-circle">
            <i class="${step.icon}"></i>
          </div>

          <div class="step-info">
            <h4>${step.label}</h4>
            <p>${step.desc}</p>
          </div>
        </div>
      `;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", () => {

  onAuthStateChanged(auth, (user) => {
    if (user) {
      startTracking(user);
    } else {
      document.getElementById("statusHeadline").textContent =
        "Please log in to view your order.";
    }
  });

  fetch("navbar.html")
    .then((res) => res.text())
    .then((data) => {
      document.getElementById("navbar").innerHTML = data;
    })
    .catch((error) => {
      console.error("Navbar Error:", error);
    });

});