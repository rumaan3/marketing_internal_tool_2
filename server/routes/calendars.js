import express from "express";
import Calendar from "../models/Calendar.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/calendars
// @desc    Get all calendars (paginated)
// @access  Private
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";
        const filterActive = req.query.isActive;
        const filterProject = req.query.project;

        const query = {};

        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        if (filterActive !== undefined) {
            query.isActive = filterActive === "true";
        }

        if (filterProject) {
            query.project = filterProject;
        }

        if (req.query.platform) {
            query.platform = req.query.platform;
        }

        // If user is a client, restrict to their own calendars
        if (req.user.role === "client") {
            if (!req.user.clientId) {
                return res.status(403).json({ message: "Client user has no associated client ID" });
            }
            query.client = req.user.clientId;
        }

        const total = await Calendar.countDocuments(query);
        const calendars = await Calendar.find(query)
            .populate("project", "name status")
            .populate({
                path: "socialMediaEntry",
                select: "platform description imageUrl",
                populate: { path: "client", select: "name" }
            })
            .populate("createdBy", "name email")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.json({
            calendars,
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

// @route   GET /api/calendars/:id
// @desc    Get calendar by ID
// @access  Private
router.get("/:id", async (req, res) => {
    try {
        const calendar = await Calendar.findById(req.params.id)
            .populate("project", "name status client")
            .populate({
                path: "socialMediaEntry",
                select: "platform description imageUrl client",
                populate: { path: "client", select: "name company" }
            })
            .populate("createdBy", "name email");

        if (!calendar) {
            return res.status(404).json({ message: "Calendar not found" });
        }

        // Restrict access for clients
        if (req.user.role === "client") {
            // Check if calendar belongs to this client
            // Note: calendar.client is not populated in the findById call in GET /:id at line 81?
            // Wait, looking at lines 80-87: .populate("project", "name status client") .populate... path: "client" is NOT populated on the root calendar object in the original code?
            // Let's check the view_file output again.
            // Line 81: .populate("project"...)
            // Line 82: .populate(socialMediaEntry...)
            // It does NOT populate "client" path on the calendar itself in the original code block for GET /:id
            // So calendar.client should be an ObjectId string (or object depending on mongoose version if not populated)
            // But line 118 in POST suggests calendar has 'client' field.
            // Safe bet: verify if populated or not. original code didn't populate root 'client'.

            const calendarClientId = calendar.client;
            if (calendarClientId.toString() !== req.user.clientId.toString()) {
                return res.status(403).json({ message: "Not authorized to view this calendar" });
            }
        }

        res.json({ calendar });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   POST /api/calendars
// @desc    Create calendar
// @access  Private
// @route   POST /api/calendars
// @desc    Create calendar
// @access  Private
// @route   POST /api/calendars
// @desc    Create calendar
// @access  Private (Internal only)
router.post("/", restrictTo("superuser", "admin", "staff"), async (req, res) => {
    try {
        const { name, project, client, platform, socialMediaEntry } = req.body;

        if (!project || !client || !platform) {
            return res.status(400).json({
                message: "Project, Client, and Platform are required"
            });
        }

        const calendar = await Calendar.create({
            name,
            project,
            client,
            platform,
            socialMediaEntry,
            createdBy: req.user._id,
        });

        const populatedCalendar = await Calendar.findById(calendar._id)
            .populate("project", "name status")
            .populate("client", "name")
            .populate("socialMediaEntry", "description imageUrl")
            .populate("createdBy", "name email");

        res.status(201).json({ calendar: populatedCalendar });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   PUT /api/calendars/:id
// @desc    Update calendar
// @access  Private
// @route   PUT /api/calendars/:id
// @desc    Update calendar
// @access  Private (Internal only)
router.put("/:id", restrictTo("superuser", "admin", "staff"), async (req, res) => {
    try {
        const { name, project, client, platform, socialMediaEntry } = req.body;

        const calendar = await Calendar.findById(req.params.id);
        if (!calendar) {
            return res.status(404).json({ message: "Calendar not found" });
        }

        calendar.name = name || calendar.name;
        calendar.project = project || calendar.project;
        calendar.client = client || calendar.client;
        calendar.platform = platform || calendar.platform;
        calendar.socialMediaEntry = socialMediaEntry || calendar.socialMediaEntry;

        await calendar.save();

        const populatedCalendar = await Calendar.findById(calendar._id)
            .populate("project", "name status")
            .populate("client", "name")
            .populate("socialMediaEntry", "description imageUrl")
            .populate("createdBy", "name email");

        res.json({ calendar: populatedCalendar });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   PATCH /api/calendars/:id/toggle-active
// @desc    Activate/Deactivate calendar
// @access  Private (Superuser, Admin)
router.patch(
    "/:id/toggle-active",
    restrictTo("superuser", "admin"),
    async (req, res) => {
        try {
            const calendar = await Calendar.findById(req.params.id);
            if (!calendar) {
                return res.status(404).json({ message: "Calendar not found" });
            }

            calendar.isActive = !calendar.isActive;
            await calendar.save();

            const populatedCalendar = await Calendar.findById(calendar._id)
                .populate("project", "name status")
                .populate("socialMediaEntry", "platform description")
                .populate("createdBy", "name email");

            res.json({ calendar: populatedCalendar });
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }
);

export default router;
