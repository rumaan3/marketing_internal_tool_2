import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: [true, "Project is required"],
        },
        platform: {
            type: String,
            enum: ["facebook", "instagram", "linkedin", "blogger", "medium", "reddit", "pinterest", "tiktok", "youtube", "other"],
            required: [true, "Platform is required"],
        },
        imageUrl: {
            type: String,
            required: [true, "Image is required"],
        },
        // Store technical metadata for verification
        imageMetadata: {
            width: Number,
            height: Number,
            format: String,
            size: Number,
        },
        caption: {
            type: String,
            required: [true, "Caption is required"],
            trim: true,
        },
        scheduleDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: ["draft", "pending_approval", "scheduled", "published"],
            default: "draft",
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            // Optional, derived from Project usually but good to have for quick access
        },
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

const Post = mongoose.model("Post", postSchema);

export default Post;
