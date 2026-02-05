import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import api from "../../api/axios";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import PageMeta from "../../components/common/PageMeta";

interface Calendar {
    _id: string;
    name: string;
    project: {
        _id: string;
        name: string;
        status: string;
    };
    socialMediaEntry: {
        _id: string;
        platform: string;
        description: string;
        imageUrl: string;
    };
    isActive: boolean;
}

export default function CalendarView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [calendar, setCalendar] = useState<Calendar | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    useEffect(() => {
        const fetchCalendar = async () => {
            try {
                const response = await api.get(`/calendars/${id}`);
                setCalendar(response.data.calendar);
            } catch (error) {
                console.error("Error fetching calendar:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCalendar();
        }
    }, [id]);

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDayOfWeek = firstDay.getDay();

        const days: (number | null)[] = [];

        // Add empty cells for days before first of month
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setSelectedDate(clickedDate);
        setIsDateModalOpen(true);
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const days = getDaysInMonth(currentDate);

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <span className="text-gray-500">Loading...</span>
            </div>
        );
    }

    if (!calendar) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-4">
                <span className="text-gray-500">Calendar not found</span>
                <Button onClick={() => navigate("/calendars")}>Back to Calendars</Button>
            </div>
        );
    }

    return (
        <>
            <PageMeta
                title={`${calendar.name} | Calendar`}
                description="View calendar details"
            />

            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => navigate("/calendars")}
                        className="mb-2 text-sm text-gray-500 hover:text-brand-500 dark:text-gray-400"
                    >
                        ← Back to Calendars
                    </button>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        {calendar.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Project: {calendar.project?.name} • Platform: {calendar.socialMediaEntry?.platform}
                    </p>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                {/* Month Navigation */}
                <div className="mb-6 flex items-center justify-between">
                    <Button size="sm" variant="outline" onClick={handlePrevMonth}>
                        ← Prev
                    </Button>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h3>
                    <Button size="sm" variant="outline" onClick={handleNextMonth}>
                        Next →
                    </Button>
                </div>

                {/* Day Headers */}
                <div className="mb-2 grid grid-cols-7 gap-1">
                    {dayNames.map((day) => (
                        <div
                            key={day}
                            className="py-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, index) => (
                        <div
                            key={index}
                            className={`min-h-[80px] rounded-lg border p-2 ${day === null
                                ? "border-transparent"
                                : "border-gray-200 bg-gray-50 hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                }`}
                            onClick={() => day !== null && handleDateClick(day)}
                        >
                            {day !== null && (
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {day}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Date Click Modal */}
            <Modal isOpen={isDateModalOpen} onClose={() => setIsDateModalOpen(false)} className="max-w-sm w-full rounded-2xl p-0 overflow-hidden">
                <div className="p-6 text-center">
                    <div className="mb-4 text-5xl">📅</div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-800 dark:text-white">
                        {selectedDate?.toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </h3>
                    <p className="mb-6 text-gray-500 dark:text-gray-400">
                        Additional features coming soon
                    </p>
                    <Button onClick={() => setIsDateModalOpen(false)}>
                        Close
                    </Button>
                </div>
            </Modal>
        </>
    );
}
