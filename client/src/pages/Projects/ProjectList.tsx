import { useState, useEffect } from "react";
import api from "../../api/axios";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { Dropdown } from "../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../components/ui/dropdown/DropdownItem";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import MultiSelect from "../../components/form/MultiSelect";
import Alert from "../../components/ui/alert/Alert";
import PageMeta from "../../components/common/PageMeta";
import { ProjectCard } from "../../components/project/ProjectCard";
import { PlusIcon } from "../../icons";

interface Client {
    _id: string;
    name: string;
    company?: string;
}

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
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
    icon?: string;
    assignedStaff?: {
        _id: string;
        name: string;
        email: string;
    }[];
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
    const [staffList, setStaffList] = useState<User[]>([]);
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
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        client: "",
        status: "planning" as Project["status"],
        startDate: "",
        endDate: "",
        assignedStaff: [] as string[],
    });
    const [iconFile, setIconFile] = useState<File | null>(null);
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

    const fetchStaff = async () => {
        try {
            const response = await api.get("/users?role=staff,manager,admin");
            // Assuming users endpoint supports filtering or returns all. 
            // If not, we might need to filter client-side or update backend.
            // For now, let's assume /users returns users.
            setStaffList(response.data.users || response.data);
        } catch (error) {
            console.error("Error fetching staff:", error);
        }
    };

    useEffect(() => {
        fetchClients();
        fetchStaff();
    }, []);

    useEffect(() => {
        fetchProjects(pagination.page, pagination.limit);
    }, [search, filterActive, filterStatus, filterClient]);

    const handlePageChange = (newPage: number) => {
        fetchProjects(newPage, pagination.limit);
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
            assignedStaff: [],
        });
        setIconFile(null);
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
            assignedStaff: project.assignedStaff ? project.assignedStaff.map(s => s._id) : [],
        });
        setIconFile(null);
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

            let projectId;

            if (editingProject) {
                await api.put(`/projects/${editingProject._id}`, payload);
                projectId = editingProject._id;
            } else {
                const res = await api.post("/projects", payload);
                projectId = res.data.project._id;
            }

            // Handle Icon Upload
            if (iconFile && projectId) {
                const iconFormData = new FormData();
                iconFormData.append("icon", iconFile);
                await api.post(`/projects/${projectId}/icon`, iconFormData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
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

    return (
        <>
            <PageMeta title="Project Management | Admin Panel" description="Manage projects" />

            <div className="">
                {/* Header */}
                <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Projects
                    </h2>
                    <div className="flex flex-wrap gap-3 sm:flex-row sm:items-center">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 pl-10 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white sm:w-64"
                            />
                            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Add Button */}
                        <Button size="sm" onClick={openAddModal} startIcon={<PlusIcon className="size-5" />}>
                            Add Project
                        </Button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="mb-6 flex flex-wrap gap-3 p-4 bg-white rounded-xl border border-gray-200 dark:bg-gray-900 dark:border-gray-800">
                    {/* Client Filter */}
                    <Select
                        className="w-48"
                        placeholder="All Clients"
                        options={[{ value: "", label: "All Clients" }, ...clients.map(c => ({ value: c._id, label: c.name }))]}
                        onChange={(value) => setFilterClient(value)}
                        defaultValue={filterClient}
                    />
                    {/* Status Filter */}
                    <Select
                        className="w-48"
                        options={filterStatusOptions}
                        onChange={(value) => setFilterStatus(value)}
                        defaultValue={filterStatus}
                    />
                    {/* Active Filter */}
                    <Select
                        className="w-48"
                        options={filterActiveOptions}
                        onChange={(value) => setFilterActive(value)}
                        defaultValue={filterActive}
                    />
                </div>

                {/* Projects Grid */}
                {loading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex h-60 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                        <div className="mb-3 rounded-full bg-gray-100 p-3 dark:bg-gray-800">
                            <PlusIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">No projects found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {projects.map((project) => (
                            <ProjectCard
                                key={project._id}
                                project={project}
                                onEdit={openEditModal}
                                onToggleActive={handleToggleActive}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="mt-8 flex justify-center">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                            >
                                Previous
                            </Button>
                            <span className="px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                                Page {pagination.page} of {pagination.pages}
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
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                className="max-w-xl w-full mx-4"
            >
                <div className="p-6">
                    <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white">
                        {editingProject ? "Edit Project" : "Add Project"}
                    </h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {formError && (
                            <Alert variant="error" title="Error" message={formError} />
                        )}

                        <div className="flex items-start gap-6">
                            {/* Icon Upload - Left Side */}
                            <div className="flex flex-col items-center gap-2">
                                <div className="h-24 w-24 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800 relative group">
                                    {iconFile ? (
                                        <img src={URL.createObjectURL(iconFile)} alt="Preview" className="h-full w-full object-cover" />
                                    ) : editingProject?.icon ? (
                                        <img src={`http://localhost:5000/uploads/project-icons/${editingProject.icon}`} alt="Current" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-gray-400 text-xs text-center p-2">
                                            No Icon
                                        </div>
                                    )}
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-xs rounded-xl">
                                        Change
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    setIconFile(e.target.files[0]);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                <span className="text-xs text-gray-500">Max 500KB</span>
                            </div>

                            <div className="flex-1 space-y-4">
                                <div>
                                    <Label>Project Name *</Label>
                                    <Input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Enter project name"
                                    />
                                </div>

                                <div className="relative">
                                    <Label>Client *</Label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                                            className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dropdown-toggle"
                                        >
                                            <span className={!formData.client ? "text-gray-400" : ""}>
                                                {formData.client
                                                    ? clients.find((c) => c._id === formData.client)?.name || "Select a client"
                                                    : "Select a client"}
                                            </span>
                                            <svg
                                                className={`h-5 w-5 text-gray-500 transition-transform ${isClientDropdownOpen ? "rotate-180" : ""}`}
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        <Dropdown
                                            isOpen={isClientDropdownOpen}
                                            onClose={() => setIsClientDropdownOpen(false)}
                                            className="left-0 w-full"
                                        >
                                            <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
                                                {clients.map((client) => (
                                                    <DropdownItem
                                                        key={client._id}
                                                        onClick={() => {
                                                            setFormData({ ...formData, client: client._id });
                                                            setIsClientDropdownOpen(false);
                                                        }}
                                                        className={`flex flex-col items-start ${formData.client === client._id ? "bg-gray-100 dark:bg-gray-800" : ""}`}
                                                    >
                                                        <span className="font-medium">{client.name}</span>
                                                        {client.company && (
                                                            <span className="text-xs text-gray-500">{client.company}</span>
                                                        )}
                                                    </DropdownItem>
                                                ))}
                                                {clients.length === 0 && (
                                                    <div className="px-4 py-2 text-sm text-gray-500">No clients found</div>
                                                )}
                                            </div>
                                        </Dropdown>
                                    </div>
                                </div>
                            </div>
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
                            <Label>Assigned Staff</Label>
                            <MultiSelect
                                label=""
                                options={staffList.map(s => ({ value: s._id, text: s.name }))}
                                value={formData.assignedStaff}
                                onChange={(selected) => setFormData({ ...formData, assignedStaff: selected })}
                                placeholder="Select staff..."
                            />
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
