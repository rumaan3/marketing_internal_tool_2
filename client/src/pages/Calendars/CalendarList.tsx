import { useState, useEffect } from "react";
import api from "../../api/axios";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Alert from "../../components/ui/alert/Alert";
import PageMeta from "../../components/common/PageMeta";
import { CalendarCard } from "../../components/calendar/CalendarCard";

interface Client {
    _id: string;
    name: string;
}

interface Project {
    _id: string;
    name: string;
    client: { _id: string; name: string } | string; // Handle both populated and ID
}



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

interface Pagination {
    total: number;
    page: number;
    pages: number;
    limit: number;
}

export default function CalendarList() {
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    const [pagination, setPagination] = useState<Pagination>({
        total: 0,
        page: 1,
        pages: 1,
        limit: 10,
    });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterActive, setFilterActive] = useState<string>("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingCalendarId, setEditingCalendarId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        client: "",
        project: "",
        platform: "",
    });
    const [formError, setFormError] = useState("");
    const [formLoading, setFormLoading] = useState(false);

    const fetchCalendars = async (page = 1, limit = 10) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", page.toString());
            params.append("limit", limit.toString());
            if (search) params.append("search", search);
            if (filterActive) params.append("isActive", filterActive);

            const response = await api.get(`/calendars?${params.toString()}`);
            setCalendars(response.data.calendars);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error("Error fetching calendars:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const response = await api.get("/clients?limit=100&isActive=true");
            setClients(response.data.clients);
        } catch (error) {
            console.error("Error fetching clients:", error);
        }
    };

    const fetchProjects = async () => {
        try {
            const response = await api.get("/projects?limit=100&isActive=true");
            setProjects(response.data.projects);
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    };



    useEffect(() => {
        fetchCalendars(pagination.page, pagination.limit);
    }, [search, filterActive]);

    useEffect(() => {
        fetchClients();
        fetchProjects();

    }, []);

    const handlePageChange = (newPage: number) => {
        fetchCalendars(newPage, pagination.limit);
    };

    const openModal = () => {
        setIsEditMode(false);
        setEditingCalendarId(null);
        setFormData({ name: "", client: "", project: "", platform: "" });
        setFormError("");
        setIsModalOpen(true);
    };

    const openEditModal = (calendar: Calendar) => {
        setIsEditMode(true);
        setEditingCalendarId(calendar._id);
        setFormData({
            name: calendar.name,
            client: calendar.client?._id || "",
            project: calendar.project?._id || "",
            platform: calendar.platform || "",

        });
        setFormError("");
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        setFormLoading(true);

        try {
            if (!formData.name) throw new Error("Calendar name is required");
            if (!formData.client) throw new Error("Client is required");
            if (!formData.project) throw new Error("Project is required");
            if (!formData.platform) throw new Error("Platform is required");

            const payload = {
                name: formData.name,
                client: formData.client,
                project: formData.project,
                platform: formData.platform,

            };

            if (isEditMode && editingCalendarId) {
                await api.put(`/calendars/${editingCalendarId}`, payload);
            } else {
                await api.post("/calendars", payload);
            }

            setIsModalOpen(false);
            fetchCalendars(pagination.page, pagination.limit);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            setFormError(err.response?.data?.message || err.message || "Failed to save calendar");
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggleActive = async (calendarId: string) => {
        try {
            await api.patch(`/calendars/${calendarId}/toggle-active`);
            fetchCalendars(pagination.page, pagination.limit);
        } catch (error) {
            console.error("Error toggling calendar:", error);
        }
    };

    const filteredProjects = projects.filter(p => {
        if (!formData.client) return false;
        const pClientId = typeof p.client === 'string' ? p.client : p.client._id;
        return pClientId === formData.client;
    });

    const platformOptions = [
        { value: "facebook", label: "Facebook" },
        { value: "instagram", label: "Instagram" },
        { value: "linkedin", label: "LinkedIn" },
        { value: "blogger", label: "Blogger" },
        { value: "medium", label: "Medium" },
        { value: "reddit", label: "Reddit" },
        { value: "pinterest", label: "Pinterest" },
        { value: "other", label: "Other" },
    ];

    const filterOptions = [
        { value: "", label: "All Status" },
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
    ];

    return (
        <>
            <PageMeta
                title="Calendars | Admin Dashboard"
                description="Manage content calendars"
            />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        Calendars
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Manage content calendars for projects
                    </p>
                </div>
                <Button onClick={openModal}>
                    Add Calendar
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                    <Input
                        type="text"
                        placeholder="Search calendars..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select
                    className="w-40"
                    options={filterOptions}
                    onChange={(value) => setFilterActive(value)}
                    defaultValue={filterActive}
                />
            </div>

            {/* Calendars Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <div className="col-span-full py-8 text-center text-gray-500">
                        Loading...
                    </div>
                ) : calendars.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-gray-500">
                        No calendars found. Click "Add Calendar" to create one.
                    </div>
                ) : (
                    calendars.map((calendar) => (
                        <CalendarCard
                            key={calendar._id}
                            calendar={calendar}
                            onToggleActive={handleToggleActive}
                            onEdit={openEditModal}
                        />
                    ))
                )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                    >
                        Previous
                    </Button>
                    <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.pages}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Create/Edit Calendar Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-md w-full rounded-2xl p-0 overflow-hidden">
                <div className="p-6 max-w-lg">
                    <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                        {isEditMode ? "Edit Calendar" : "Create Calendar"}
                    </h3>

                    {formError && (
                        <Alert variant="error" title="Error" message={formError} />
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Calendar Name *</Label>
                            <Input
                                type="text"
                                placeholder="Enter calendar name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Client *</Label>
                            <Select
                                placeholder="Select Client"
                                options={clients.map(c => ({ value: c._id, label: c.name }))}
                                onChange={(value) => setFormData({ ...formData, client: value, project: "" })} // Reset project on client change
                                defaultValue={formData.client}
                            />
                        </div>

                        <div>
                            <Label>Project *</Label>
                            <Select
                                placeholder="Select Project"
                                options={filteredProjects.map(p => ({ value: p._id, label: p.name }))}
                                onChange={(value) => setFormData({ ...formData, project: value })}
                                defaultValue={formData.project}
                                disabled={!formData.client}
                            />
                        </div>

                        <div>
                            <Label>Platform *</Label>
                            <Select
                                placeholder="Select Platform"
                                options={platformOptions}
                                onChange={(value) => setFormData({ ...formData, platform: value })}
                                defaultValue={formData.platform}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={formLoading}>
                                {formLoading ? "Saving..." : (isEditMode ? "Update Calendar" : "Create Calendar")}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}
