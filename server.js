const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const blogRoutes = require("./routes/blogRoutes");
const commentRoutes = require('./routes/commentRoutes');

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

const corsOptions = {
    origin: "https://hassanahmedblog.vercel.app", // Frontend URL
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Database Connection
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB Connected"))
    .catch((err) => console.error("MongoDB Connection Error:", err));

// Routes
app.use("/api", authRoutes);
app.use("/api", blogRoutes);
app.use('/api/comments', commentRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({ 
            message: "Validation Error", 
            errors: Object.values(err.errors).map(e => e.message) 
        });
    }
    
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ message: "Unauthorized" });
    }
    
    res.status(err.status || 500).json({ 
        message: err.message || "Internal Server Error"
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
