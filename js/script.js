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

const API_URL = "http://localhost:5000/api";

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
    }[character]));
}

async function loadBlogs() {
    const blogContainer = document.querySelector(".blog-container");
    const dashboardBlogs = document.querySelector(".dashboard-blogs");

    if (!blogContainer && !dashboardBlogs) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/blogs`);
        if (!response.ok) {
            throw new Error("Could not load blogs");
        }

        const blogs = await response.json();

        if (blogContainer) {
            blogContainer.innerHTML = blogs.length
                ? blogs.map(blog => `
                    <div class="blog-card">
                        <h3>${escapeHtml(blog.title)}</h3>
                        <p>${escapeHtml(blog.content)}</p>
                        <a href="blog-details.htm?id=${blog._id}">Read More</a>
                    </div>
                `).join("")
                : "<p>No blogs published yet.</p>";
        }

        if (dashboardBlogs) {
            const list = dashboardBlogs.querySelector(".dashboard-blog-list");
            const total = document.querySelector(".stat-total");
            const published = document.querySelector(".stat-published");

            list.innerHTML = blogs.length
                ? blogs.map(blog => `
                    <div class="dashboard-blog">
                        <div>
                            <h3>${escapeHtml(blog.title)}</h3>
                            <p>Published</p>
                        </div>
                        <div class="blog-actions">
                         <a href="blog-details.htm?id=${blog._id}">Read More</a>
                         <a href="create-blog.htm?id=${blog._id}">Edit</a>
                         <button type="button" onclick="deleteBlog('${blog._id}')">Delete</button>
                        </div>
                    </div>
                `).join("")
                : "<p>No blogs created yet.</p>";

            total.textContent = blogs.length;
            published.textContent = blogs.length;
        }
    } catch (error) {
        console.error(error);
    }
}

function initializeForms() {
    // Login Form
    // Login Form
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        if (email === "" || password === "") {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message);
                return;
            }

            alert(data.message);

            localStorage.setItem("userName", data.user.name);
            localStorage.setItem("userEmail", data.user.email);

            window.location.href = "dashboard.htm";

        } catch (error) {
            alert("Unable to connect to the backend server.");
            console.error(error);
        }
    });
}



    // Register Form
   // Register Form
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        // Check passwords
        if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message);
                return;
            }

            alert(data.message);

            // Go to login page
            window.location.href = "login.htm";

        } catch (error) {
            alert("Unable to connect to the backend server.");
            console.error(error);
        }
    });
}
       // Create / Edit Blog Form
const blogForm = document.getElementById("blogForm");

if (blogForm) {
    const params = new URLSearchParams(window.location.search);
    const blogId = params.get("id");

    // If editing an existing blog
    if (blogId) {
        document.querySelector(".create-blog-box h1").textContent = "Edit Blog";
        document.querySelector(".publish-btn").textContent = "Update Blog";

        fetch(`${API_URL}/blogs/${blogId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error("Could not load blog");
                }
                return response.json();
            })
            .then(blog => {
                document.getElementById("blogTitle").value = blog.title;
                document.getElementById("category").value = blog.category;
                document.getElementById("content").value = blog.content;
                document.getElementById("image").value = blog.image || "";
            })
            .catch(error => {
                console.error(error);
                alert("Unable to load blog.");
            });
    }

    blogForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const title = document.getElementById("blogTitle").value;
        const category = document.getElementById("category").value;
        const content = document.getElementById("content").value;
        const image = document.getElementById("image").value;

        if (title === "" || category === "" || content === "") {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const url = blogId
                ? `${API_URL}/blogs/${blogId}`
                : `${API_URL}/blogs`;

            const response = await fetch(url, {
                method: blogId ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title: title,
                    category: category,
                    content: content,
                    image: image,
                    author: localStorage.getItem("userName") || "Anonymous"
                })
            });

            const data = await response.json();

            if (response.ok) {
                showSuccessPopup(
                    blogId
                        ? "Blog updated successfully!"
                        : "Blog created successfully!",
                    "dashboard.htm"
                );
            } else {
                alert(data.message || "Failed to save blog.");
            }

        } catch (error) {
            alert("Unable to connect to the backend server.");
            console.error(error);
        }
    });
}
}
async function deleteBlog(blogId) {
    const confirmDelete = confirm("Are you sure you want to delete this blog?");

    if (!confirmDelete) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/blogs/${blogId}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (response.ok) {
            alert("Blog deleted successfully!");
            loadBlogs();
        } else {
            alert(data.message || "Failed to delete blog.");
        }

    } catch (error) {
        console.error(error);
        alert("Unable to connect to the backend server.");
    }
}
document.addEventListener("DOMContentLoaded", function () {
    initializeForms();
    loadBlogs();
});