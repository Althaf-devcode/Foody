// Load Navbar
fetch("navbar.html")
    .then(res => res.text())
    .then(data => {
        document.getElementById("navbar").innerHTML = data;

        // After navbar is loaded → attach events
        setupNavbar();
        window.dispatchEvent(new Event("navbarLoaded"));
    });

function setupNavbar() {

    // Mobile menu toggle
    const toggle = document.getElementById("menu-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (toggle && navLinks) {
        toggle.addEventListener("click", () => {
            navLinks.classList.toggle("active");
        });
    }

    // User dropdown toggle
    const userIcon = document.getElementById("userIcon");
    const dropdown = document.getElementById("dropdown");

    if (userIcon && dropdown) {
        userIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("show");
        });

        document.addEventListener("click", (e) => {
            if (!e.target.closest("#user-area")) {
                dropdown.classList.remove("show");
            }
        });
    }
}

const userIcon = document.getElementById("userIcon");
const dropdown = document.getElementById("dropdown");

if (userIcon && dropdown) {
    userIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("show");
    });

    document.addEventListener("click", () => {
        dropdown.classList.remove("show");
    });
}