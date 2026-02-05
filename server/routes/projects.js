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

        // If user is a client, restrict to their own projects
        if (req.user.role === "client") {
            if (!req.user.clientId) {
                return res.status(403).json({ message: "Client user has no associated client ID" });
            }
            query.client = req.user.clientId;
        }

        const total = await Project.countDocuments(query);
        const projects = await Project.find(query)
            .populate("client", "name company")
            .populate("createdBy", "name email")
            .populate("assignedStaff", "name email role")
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

        // Restrict access for clients
        if (req.user.role === "client") {
            // Check if project belongs to this client
            // Note: project.client is populated, so we check _id
            const projectClientId = project.client?._id || project.client;
            if (projectClientId.toString() !== req.user.clientId.toString()) {
                return res.status(403).json({ message: "Not authorized to view this project" });
            }
        }

        res.json({ project });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   POST /api/projects
// @desc    Create project
// @access  Private
// @route   POST /api/projects
// @desc    Create project
// @access  Private (Internal only)
router.post("/", restrictTo("superuser", "admin", "staff"), async (req, res) => {
    try {
        const { name, description, client, status, startDate, endDate, assignedStaff } = req.body;

        const project = await Project.create({
            name,
            description,
            client,
            status,
            startDate,
            endDate,
            assignedStaff: assignedStaff || [],
            createdBy: req.user._id,
        });

        const populatedProject = await Project.findById(project._id)
            .populate("client", "name company")
            .populate("assignedStaff", "name email role")
            .populate("createdBy", "name email");

        res.status(201).json({ project: populatedProject });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private
// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (Internal only)
router.put("/:id", restrictTo("superuser", "admin", "staff"), async (req, res) => {
    try {
        const { name, description, client, status, startDate, endDate, assignedStaff } = req.body;

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
        if (assignedStaff) {
            project.assignedStaff = assignedStaff;
        }

        await project.save();

        const populatedProject = await Project.findById(project._id)
            .populate("client", "name company")
            .populate("assignedStaff", "name email role")
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

import multer from "multer";
import path from "path";
import fs from "fs";
import { processProjectIcon } from "../utils/imageProcessor.js";

// ... existing code ...

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit to 10MB initially, we'll compress
});

// @route   POST /api/projects/:id/icon
// @desc    Upload project icon
// @access  Private (Admin/Manager)
// @route   POST /api/projects/:id/icon
// @desc    Upload project icon
// @access  Private (Admin/Manager/Staff)
router.post("/:id/icon", restrictTo("superuser", "admin", "staff"), upload.single("icon"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        const uploadDir = path.join("uploads", "project-icons");
        const filename = `project-${project._id}-${Date.now()}`;

        // Process image (convert to WebP, resize, max 500KB)
        const savedFilename = await processProjectIcon(req.file.buffer, uploadDir, filename, 500);

        // Delete old icon if exists
        if (project.icon) {
            const oldIconPath = path.join(uploadDir, project.icon);
            if (fs.existsSync(oldIconPath)) {
                fs.unlinkSync(oldIconPath);
            }
        }

        project.icon = savedFilename;
        await project.save();

        res.json({ icon: savedFilename, message: "Icon uploaded successfully" });
    } catch (error) {
        console.error("Icon upload error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   PUT /api/projects/:id/staff
// @desc    Assign/Update staff for project
// @access  Private (Admin/Manager)
router.put("/:id/staff", restrictTo("superuser", "admin", "manager"), async (req, res) => {
    try {
        const { assignedStaff } = req.body; // Array of User IDs

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        project.assignedStaff = assignedStaff;
        await project.save();

        const populatedProject = await Project.findById(project._id)
            .populate("client", "name company")
            .populate("createdBy", "name email")
            .populate("assignedStaff", "name email role");

        res.json({ project: populatedProject });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

export default router;
