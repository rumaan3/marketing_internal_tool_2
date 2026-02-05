import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Project name is required"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: [true, "Client is required"],
        },
        status: {
            type: String,
            enum: ["pending", "in-progress", "completed", "on-hold"],
            default: "pending",
        },
        startDate: {
            type: Date,
        },
        endDate: {
            type: Date,
        },
        icon: {
            type: String, // Path to local file
            default: null,
        },
        assignedStaff: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }],
        isActive: {
            type: Boolean,
            default: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
