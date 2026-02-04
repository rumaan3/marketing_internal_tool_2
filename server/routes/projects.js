import express from "express";
import Project from "../models/Project.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/projects
// @desc    Get all projects (paginated)
// @access  Private
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";
        const filterActive = req.query.isActive;
        const filterStatus = req.query.status;
        const filterClient = req.query.client;

        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        if (filterActive !== undefined) {
            query.isActive = filterActive === "true";
        }

        if (filterStatus) {
            query.status = filterStatus;
        }

        if (filterClient) {
            query.client = filterClient;
        }

        const total = await Project.countDocuments(query);
        const projects = await Project.find(query)
            .populate("client", "name company")
            .populate("createdBy", "name email")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.json({
            projects,
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

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get("/:id", async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate("client", "name company email")
            .populate("createdBy", "name email");

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        res.json({ project });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   POST /api/projects
// @desc    Create project
// @access  Private
router.post("/", async (req, res) => {
    try {
        const { name, description, client, status, startDate, endDate } = req.body;

        const project = await Project.create({
            name,
            description,
            client,
            status,
            startDate,
            endDate,
            createdBy: req.user._id,
        });

        const populatedProject = await Project.findById(project._id)
            .populate("client", "name company")
            .populate("createdBy", "name email");

        res.status(201).json({ project: populatedProject });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private
router.put("/:id", async (req, res) => {
    try {
        const { name, description, client, status, startDate, endDate } = req.body;

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        project.name = name || project.name;
        project.description = description !== undefined ? description : project.description;
        project.client = client || project.client;
        project.status = status || project.status;
        project.startDate = startDate !== undefined ? startDate : project.startDate;
        project.endDate = endDate !== undefined ? endDate : project.endDate;

        await project.save();

        const populatedProject = await Project.findById(project._id)
            .populate("client", "name company")
            .populate("createdBy", "name email");

        res.json({ project: populatedProject });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   PATCH /api/projects/:id/toggle-active
// @desc    Activate/Deactivate project
// @access  Private (Superuser, Admin)
router.patch(
    "/:id/toggle-active",
    restrictTo("superuser", "admin"),
    async (req, res) => {
        try {
            const project = await Project.findById(req.params.id);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }

            project.isActive = !project.isActive;
            await project.save();

            const populatedProject = await Project.findById(project._id)
                .populate("client", "name company")
                .populate("createdBy", "name email");

            res.json({ project: populatedProject });
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }
);

export default router;
