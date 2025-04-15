const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ["Business", "Study", "Technology", "Food", "Travel", "Others"], // Only these categories allowed
    required: true,
  },
  image: { type: String, required: true }, // Image URL
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Auto user ID
  createdAt: { type: Date, default: Date.now },
});

const Blog = mongoose.model("Blog", blogSchema);
module.exports = Blog;
