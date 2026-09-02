const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/User");
const Blog = require("./models/Blog");

const app = express();

function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findUserByEmail(email) {
    const normalizedEmail = normalizeEmail(email);

    return User.findOne({
        email: {
            $regex: new RegExp(`^${escapeRegExp(normalizedEmail)}$`, "i")
        }
    });
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Access denied. Please login."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired token."
        });
    }
}

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri || mongoUri.includes("<db_password>")) {
    throw new Error("Set the real MongoDB password in backend/.env as MONGODB_URI.");
}

app.use(cors());
app.use(express.json());

mongoose.connect(mongoUri)
    .then(() => {
        console.log("MongoDB connected successfully!");
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error);
    });
// Temporary storage
const blogs = [];

// Test route
app.get("/", (req, res) => {
    res.send("Backend server is running successfully!");
});

// Register
app.post("/api/register", async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Please fill in all fields."
        });
    }

    try {
        const normalizedEmail = normalizeEmail(email);
        const existingUser = await findUserByEmail(normalizedEmail);

        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email:normalizedEmail,
            password: hashedPassword,
        });

        res.status(201).json({
            message: "Registration successful!",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error."
        });
    }
});

// Login
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Please enter email and password."
        });
    }

    try {
        const normalizedEmail = normalizeEmail(email);
        const user = await findUserByEmail(normalizedEmail);

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        let passwordMatch = false;

        if (user.password && typeof user.password === "string" && user.password.startsWith("$2")) {
            passwordMatch = await bcrypt.compare(password, user.password);
        } else {
            passwordMatch = password === user.password;

            if (passwordMatch) {
                const hashedPassword = await bcrypt.hash(password, 10);
                await User.findByIdAndUpdate(user._id, {
                    password: hashedPassword
                });
            }
        }

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error."
        });
    }
});
// Create Blog
    app.post("/api/blogs", authenticateToken, async (req, res) => {
    const { title, category, content } = req.body;
    const author = req.user.userId;

    if (!title || !category || !content || !author) {
        return res.status(400).json({
            message: "Please fill in all blog fields."
        });
    }

    try {
        const newBlog = await Blog.create({
            title,
            category,
            content,
            author
        });

        res.status(201).json({
            message: "Blog created successfully!",
            blog: newBlog
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error."
        });
    }
});
// Get logged-in user's blogs
app.get("/api/my-blogs", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("name");
        const authorValues = [req.user.userId];

        if (user && user.name) {
            authorValues.push(user.name);
        }

        const blogs = await Blog.find({
            author: { $in: authorValues }
        }).sort({ createdAt: -1 });

        res.json(blogs);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to retrieve your blogs."
        });
    }
});

// Get all blogs

app.get("/api/blogs", async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });

        res.json(blogs);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to retrieve blogs."
        });
    }
});
// List Blogs
app.get("/api/blogs", (req, res) => {
    res.json(blogs);
});

// Get a single blog by ID
app.get("/api/blogs/:id", async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found."
            });
        }

        res.json(blog);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to retrieve blog."
        });
    }
});

// Update a blog
app.put("/api/blogs/:id", authenticateToken, async (req, res) => {
    const { title, category, content } = req.body;

    try {
        const user = await User.findById(req.user.userId).select("name");
        const authorValues = [String(req.user.userId)];

        if (user && user.name) {
            authorValues.push(user.name);
        }

       const updatedBlog = await Blog.findOneAndUpdate(
    {
        _id: req.params.id,
        author: { $in: authorValues }
    },
    {
        title,
        category,
        content
    },
    { new: true, runValidators: true }
);

        if (!updatedBlog) {
            return res.status(404).json({
                message: "Blog not found."
            });
        }

        res.json({
            message: "Blog updated successfully!",
            blog: updatedBlog
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to update blog."
        });
    }
});

// Delete a blog
app.delete("/api/blogs/:id", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("name");
        const authorValues = [String(req.user.userId)];

        if (user && user.name) {
            authorValues.push(user.name);
        }

        const deletedBlog = await Blog.findOneAndDelete({
            _id: req.params.id,
            author: { $in: authorValues }
        });

        if (!deletedBlog) {
            return res.status(404).json({
                message: "Blog not found."
            });
        }

        res.json({
            message: "Blog deleted successfully!"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to delete blog."
        });
    }
});
// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
