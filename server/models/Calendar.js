import mongoose from "mongoose";

const calendarSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Calendar name is required"],
            trim: true,
        },

        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: [true, "Project is required"],
        },
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: [true, "Client is required"],
        },
        platform: {
            type: String,
            enum: ["facebook", "instagram", "linkedin", "blogger", "medium", "reddit", "pinterest", "other"],
            required: [true, "Platform is required"],
        },
        socialMediaEntry: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SocialMediaEntry",
            required: [false, "Social Media Entry is optional"], // Changed to optional as per plan to decouple? Or keep mandatory? Plan says "Ensure fields for Client, Project, and Platform exist". It implies Calendar might exist without a full entry yet? Let's make it optional for now to be safe, or keep it if existing data relies on it. existing data definitely has it. I'll keep it mandatory if not specified otherwise. Wait, if I'm "replacing Social Media with Create Post", maybe I should relax this. But I don't want to break existing logic yet. I'll keep it required for now but add the new fields.
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

const Calendar = mongoose.model("Calendar", calendarSchema);

export default Calendar;
