const express = require("express");
const Blog = require("../models/Blog");
const authMiddleware = require("../middleware/authMiddleware"); 

const router = express.Router();

// Create new blog
router.post("/blogs", authMiddleware, async (req, res) => {
  try {
    const { title, description, image, category } = req.body;
    const userId = req.user.id;

    // Validation
    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    const validCategories = ["Business", "Study", "Technology", "Food", "Travel", "Others"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid category selected" });
    }

    const newBlog = new Blog({ 
      title, 
      description, 
      image, 
      author: userId, 
      category 
    });

    await newBlog.save();
    
    // Populate author details in response
    const populatedBlog = await Blog.findById(newBlog._id).populate("author", "username email");
    
    res.status(201).json({ 
      message: "Blog posted successfully!", 
      blog: populatedBlog 
    });
  } catch (err) {
    console.error("Blog creation error:", err);
    res.status(500).json({ message: "Error posting blog", error: err.message });
  }
});

// Get all blog posts with pagination
router.get("/blogs", async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "username email profileImage")
      .sort({ createdAt: -1 }); // Latest first

    res.status(200).json({ blogs });
  } catch (err) {
    console.error("Error fetching blogs:", err);
    res.status(500).json({ message: "Error fetching blogs", error: err.message });
  }
});


// Get user's blogs
router.get("/blogs/my-blogs", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const blogs = await Blog.find({ author: userId })
      .populate("author", "username email profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({ blogs });
  } catch (error) {
    console.error("Error fetching user blogs:", error);
    res.status(500).json({ message: "Error fetching user blogs", error: error.message });
  }
});

// Delete Blog
router.delete("/blogs/:id", authMiddleware, async (req, res) => {
  try {
    const blogId = req.params.id;
    const userId = req.user.id;

    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (blog.author.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to delete this blog" });
    }

    await Blog.findByIdAndDelete(blogId);
    res.status(200).json({ message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ message: "Error deleting blog", error: error.message });
  }
});

// Update Blog
router.put("/blogs/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image, category } = req.body;
    const userId = req.user.id;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    if (blog.author.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized: You can only edit your own blog" });
    }

    // Validation
    if (category && !["Business", "Study", "Technology", "Food", "Travel", "Others"].includes(category)) {
      return res.status(400).json({ message: "Invalid category selected" });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        title: title || blog.title,
        description: description || blog.description,
        image: image || blog.image,
        category: category || blog.category,
        updatedAt: Date.now()
      },
      { new: true }
    ).populate("author", "username email profileImage");

    res.status(200).json({ 
      message: "Blog updated successfully", 
      blog: updatedBlog 
    });
  } catch (err) {
    console.error("Error updating blog:", err);
    res.status(500).json({ message: "Error updating blog", error: err.message });
  }
});

module.exports = router;
