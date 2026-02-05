import FacebookIcon from "../../icons/facebook.png";
import InstagramIcon from "../../icons/instagram.png";
import LinkedInIcon from "../../icons/linkedin.png";
import BloggerIcon from "../../icons/blogger.png";
import MediumIcon from "../../icons/medium.png";
import RedditIcon from "../../icons/reddit.png";
import PinterestIcon from "../../icons/pintrest.png";
import YoutubeIcon from "../../icons/youtube.png";
import TiktokIcon from "../../icons/tiktok.png";
import TwitterIcon from "../../icons/twitter.png";
import { FaGlobe } from "react-icons/fa";

import { useNavigate } from "react-router";
import Badge from "../ui/badge/Badge";
import Button from "../ui/button/Button";

interface Calendar {
    _id: string;
    name: string;
    project: {
        _id: string;
        name: string;
        status?: string;
        icon?: string;
    };
    client: {
        _id: string;
        name: string;
    };
    platform: string;
    socialMediaEntry?: {
        platform: string;
        imageUrl?: string;
    };
    isActive: boolean;
    createdAt: string;
}

interface CalendarCardProps {
    calendar: Calendar;
    onToggleActive?: (id: string) => void;
    onEdit?: (calendar: Calendar) => void;
    isReadOnly?: boolean;
}

export const CalendarCard = ({ calendar, onToggleActive, onEdit, isReadOnly = false }: CalendarCardProps) => {
    const navigate = useNavigate();

    const getPlatformIcon = (platform: string) => {
        const p = platform.toLowerCase();
        // Common sizing for icons
        const iconClass = "w-6 h-6 object-contain";

        switch (p) {
            case "facebook": return <img src={FacebookIcon} alt="Facebook" className={iconClass} />;
            case "instagram": return <img src={InstagramIcon} alt="Instagram" className={iconClass} />;
            case "linkedin": return <img src={LinkedInIcon} alt="LinkedIn" className={iconClass} />;
            case "blogger": return <img src={BloggerIcon} alt="Blogger" className={iconClass} />;
            case "medium": return <img src={MediumIcon} alt="Medium" className={iconClass} />;
            case "reddit": return <img src={RedditIcon} alt="Reddit" className={iconClass} />;
            case "pinterest": return <img src={PinterestIcon} alt="Pinterest" className={iconClass} />;
            case "youtube": return <img src={YoutubeIcon} alt="YouTube" className={iconClass} />;
            case "tiktok": return <img src={TiktokIcon} alt="TikTok" className={iconClass} />;
            case "twitter": return <img src={TwitterIcon} alt="Twitter" className={iconClass} />;
            default: return <FaGlobe className="w-6 h-6 text-gray-500" />;
        }
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs transition-shadow duration-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900/50">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                        {calendar.project?.icon ? (
                            <img
                                src={`http://localhost:5000/uploads/project-icons/${calendar.project.icon}`}
                                alt={calendar.project.name}
                                className="h-full w-full rounded-xl object-cover"
                            />
                        ) : (
                            getPlatformIcon(calendar.platform || calendar.socialMediaEntry?.platform || "other")
                        )}
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-800 dark:text-white">
                            {calendar.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {calendar.client?.name || "No Client"} • {calendar.project?.name || "No Project"}
                        </p>
                    </div>
                </div>
                {!isReadOnly && (
                    <div className="flex items-center gap-2">
                        <Badge size="sm" color={calendar.isActive ? "success" : "error"}>
                            {calendar.isActive ? "Active" : "Inactive"}
                        </Badge>
                    </div>
                )}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                        {getPlatformIcon(calendar.platform || calendar.socialMediaEntry?.platform || "other")}
                        <span className="capitalize">{calendar.platform || calendar.socialMediaEntry?.platform || "Platform"}</span>
                    </span>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/calendars/${calendar._id}`)}
                    >
                        View
                    </Button>
                    {!isReadOnly && onToggleActive && (
                        <button
                            onClick={() => onToggleActive(calendar._id)}
                            className={`text-sm font-medium ${calendar.isActive ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'}`}
                        >
                            {calendar.isActive ? "Deactivate" : "Activate"}
                        </button>
                    )}
                    {!isReadOnly && onEdit && (
                        <button
                            onClick={() => onEdit(calendar)}
                            className="text-sm font-medium text-brand-500 hover:text-brand-600"
                        >
                            Edit
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
