import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Generate JWT Token
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "72h",
    });
};

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ message: "Please provide email and password" });
        }

        const user = await User.findOne({ email }).select("+password");

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (!user.isActive) {
            return res.status(401).json({ message: "Account is deactivated" });
        }

        const token = signToken(user._id);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", protect, async (req, res) => {
    res.json({
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
        },
    });
});

// @route   POST /api/auth/seed
// @desc    Create sample superuser (for initial setup)
// @access  Public (should be removed in production)
router.post("/seed", async (req, res) => {
    try {
        const existingSuperuser = await User.findOne({ role: "superuser" });

        if (existingSuperuser) {
            return res.status(400).json({ message: "Superuser already exists" });
        }

        const superuser = await User.create({
            name: "Super Admin",
            email: "admin@example.com",
            password: "admin123",
            role: "superuser",
        });

        res.status(201).json({
            message: "Superuser created successfully",
            credentials: {
                email: "admin@example.com",
                password: "admin123",
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

export default router;
