import express from "express";
import User from "../models/User.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/users
// @desc    Get all staff (paginated)
// @access  Private (Superuser, Admin)
router.get("/", restrictTo("superuser", "admin"), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";
        const filterActive = req.query.isActive;

        const query = { role: { $ne: "superuser" } };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        if (filterActive !== undefined) {
            query.isActive = filterActive === "true";
        }

        // Filter by role if specified
        if (req.query.role) {
            query.role = req.query.role;
        }

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select("-password")
            .populate("clientId", "name company")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.json({
            users,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   POST /api/users
// @desc    Create staff or client user
// @access  Private (Superuser, Admin)
router.post("/", restrictTo("superuser", "admin"), async (req, res) => {
    try {
        const { name, email, password, role, clientId } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        // Check if role is allowed based on creator's role
        const allowedRoles = ["admin", "staff", "client"];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        // Only superuser can create admins
        if (role === "admin" && req.user.role !== "superuser") {
            return res.status(403).json({ message: "Only superuser can create admins" });
        }

        // Client ID is required for client users
        if (role === "client" && !clientId) {
            return res.status(400).json({ message: "Client ID is required for client users" });
        }

        const user = await User.create({
            name,
            email,
            password,
            role,
            clientId: role === "client" ? clientId : undefined,
        });

        res.status(201).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                clientId: user.clientId,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   PUT /api/users/:id
// @desc    Update staff member
// @access  Private (Superuser only)
router.put("/:id", restrictTo("superuser"), async (req, res) => {
    try {
        const { name, email, role } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === "superuser") {
            return res.status(403).json({ message: "Cannot modify superuser" });
        }

        if (email && email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "Email already in use" });
            }
        }

        user.name = name || user.name;
        user.email = email || user.email;
        if (role && ["admin", "staff"].includes(role)) {
            user.role = role;
        }

        await user.save();

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   PATCH /api/users/:id/toggle-active
// @desc    Activate/Deactivate staff member
// @access  Private (Superuser only)
router.patch("/:id/toggle-active", restrictTo("superuser"), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === "superuser") {
            return res.status(403).json({ message: "Cannot deactivate superuser" });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
            },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

export default router;
