import { useState, useEffect, useRef } from "react";
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
import Label from "../../components/form/Label";
import Select from "../../components/form/Select";
import Alert from "../../components/ui/alert/Alert";
import PageMeta from "../../components/common/PageMeta";

interface Client {
    _id: string;
    name: string;
    company?: string;
}

interface SocialMediaEntry {
    _id: string;
    platform: string;
    client?: Client;
    imageUrl: string;
    description: string;
    isActive: boolean;
    createdAt: string;
}

interface Pagination {
    total: number;
    page: number;
    pages: number;
    limit: number;
}

const PLATFORMS = [
    { id: "facebook", name: "Facebook", color: "#1877F2" },
    { id: "instagram", name: "Instagram", color: "#E4405F" },
    { id: "linkedin", name: "LinkedIn", color: "#0A66C2" },
    { id: "blogger", name: "Blogger", color: "#FF5722" },
    { id: "medium", name: "Medium", color: "#000000" },
    { id: "reddit", name: "Reddit", color: "#FF4500" },
    { id: "pinterest", name: "Pinterest", color: "#BD081C" },
    { id: "other", name: "Add More", color: "#6B7280" },
];

export default function SocialMediaList() {
    const [entries, setEntries] = useState<SocialMediaEntry[]>([]);
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
    const [filterPlatform, setFilterPlatform] = useState<string>("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<string>("");
    const [formData, setFormData] = useState({
        client: "",
        imageUrl: "",
        description: "",
    });
    const [formError, setFormError] = useState("");
    const [formLoading, setFormLoading] = useState(false);

    // File Upload State
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchEntries = async (page = 1, limit = 10) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", page.toString());
            params.append("limit", limit.toString());
            if (search) params.append("search", search);
            if (filterActive) params.append("isActive", filterActive);
            if (filterPlatform) params.append("platform", filterPlatform);

            const response = await api.get(`/social-media?${params.toString()}`);
            setEntries(response.data.entries);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error("Error fetching entries:", error);
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
        fetchEntries(pagination.page, pagination.limit);
    }, [search, filterActive, filterPlatform]);

    useEffect(() => {
        fetchClients();
    }, []);

    const handlePageChange = (newPage: number) => {
        fetchEntries(newPage, pagination.limit);
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

    const handlePlatformClick = (platformId: string) => {
        setSelectedPlatform(platformId);
        setFormData({ client: "", imageUrl: "", description: "" });
        setFormError("");
        if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        setIsModalOpen(true);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Size validation (< 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            setFormError("File size exceeds 10MB limit.");
            return;
        }

        setFormError("");
        setIsUploading(true);

        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await api.post("/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setFormData(prev => ({ ...prev, imageUrl: response.data.imageUrl }));
        } catch (error: any) {
            console.error("Upload error:", error);
            setFormError(error.response?.data?.message || "Failed to upload image");
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        setFormLoading(true);

        try {
            if (!formData.imageUrl) {
                throw new Error("Image is required");
            }
            if (!formData.description) {
                throw new Error("Description is required");
            }

            await api.post("/social-media", {
                platform: selectedPlatform,
                client: formData.client || undefined,
                imageUrl: formData.imageUrl,
                description: formData.description,
            });

            setIsModalOpen(false);
            fetchEntries(1, pagination.limit);
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            setFormError(err.response?.data?.message || err.message || "Failed to create entry");
        } finally {
            setFormLoading(false);
        }
    };

    const handleToggleActive = async (entryId: string) => {
        try {
            await api.patch(`/social-media/${entryId}/toggle-active`);
            fetchEntries(pagination.page, pagination.limit);
        } catch (error) {
            console.error("Error toggling entry:", error);
        }
    };

    const filterOptions = [
        { value: "", label: "All Status" },
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
    ];

    const platformOptions = [
        { value: "", label: "All Platforms" },
        ...PLATFORMS.filter(p => p.id !== "other").map(p => ({ value: p.id, label: p.name })),
    ];

    return (
        <>
            <PageMeta
                title="Social Media | Admin Dashboard"
                description="Manage social media content entries"
            />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        Social Media
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Create and manage social media content
                    </p>
                </div>
            </div>

            {/* Platform Selection Cards */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
                {PLATFORMS.map((platform) => (
                    <button
                        key={platform.id}
                        onClick={() => handlePlatformClick(platform.id)}
                        className="flex flex-col items-center justify-center rounded-xl border-2 border-gray-200 bg-white p-4 transition-all hover:border-brand-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500"
                    >
                        <div
                            className="mb-2 flex h-12 w-12 items-center justify-center rounded-full text-white text-lg font-bold"
                            style={{ backgroundColor: platform.color }}
                        >
                            {platform.name.charAt(0)}
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {platform.name}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search and Filters */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="Search entries..."
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
                <Select
                    className="w-48"
                    options={platformOptions}
                    onChange={(value) => setFilterPlatform(value)}
                    defaultValue={filterPlatform}
                />
            </div>

            {/* Entries Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                    <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                            <TableRow>
                                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">Platform</TableCell>
                                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">Description</TableCell>
                                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500 dark:text-gray-400">Client</TableCell>
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
                            ) : entries.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="px-5 py-8 text-center text-gray-500">
                                        No entries found. Click a platform above to create one.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                entries.map((entry) => (
                                    <TableRow key={entry._id}>
                                        <TableCell className="px-5 py-4">
                                            <Badge
                                                size="sm"
                                                color={entry.isActive ? "primary" : "light"}
                                            >
                                                {entry.platform}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-5 py-4 max-w-xs truncate text-gray-800 dark:text-gray-200">
                                            {entry.description}
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400">
                                            {entry.client?.name || "—"}
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <Badge
                                                size="sm"
                                                color={entry.isActive ? "success" : "error"}
                                            >
                                                {entry.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <button
                                                onClick={() => handleToggleActive(entry._id)}
                                                className="text-sm text-brand-500 hover:text-brand-600"
                                            >
                                                {entry.isActive ? "Deactivate" : "Activate"}
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination and other UI elements omitted for brevity if unchanged... */}
            {/* Pagination code is preserved from previous read */}
            {pagination.pages > 1 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Showing {entries.length} of {pagination.total} entries
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


            {/* Create Entry Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-md w-full rounded-2xl p-0 overflow-hidden">
                <div className="p-6">
                    <h3 className="mb-4 text-lg font-semibold text-center text-gray-800 dark:text-white">
                        Create {PLATFORMS.find(p => p.id === selectedPlatform)?.name} Post
                    </h3>

                    {formError && (
                        <Alert variant="error" title="Error" message={formError} />
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Client (Optional)</Label>
                            <Select
                                placeholder="Select Client"
                                options={[
                                    { value: "", label: "No Client" },
                                    ...clients.map(c => ({ value: c._id, label: c.name }))
                                ]}
                                onChange={(value) => setFormData({ ...formData, client: value })}
                                defaultValue={formData.client}
                            />
                        </div>

                        <div>
                            <Label>Image Upload (Max 10MB)</Label>
                            <div className="mt-1 flex flex-col gap-3">
                                {formData.imageUrl ? (
                                    <div className="relative h-32 w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                                        <img
                                            src={formData.imageUrl}
                                            alt="Preview"
                                            className="h-full w-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, imageUrl: "" }));
                                                if (fileInputRef.current) fileInputRef.current.value = "";
                                            }}
                                            className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                                        >
                                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/50"
                                    >
                                        <div className="mb-2 rounded-full bg-gray-100 p-2 dark:bg-gray-700">
                                            <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                            {isUploading ? "Uploading..." : "Click to upload image"}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-400">
                                            SVG, PNG, JPG or GIF (max. 10MB)
                                        </p>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Description *</Label>
                            <textarea
                                rows={3}
                                placeholder="Enter description for this post..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:text-gray-300"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={formLoading || isUploading || !formData.imageUrl}>
                                {formLoading ? "Creating..." : "Create Entry"}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}
