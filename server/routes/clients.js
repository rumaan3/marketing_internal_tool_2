import express from "express";
import Client from "../models/Client.js";
import { protect, restrictTo } from "../middleware/auth.js";
import { encrypt } from "../utils/encryption.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   GET /api/clients
// @desc    Get all clients (paginated)
// @access  Private
router.get("/", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || "";
        const filterActive = req.query.isActive;

        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { company: { $regex: search, $options: "i" } },
            ];
        }

        if (filterActive !== undefined) {
            query.isActive = filterActive === "true";
        }

        const total = await Client.countDocuments(query);
        const clients = await Client.find(query)
            .populate("createdBy", "name email")
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.json({
            clients,
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

// @route   GET /api/clients/:id
// @desc    Get client by ID
// @access  Private
router.get("/:id", async (req, res) => {
    try {
        // Restrict access: Admins/Superusers OR the client themselves
        if (req.user.role === "client" && req.user.clientId !== req.params.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        const client = await Client.findById(req.params.id)
            .populate("createdBy", "name email")
            .select("-credentials.encryptedData -credentials.iv"); // Exclude sensitive encryption data

        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        res.json({ client });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   POST /api/clients
// @desc    Create client
// @access  Private (Superuser, Admin, Staff)
router.post("/", async (req, res) => {
    try {
        const { name, email, phone, company, address } = req.body;

        const client = await Client.create({
            name,
            email,
            phone,
            company,
            address,
            createdBy: req.user._id,
        });

        res.status(201).json({ client });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   PUT /api/clients/:id
// @desc    Update client
// @access  Private
router.put("/:id", async (req, res) => {
    try {
        const { name, email, phone, company, address } = req.body;

        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        client.name = name || client.name;
        client.email = email || client.email;
        client.phone = phone !== undefined ? phone : client.phone;
        client.company = company !== undefined ? company : client.company;
        client.address = address !== undefined ? address : client.address;

        await client.save();

        res.json({ client });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// @route   PATCH /api/clients/:id/toggle-active
// @desc    Activate/Deactivate client
// @access  Private (Superuser, Admin)
router.patch(
    "/:id/toggle-active",
    restrictTo("superuser", "admin"),
    async (req, res) => {
        try {
            const client = await Client.findById(req.params.id);
            if (!client) {
                return res.status(404).json({ message: "Client not found" });
            }

            client.isActive = !client.isActive;
            await client.save();

            res.json({ client });
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }
);

// @route   POST /api/clients/credentials
// @desc    Add or update client credentials
// @access  Private (Client, Admin)
router.post("/credentials", async (req, res) => {
    try {
        const { credentials, clientId } = req.body;

        let targetClientId;

        if (req.user.role === "client") {
            targetClientId = req.user.clientId;
        } else if (["superuser", "admin"].includes(req.user.role)) {
            if (!clientId) {
                return res.status(400).json({ message: "Client ID is required" });
            }
            targetClientId = clientId;
        } else {
            return res.status(403).json({ message: "Not authorized" });
        }

        const client = await Client.findById(targetClientId);
        if (!client) {
            return res.status(404).json({ message: "Client not found" });
        }

        // Process credentials
        if (credentials && Array.isArray(credentials)) {
            credentials.forEach((cred) => {
                const { platform, password } = cred;
                if (!platform || !password) return;

                const { encryptedData, iv } = encrypt(password);

                // Check if platform already exists
                const existingIndex = client.credentials.findIndex(
                    (c) => c.platform.toLowerCase() === platform.toLowerCase()
                );

                if (existingIndex > -1) {
                    client.credentials[existingIndex] = {
                        platform,
                        encryptedData,
                        iv,
                    };
                } else {
                    client.credentials.push({
                        platform,
                        encryptedData,
                        iv,
                    });
                }
            });
        }

        await client.save();

        res.json({ message: "Credentials updated successfully", credentials: client.credentials.map(c => ({ platform: c.platform })) });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

export default router;
