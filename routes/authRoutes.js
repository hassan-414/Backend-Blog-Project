const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// **Signup Route**
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password, profileImage } = req.body;

    const lowerCaseEmail = email.toLowerCase();
    if (!lowerCaseEmail.endsWith("@gmail.com")) {
      return res.status(400).json({ message: "Only @gmail.com emails are allowed!" });
    }

    const existingUser = await User.findOne({ email: lowerCaseEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered. Please log in!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email: lowerCaseEmail,
      password: hashedPassword,
      profileImage,
    });

    await newUser.save();

    res.status(201).json({ success: true, message: "User registered successfully!" });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// **Login Route**
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Include more user data in token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        username: user.username
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    // Set secure cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    };

    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage
      },
      token
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// **Get User Data (Protected Route)**
router.get("/user", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// **Logout Route**
router.post("/logout", (req, res) => {
  res.clearCookie("token"); // Token ko clear kar do
  res.status(200).json({ message: "Logout successful!" });
});

// **Update User Profile**
router.put("/user/update", authMiddleware, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      age,
      gender,
      phone,
      country,
      city,
      address,
      qualification
    } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // Update only the provided fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (age) user.age = age;
    if (gender) user.gender = gender;
    if (phone) user.phone = phone;
    if (country) user.country = country;
    if (city) user.city = city;
    if (address) user.address = address;
    if (qualification) user.qualification = qualification;

    await user.save();
    res.status(200).json({ message: "Profile updated successfully!", user });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// **Verify Token Route**
router.get("/user/verify", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ 
      success: true, 
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
