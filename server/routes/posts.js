import express from "express";
import Post from "../models/Post.js";
import Project from "../models/Project.js";
import { protect, restrictTo } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";

const router = express.Router();

// Configure multer for RAW storage (no resizing here, just size limit)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join("uploads", "posts");
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Safe filename: post-{timestamp}-{random}.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `post-${uniqueSuffix}${ext}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only images are allowed"));
        }
    }
});

// All routes require authentication
router.use(protect);

// @route   GET /api/posts
// @desc    Get all posts (paginated, filtered)
// @access  Private
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";
        const filterStatus = req.query.status;
        const filterPlatform = req.query.platform;
        const filterProject = req.query.project;

        const query = {};

        if (search) {
            query.caption = { $regex: search, $options: "i" };
        }

        if (filterStatus) {
            query.status = filterStatus;
        }

        if (filterPlatform) {
            query.platform = filterPlatform;
        }

        if (filterProject) {
            query.project = filterProject;
        }

        // Client restriction
        if (req.user.role === "client") {
            if (!req.user.clientId) {
                return res.status(403).json({ message: "Client user has no client ID" });
            }
            query.client = req.user.clientId;
        }

        const total = await Post.countDocuments(query);
        const posts = await Post.find(query)
            .populate("client", "name company")
            .populate("project", "name")
            .populate("createdBy", "name email")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.json({
            posts,
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

// @route   GET /api/posts/:id
// @desc    Get post by ID
// @access  Private
router.get("/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate("client", "name company")
            .populate("project", "name")
            .populate("createdBy", "name email");

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        // Ownership check for clients
        if (req.user.role === "client") {
            if (post.client?._id.toString() !== req.user.clientId.toString()) {
                return res.status(403).json({ message: "Not authorized to view this post" });
            }
        }

        res.json({ post });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   POST /api/posts
// @desc    Create new post
// @access  Private
router.post("/", upload.single("image"), async (req, res) => {
    try {
        const { platform, project, caption, scheduleDate, status } = req.body;

        // Validation
        if (!req.file) {
            return res.status(400).json({ message: "Image is required" });
        }
        if (!platform || !project || !caption) {
            // Clean up uploaded file if validation fails
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: "Platform, Project, and Caption are required" });
        }

        // Verify Project and get Client ID
        const projectObj = await Project.findById(project);
        if (!projectObj) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: "Project not found" });
        }

        let imageMetadata = {};
        try {
            // Extract metadata using sharp
            const metadata = await sharp(req.file.path).metadata();
            imageMetadata = {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: metadata.size // This is usually available
            };
            imageMetadata.size = req.file.size; // Use actual file size as primary source
        } catch (err) {
            console.error("Metadata extraction failed:", err);
            // Non-blocking, continue
        }

        // Construct relative URL for frontend
        const imageUrl = `http://localhost:5000/uploads/posts/${req.file.filename}`;

        const post = await Post.create({
            platform,
            project: projectObj._id,
            client: projectObj.client, // Derive client from project
            imageUrl,
            imageMetadata,
            caption,
            scheduleDate: scheduleDate ? new Date(scheduleDate) : undefined,
            status: status || "draft",
            createdBy: req.user._id,
            isActive: true
        });

        const populatedPost = await Post.findById(post._id)
            .populate("client", "name")
            .populate("project", "name");

        res.status(201).json({ post: populatedPost });
    } catch (error) {
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private
router.put("/:id", async (req, res) => {
    try {
        const { platform, project, caption, scheduleDate, status } = req.body;
        // Image update not handled in this simple PUT, usually requires separate endpoint or multipart logic handling
        // Keeping it simple: update metadata fields only

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        post.platform = platform || post.platform;
        post.caption = caption || post.caption;
        post.scheduleDate = scheduleDate ? new Date(scheduleDate) : post.scheduleDate;
        post.status = status || post.status;

        if (project && project !== post.project.toString()) {
            // If checking project change, verify new project exists
            const projectObj = await Project.findById(project);
            if (projectObj) {
                post.project = project;
                post.client = projectObj.client;
            }
        }

        await post.save();

        const populatedPost = await Post.findById(post._id)
            .populate("client", "name company")
            .populate("project", "name")
            .populate("createdBy", "name email");

        res.json({ post: populatedPost });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   PATCH /api/posts/:id/toggle-active
// @desc    Activate/Deactivate post
// @access  Private (Superuser, Admin)
router.patch(
    "/:id/toggle-active",
    restrictTo("superuser", "admin", "manager"), // Restrict appropriately
    async (req, res) => {
        try {
            const post = await Post.findById(req.params.id);
            if (!post) {
                return res.status(404).json({ message: "Post not found" });
            }

            post.isActive = !post.isActive;
            await post.save();

            const populatedPost = await Post.findById(post._id)
                .populate("client", "name company")
                .populate("project", "name");

            res.json({ post: populatedPost });
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }
);

export default router;
