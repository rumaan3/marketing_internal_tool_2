import mongoose from "mongoose";

const socialMediaEntrySchema = new mongoose.Schema(
    {
        platform: {
            type: String,
            enum: ["facebook", "instagram", "linkedin", "blogger", "medium", "reddit", "pinterest", "other"],
            required: [true, "Platform is required"],
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            // Optional association
        },
        imageUrl: {
            type: String,
            required: [true, "Image is required"],
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
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

const SocialMediaEntry = mongoose.model("SocialMediaEntry", socialMediaEntrySchema);

export default SocialMediaEntry;
