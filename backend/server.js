const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");
const Blog = require("./models/Blog");

const app = express();

const PORT = 5000;
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
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered."
            });
        }

        const newUser = await User.create({
            name,
            email,
            password
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
        const user = await User.findOne({ email, password });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        res.json({
            message: "Login successful!",
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
app.post("/api/blogs", async (req, res) => {
    const { title, category, content, author } = req.body;

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
app.put("/api/blogs/:id", async (req, res) => {
    const { title, category, content, author } = req.body;

    try {
        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id,
            {
                title,
                category,
                content,
                author
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
app.delete("/api/blogs/:id", async (req, res) => {
    try {
        const deletedBlog = await Blog.findByIdAndDelete(req.params.id);

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
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});