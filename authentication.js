import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

import {
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";


// Sign Up
const signupBtn = document.getElementById("signup-btn");

if (signupBtn) {
    signupBtn.addEventListener("click", async () => {

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const role = document.getElementById("role").value;

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        try {
            const userCredential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user = userCredential.user;

            // Save user data to Firestore
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                name: name,
                email: email,
                role: role,
                createdAt: new Date()
            });

            localStorage.setItem("userName", name);

            alert("Account created successfully");

            window.location.href = "index.html";

        } catch (err) {
            alert(err.message);
        }
    });
}


// Login
import { getDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const signinBtn = document.getElementById("signin-btn");

if (signinBtn) {
    signinBtn.addEventListener("click", async () => {

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {

            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            //  Get user document from Firestore
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {

                const userData = docSnap.data();

                alert("Sign in successful");

                // Redirect based on role
                if (userData.role === "admin") {
                    window.location.href = "admin_dashboard.html";
                } else {
                    window.location.href = "index.html";
                }

            } else {
                alert("No user data found");
            }

        } catch (err) {
            alert(err.message);
        }
    });
}


//  Authenctication State
onAuthStateChanged(auth, (user) => {

    const authArea = document.getElementById("auth-area");
    const userArea = document.getElementById("user-area");

    if (user) {

        if (authArea) {
            authArea.style.display = "none";
        }

        if (userArea) {
            userArea.style.display = "flex";
        }

        // Logout button
        const logoutBtn = document.getElementById("logoutBtn");

        if (logoutBtn) {
            logoutBtn.onclick = async () => {

                try {

                    await signOut(auth);

                    alert("Logged out successfully");

                    window.location.href = "index.html";

                } catch (err) {

                    alert(err.message);

                }
            };
        }

    } else {

        if (authArea) {
            authArea.style.display = "flex";
        }

        if (userArea) {
            userArea.style.display = "none";
        }
    }
});