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
        socialMediaEntry: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SocialMediaEntry",
            required: [true, "Social Media Entry is required"],
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
