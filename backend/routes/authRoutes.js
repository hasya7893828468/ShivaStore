const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ✅ Generate JWT Token
const generateToken = (user) => {
  return jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d", // Token expires in 7 days
  });
};

// ✅ Register New User
router.post("/register", async (req, res) => {
  const { name, email, password, address, phone } = req.body;

  if (!name || !email || !password || !address || !phone) {
    return res.status(400).json({ success: false, message: "Please fill all fields" });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword, address, phone });
    await newUser.save();

    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: { id: newUser._id, name: newUser.name, email: newUser.email, address, phone },
      token, // Send token in response for React Native storage
    });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Login User
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email, address: user.address, phone: user.phone },
      token, // Send token to store in AsyncStorage
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Get User Profile (Protected)
router.get("/user/:id", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("❌ Get User Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Logout (Clear Cookie)
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logout successful" });
});

module.exports = router;
