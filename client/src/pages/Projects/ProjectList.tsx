import { useState, useEffect } from "react";
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
import PageMeta from "../../components/common/PageMeta";

interface Client {
    _id: string;
    name: string;
    company?: string;
}

interface Project {
    _id: string;
    name: string;
    description?: string;
    client: Client;
    status: "planning" | "in-progress" | "completed" | "on-hold";
    isActive: boolean;
    startDate?: string;
    endDate?: string;
    createdAt: string;
}

interface Pagination {
    total: number;
    page: number;
    pages: number;
    limit: number;
}

export default function ProjectList() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        total: 0,
        page: 1,
        pages: 1,
        limit: 10,
    });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterActive, setFilterActive] = useState<string>("");
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [filterClient, setFilterClient] = useState<string>("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        client: "",
        status: "planning" as Project["status"],
        startDate: "",
        endDate: "",
    });
    const [formError, setFormError] = useState("");
    const [formLoading, setFormLoading] = useState(false);

    const fetchProjects = async (page = 1, limit = 10) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", page.toString());
            params.append("limit", limit.toString());
            if (search) params.append("search", search);
            if (filterActive) params.append("isActive", filterActive);
            if (filterStatus) params.append("status", filterStatus);
            if (filterClient) params.append("client", filterClient);

            const response = await api.get(`/projects?${params.toString()}`);
            setProjects(response.data.projects);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error("Error fetching projects:", error);
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

    useEffect(() => {
        fetchClients();
    }, []);

    useEffect(() => {
        fetchProjects(pagination.page, pagination.limit);
    }, [search, filterActive, filterStatus, filterClient]);

    const handlePageChange = (newPage: number) => {
        fetchProjects(newPage, pagination.limit);
    };

    const handleShowMore = () => {
        const newLimit = Math.min(pagination.limit + 10, 50);
        fetchProjects(pagination.page, newLimit);
    };

    const handleToggleActive = async (projectId: string) => {
        try {
            await api.patch(`/projects/${projectId}/toggle-active`);
            fetchProjects(pagination.page, pagination.limit);
        } catch (error) {
            console.error("Error toggling project status:", error);
        }
    };

    const openAddModal = () => {
        setEditingProject(null);
        setFormData({
            name: "",
            description: "",
            client: "",
            status: "planning",
            startDate: "",
            endDate: "",
        });
        setFormError("");
        setIsModalOpen(true);
    };

    const openEditModal = (project: Project) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            description: project.description || "",
            client: project.client._id,
            status: project.status,
            startDate: project.startDate ? project.startDate.split("T")[0] : "",
            endDate: project.endDate ? project.endDate.split("T")[0] : "",
        });
        setFormError("");
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError("");

        try {
            const payload = {
                ...formData,
                startDate: formData.startDate || undefined,
                endDate: formData.endDate || undefined,
            };

            if (editingProject) {
                await api.put(`/projects/${editingProject._id}`, payload);
            } else {
                await api.post("/projects", payload);
            }
            setIsModalOpen(false);
            fetchProjects(pagination.page, pagination.limit);
        } catch (error: any) {
            setFormError(error.response?.data?.message || "An error occurred");
        } finally {
            setFormLoading(false);
        }
    };

    const statusOptions = [
        { value: "planning", label: "Planning" },
        { value: "in-progress", label: "In Progress" },
        { value: "completed", label: "Completed" },
        { value: "on-hold", label: "On Hold" },
    ];

    const filterActiveOptions = [
        { value: "", label: "All Status" },
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
    ];

    const filterStatusOptions = [
        { value: "", label: "All Projects" },
        ...statusOptions,
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "success";
            case "in-progress":
                return "primary";
            case "on-hold":
                return "warning";
            default:
                return "light";
        }
    };

    return (
        <>
            <PageMeta title="Project Management | Admin Panel" description="Manage projects" />

            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                {/* Header */}
                <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Projects
                    </h3>
                    <div className="flex flex-wrap gap-3 sm:flex-row sm:items-center">
                        {/* Search */}
                        <input
                            type="text"
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white sm:w-40"
                        />
                        {/* Client Filter */}
                        <select
                            value={filterClient}
                            onChange={(e) => setFilterClient(e.target.value)}
                            className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                        >
                            <option value="">All Clients</option>
                            {clients.map((client) => (
                                <option key={client._id} value={client._id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                        {/* Status Filter */}
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                        >
                            {filterStatusOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {/* Active Filter */}
                        <select
                            value={filterActive}
                            onChange={(e) => setFilterActive(e.target.value)}
                            className="h-10 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white"
                        >
                            {filterActiveOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        {/* Add Button */}
                        <Button size="sm" onClick={openAddModal}>
                            Add Project
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="max-w-full overflow-x-auto">
                    <Table>
                        <TableHeader className="border-y border-gray-100 dark:border-gray-800">
                            <TableRow>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    Project Name
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    Client
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    Project Status
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    Active
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    Actions
                                </TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <TableRow>
                                    <TableCell className="px-5 py-8 text-center text-gray-500" colSpan={5}>
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : projects.length === 0 ? (
                                <TableRow>
                                    <TableCell className="px-5 py-8 text-center text-gray-500" colSpan={5}>
                                        No projects found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                projects.map((project) => (
                                    <TableRow key={project._id}>
                                        <TableCell className="px-5 py-4">
                                            <div>
                                                <span className="block text-gray-800 dark:text-white/90">
                                                    {project.name}
                                                </span>
                                                {project.description && (
                                                    <span className="block text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                                        {project.description}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                                            {project.client?.name || "-"}
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <Badge size="sm" color={getStatusColor(project.status)}>
                                                {project.status.replace("-", " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <Badge size="sm" color={project.isActive ? "success" : "error"}>
                                                {project.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(project)}
                                                    className="text-sm text-brand-500 hover:text-brand-600"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(project._id)}
                                                    className={`text-sm ${project.isActive ? "text-red-500 hover:text-red-600" : "text-green-500 hover:text-green-600"}`}
                                                >
                                                    {project.isActive ? "Deactivate" : "Activate"}
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {projects.length} of {pagination.total} results
                    </div>
                    <div className="flex items-center gap-2">
                        {pagination.limit < 50 && pagination.total > pagination.limit && (
                            <Button variant="outline" size="sm" onClick={handleShowMore}>
                                Show More
                            </Button>
                        )}
                        {pagination.pages > 1 && (
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page - 1)}
                                    disabled={pagination.page === 1}
                                >
                                    Prev
                                </Button>
                                <span className="px-3 text-sm text-gray-600 dark:text-gray-400">
                                    {pagination.page} / {pagination.pages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.page + 1)}
                                    disabled={pagination.page === pagination.pages}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="p-6">
                    <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white">
                        {editingProject ? "Edit Project" : "Add Project"}
                    </h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {formError && (
                            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                                {formError}
                            </div>
                        )}
                        <div>
                            <Label>Project Name *</Label>
                            <Input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter project name"
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Enter description"
                            />
                        </div>
                        <div>
                            <Label>Client *</Label>
                            <select
                                value={formData.client}
                                onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                            >
                                <option value="">Select a client</option>
                                {clients.map((client) => (
                                    <option key={client._id} value={client._id}>
                                        {client.name} {client.company ? `(${client.company})` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label>Status</Label>
                            <Select
                                options={statusOptions}
                                defaultValue={formData.status}
                                onChange={(value) => setFormData({ ...formData, status: value as Project["status"] })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>End Date</Label>
                                <Input
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
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
                                {formLoading ? "Saving..." : editingProject ? "Update" : "Create"}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}
