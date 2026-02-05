import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import api from "../../api/axios";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../../components/ui/table";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Alert from "../../components/ui/alert/Alert";
import PageMeta from "../../components/common/PageMeta";

interface Project {
    _id: string;
    name: string;
    status: string;
}

interface SocialMediaEntry {
    _id: string;
    platform: string;
    description: string;
}

interface Calendar {
    _id: string;
    name: string;
    project: Project;
    socialMediaEntry: SocialMediaEntry;
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
    const navigate = useNavigate();
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [socialMediaEntries, setSocialMediaEntries] = useState<SocialMediaEntry[]>([]);
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
    const [formData, setFormData] = useState({
        name: "",
        project: "",
        socialMediaEntry: "",
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

    const fetchProjects = async () => {
        try {
            const response = await api.get("/projects?limit=100&isActive=true");
            setProjects(response.data.projects);
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    };

    const fetchSocialMediaEntries = async () => {
        try {
            const response = await api.get("/social-media?limit=100&isActive=true");
            setSocialMediaEntries(response.data.entries);
        } catch (error) {
            console.error("Error fetching social media entries:", error);
        }
    };

    useEffect(() => {
        fetchCalendars(pagination.page, pagination.limit);
    }, [search, filterActive]);

    useEffect(() => {
        fetchProjects();
        fetchSocialMediaEntries();
    }, []);

    const handlePageChange = (newPage: number) => {
        fetchCalendars(newPage, pagination.limit);
    };

    const handleJumpToPage = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            const val = parseInt(e.currentTarget.value);
            if (val >= 1 && val <= pagination.pages) {
                handlePageChange(val);
                e.currentTarget.value = "";
            }
        }
    };

    const openModal = () => {
        setFormData({ name: "", project: "", socialMediaEntry: "" });
        setFormError("");
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        setFormLoading(true);

        try {
            if (!formData.name) {
                throw new Error("Calendar name is required");
            }
            if (!formData.project) {
                throw new Error("Project is required");
            }
            if (!formData.socialMediaEntry) {
                throw new Error("Social Media Entry is required");
            }

            await api.post("/calendars", {
                name: formData.name,
                project: formData.project,
                socialMediaEntry: formData.socialMediaEntry,
            });

            setIsModalOpen(false);
            fetchCalendars(1, pagination.limit);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            setFormError(err.response?.data?.message || err.message || "Failed to create calendar");
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
                    <input
                        type="text"
                        placeholder="Search calendars..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:text-gray-300"
                    />
                </div>
                <Select
                    className="w-40"
                    options={filterOptions}
                    onChange={(value) => setFilterActive(value)}
                    defaultValue={filterActive}
                />
            </div>

            {/* Calendars Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                    <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                            <TableRow>
                                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">Name</TableCell>
                                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">Project</TableCell>
                                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">Platform</TableCell>
                                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">Status</TableCell>
                                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">Actions</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="px-5 py-8 text-center text-gray-500">
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : calendars.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="px-5 py-8 text-center text-gray-500">
                                        No calendars found. Click "Add Calendar" to create one.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                calendars.map((calendar) => (
                                    <TableRow key={calendar._id}>
                                        <TableCell className="px-5 py-4">
                                            <button
                                                onClick={() => navigate(`/calendars/${calendar._id}`)}
                                                className="font-medium text-brand-500 hover:text-brand-600"
                                            >
                                                {calendar.name}
                                            </button>
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-gray-800 dark:text-gray-200">
                                            {calendar.project?.name || "—"}
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <Badge size="sm" color="primary">
                                                {calendar.socialMediaEntry?.platform || "—"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <Badge
                                                size="sm"
                                                color={calendar.isActive ? "success" : "error"}
                                            >
                                                {calendar.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => navigate(`/calendars/${calendar._id}`)}
                                                    className="text-sm text-gray-600 hover:text-brand-500 dark:text-gray-400"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(calendar._id)}
                                                    className="text-sm text-brand-500 hover:text-brand-600"
                                                >
                                                    {calendar.isActive ? "Deactivate" : "Activate"}
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {calendars.length} of {pagination.total} calendars
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
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
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Go to:</span>
                            <input
                                type="number"
                                min={1}
                                max={pagination.pages}
                                placeholder="#"
                                className="w-16 rounded-lg border border-gray-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:text-gray-300"
                                onKeyDown={handleJumpToPage}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Create Calendar Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-md w-full rounded-2xl p-0 overflow-hidden">
                <div className="p-6 max-w-lg">
                    <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                        Create Calendar
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
                            <Label>Project *</Label>
                            <Select
                                placeholder="Select Project"
                                options={projects.map(p => ({ value: p._id, label: p.name }))}
                                onChange={(value) => setFormData({ ...formData, project: value })}
                                defaultValue={formData.project}
                            />
                        </div>

                        <div>
                            <Label>Social Media Entry *</Label>
                            <Select
                                placeholder="Select Social Media Entry"
                                options={socialMediaEntries.map(e => ({
                                    value: e._id,
                                    label: `${e.platform} - ${e.description.substring(0, 30)}...`
                                }))}
                                onChange={(value) => setFormData({ ...formData, socialMediaEntry: value })}
                                defaultValue={formData.socialMediaEntry}
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
                                {formLoading ? "Creating..." : "Create Calendar"}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}
