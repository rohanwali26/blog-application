function showSuccessPopup(message, redirectUrl) {
    const existingPopup = document.querySelector(".success-popup");
    if (existingPopup) {
        existingPopup.remove();
    }

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
        if (redirectUrl) {
            window.location.href = redirectUrl;
            return;
        }

        popup.remove();
    });
}

function triggerSuccessPopup(message, redirectUrl) {
    sessionStorage.setItem("successMessage", message);
    sessionStorage.setItem("successRedirect", redirectUrl || "");
    if (redirectUrl) {
        window.location.href = redirectUrl;
    } else {
        showSuccessPopup(message, "");
    }
}

function displayStoredSuccessPopup() {
    const message = sessionStorage.getItem("successMessage");
    const redirectUrl = sessionStorage.getItem("successRedirect");

    if (!message) {
        return;
    }

    sessionStorage.removeItem("successMessage");
    sessionStorage.removeItem("successRedirect");
    showSuccessPopup(message, redirectUrl || "");
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
    const token = localStorage.getItem("token");

    if (!blogContainer && !dashboardBlogs) {
        return;
    }

    if (dashboardBlogs && !token) {
        window.location.href = "login.htm";
        return;
    }

    try {
        const response = await fetch(
    dashboardBlogs
        ? `${API_URL}/my-blogs`
        : `${API_URL}/blogs`,
    dashboardBlogs
        ? {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        }
        : {}
);
        if (!response.ok) {
            if (dashboardBlogs && (response.status === 401 || response.status === 403)) {
                logoutUser();
                return;
            }
            throw new Error("Could not load blogs");
        }

        const blogs = await response.json();

        if (blogContainer) {
            blogContainer.innerHTML = blogs.length
                ? blogs.map(blog => `
                    <div class="blog-card">
                        <h3>${escapeHtml(blog.title)}</h3>
                         <p class="blog-category">${escapeHtml(blog.category)}</p>
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
    const profileName = document.getElementById("profileName");
    const profileEmail = document.getElementById("profileEmail");

    if (profileName) {
        profileName.textContent = localStorage.getItem("userName") || "User";
    }

    if (profileEmail) {
        profileEmail.textContent = localStorage.getItem("userEmail") || "Not available";
    }

    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        loginForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const submitButton = loginForm.querySelector("button[type=\"submit\"]");
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            if (email === "" || password === "") {
                alert("Please fill in all fields.");
                return;
            }

            submitButton.disabled = true;

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

                const responseText = await response.text();
                let data;

                try {
                    data = responseText ? JSON.parse(responseText) : {};
                } catch (parseError) {
                    throw new Error("The server returned an invalid response.");
                }

                if (!response.ok) {
                    alert(data.message || "Login failed.");
                    return;
                }

                if (!data.token || !data.user) {
                    throw new Error("The server returned incomplete login data.");
                }

                localStorage.setItem("token", data.token);
                localStorage.setItem("userName", data.user.name);
                localStorage.setItem("userEmail", data.user.email);

                triggerSuccessPopup(data.message, "dashboard.htm");
            } catch (error) {
                alert(error.message || "Unable to connect to the backend server.");
                console.error(error);
            } finally {
                submitButton.disabled = false;
            }
        });
    }

    const registerForm = document.getElementById("registerForm");

    if (registerForm) {
        registerForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

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

                triggerSuccessPopup(data.message, "login.htm");
            } catch (error) {
                alert("Unable to connect to the backend server.");
                console.error(error);
            }
        });
    }

    const blogForm = document.getElementById("blogForm");

    if (blogForm) {
        const params = new URLSearchParams(window.location.search);
        const blogId = params.get("id");

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

            const token = localStorage.getItem("token");
            const title = document.getElementById("blogTitle").value;
            const category = document.getElementById("category").value;
            const content = document.getElementById("content").value;
            const image = document.getElementById("image").value;

            if (!token) {
                alert("Please login before creating a blog.");
                window.location.href = "login.htm";
                return;
            }

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
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
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
                    triggerSuccessPopup(
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
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
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

function setupBlogFilters() {
    const searchInput = document.getElementById("searchBlog");
    const categoryFilter = document.getElementById("categoryFilter");

    if (!searchInput || !categoryFilter) {
        return;
    }

    function filterBlogs() {
        const searchText = searchInput.value.toLowerCase().trim();
        const selectedCategory = categoryFilter.value.toLowerCase();

        const blogCards = document.querySelectorAll(".blog-card");

        blogCards.forEach(card => {
            const title = card.querySelector("h3").textContent.toLowerCase();
            const paragraphs = card.querySelectorAll("p");

            const category = paragraphs[0].textContent.toLowerCase();
            const content = paragraphs[1].textContent.toLowerCase();

            const matchesSearch =
                title.includes(searchText) ||
                content.includes(searchText);

            const matchesCategory =
                selectedCategory === "" ||
                category === selectedCategory;

            card.style.display =
                matchesSearch && matchesCategory ? "" : "none";
        });
    }

    searchInput.addEventListener("input", filterBlogs);
    categoryFilter.addEventListener("change", filterBlogs);
}
function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");

    window.location.href = "login.htm";
}
document.addEventListener("DOMContentLoaded", function () {
    const currentPage = window.location.pathname;

    displayStoredSuccessPopup();

    if (currentPage.includes("dashboard.htm")) {
        const token = localStorage.getItem("token");

        if (!token) {
            window.location.href = "login.htm";
            return;
        }
    }

    initializeForms();
    loadBlogs();
    setupBlogFilters();
});