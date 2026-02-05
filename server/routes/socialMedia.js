import express from "express";
import SocialMediaEntry from "../models/SocialMediaEntry.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/social-media
// @desc    Get all social media entries (paginated)
// @access  Private
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";
        const filterActive = req.query.isActive;
        const filterPlatform = req.query.platform;
        const filterClient = req.query.client;

        const query = {};

        if (search) {
            query.$or = [
                { description: { $regex: search, $options: "i" } },
                { platform: { $regex: search, $options: "i" } },
            ];
        }

        if (filterActive !== undefined) {
            query.isActive = filterActive === "true";
        }

        if (filterPlatform) {
            query.platform = filterPlatform;
        }

        if (filterClient) {
            query.client = filterClient;
        }

        const total = await SocialMediaEntry.countDocuments(query);
        const entries = await SocialMediaEntry.find(query)
            .populate("client", "name company")
            .populate("createdBy", "name email")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.json({
            entries,
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

// @route   GET /api/social-media/:id
// @desc    Get social media entry by ID
// @access  Private
router.get("/:id", async (req, res) => {
    try {
        const entry = await SocialMediaEntry.findById(req.params.id)
            .populate("client", "name company email")
            .populate("createdBy", "name email");

        if (!entry) {
            return res.status(404).json({ message: "Entry not found" });
        }

        res.json({ entry });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   POST /api/social-media
// @desc    Create social media entry
// @access  Private
router.post("/", async (req, res) => {
    try {
        const { platform, client, imageUrl, description } = req.body;

        const entry = await SocialMediaEntry.create({
            platform,
            client: client || undefined,
            imageUrl,
            description,
            createdBy: req.user._id,
        });

        const populatedEntry = await SocialMediaEntry.findById(entry._id)
            .populate("client", "name company")
            .populate("createdBy", "name email");

        res.status(201).json({ entry: populatedEntry });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   PUT /api/social-media/:id
// @desc    Update social media entry
// @access  Private
router.put("/:id", async (req, res) => {
    try {
        const { platform, client, imageUrl, description } = req.body;

        const entry = await SocialMediaEntry.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ message: "Entry not found" });
        }

        entry.platform = platform || entry.platform;
        entry.client = client !== undefined ? (client || null) : entry.client;
        entry.imageUrl = imageUrl || entry.imageUrl;
        entry.description = description !== undefined ? description : entry.description;

        await entry.save();

        const populatedEntry = await SocialMediaEntry.findById(entry._id)
            .populate("client", "name company")
            .populate("createdBy", "name email");

        res.json({ entry: populatedEntry });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   PATCH /api/social-media/:id/toggle-active
// @desc    Activate/Deactivate social media entry
// @access  Private (Superuser, Admin)
router.patch(
    "/:id/toggle-active",
    restrictTo("superuser", "admin"),
    async (req, res) => {
        try {
            const entry = await SocialMediaEntry.findById(req.params.id);
            if (!entry) {
                return res.status(404).json({ message: "Entry not found" });
            }

            entry.isActive = !entry.isActive;
            await entry.save();

            const populatedEntry = await SocialMediaEntry.findById(entry._id)
                .populate("client", "name company")
                .populate("createdBy", "name email");

            res.json({ entry: populatedEntry });
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }
);

export default router;
