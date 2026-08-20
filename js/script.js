function showSuccessPopup(message, redirectUrl) {
    const popup = document.createElement("div");
    popup.className = "success-popup";
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-modal", "true");
    popup.innerHTML = `
        <div class="success-popup-content">
            <h2>${message}</h2>
            <p>Your action was completed successfully.</p>
            <button type="button">Continue</button>
        </div>
    `;

    document.body.appendChild(popup);
    popup.querySelector("button").focus();
    popup.querySelector("button").addEventListener("click", function () {
        window.location.href = redirectUrl;
    });
}

function initializeForms() {
    // Login Form
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        if (email === "" || password === "") {
            alert("Please fill in all fields.");
            return;
        }

            showSuccessPopup("Login successful!", "dashboard.html");
        });
    }


    // Register Form
    const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (name === "" || email === "" || password === "" || confirmPassword === "") {
            alert("Please fill in all fields.");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

            showSuccessPopup("Registration successful!", "login.html");
        });
    }


    // Create Blog Form
    const blogForm = document.getElementById("blogForm");

if (blogForm) {
    blogForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const title = document.getElementById("blogTitle").value;
        const category = document.getElementById("category").value;
        const content = document.getElementById("content").value;

        if (title === "" || category === "" || content === "") {
            alert("Please fill in all required fields.");
            return;
        }

            showSuccessPopup("Blog published successfully!", "dashboard.html");
        });
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeForms, { once: true });
} else {
    initializeForms();
}