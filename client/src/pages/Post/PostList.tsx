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

interface Project {
    _id: string;
    name: string;
    client?: {
        _id: string;
        name: string;
    };
}

interface ImageMetadata {
    width?: number;
    height?: number;
    format?: string;
    size?: number;
}

interface Post {
    _id: string;
    platform: string;
    project?: Project;
    client?: { name: string };
    imageUrl: string;
    imageMetadata?: ImageMetadata;
    caption: string;
    isActive: boolean;
    status: string;
    scheduleDate?: string;
    createdAt: string;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

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

const PLATFORMS = [
    { id: "facebook", name: "Facebook", icon: FacebookIcon, color: "#1877F2" },
    { id: "instagram", name: "Instagram", icon: InstagramIcon, color: "#E4405F" },
    { id: "linkedin", name: "LinkedIn", icon: LinkedInIcon, color: "#0A66C2" },
    { id: "blogger", name: "Blogger", icon: BloggerIcon, color: "#FF5722" },
    { id: "medium", name: "Medium", icon: MediumIcon, color: "#000000" },
    { id: "reddit", name: "Reddit", icon: RedditIcon, color: "#FF4500" },
    { id: "pinterest", name: "Pinterest", icon: PinterestIcon, color: "#BD081C" },
    { id: "youtube", name: "YouTube", icon: YoutubeIcon, color: "#FF0000" },
    { id: "tiktok", name: "TikTok", icon: TiktokIcon, color: "#000000" },
    { id: "twitter", name: "Twitter", icon: TwitterIcon, color: "#1DA1F2" },
    { id: "other", name: "Other", icon: null, color: "#6B7280" },
];

export default function PostList() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        total: 0,
        page: 1,
        pages: 1,
        limit: 10,
    });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("");
    const [filterPlatform, setFilterPlatform] = useState<string>("");

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<string>("");

    // Form State
    const [formData, setFormData] = useState({
        project: "",
        caption: "",
        scheduleDate: "",
        status: "draft",
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");

    const [formError, setFormError] = useState("");
    const [formLoading, setFormLoading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchPosts = async (page = 1, limit = 10) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", page.toString());
            params.append("limit", limit.toString());
            if (search) params.append("search", search);
            if (filterStatus) params.append("status", filterStatus);
            if (filterPlatform) params.append("platform", filterPlatform);

            const response = await api.get(`/posts?${params.toString()}`);
            setPosts(response.data.posts);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjects = async () => {
        try {
            // Fetch active projects to select from
            const response = await api.get("/projects?limit=100");
            setProjects(response.data.projects);
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    };

    useEffect(() => {
        fetchPosts(pagination.page, pagination.limit);
    }, [search, filterStatus, filterPlatform]);

    useEffect(() => {
        fetchProjects();
    }, []);

    const handlePageChange = (newPage: number) => {
        fetchPosts(newPage, pagination.limit);
    };

    const handlePlatformClick = (platformId: string) => {
        setSelectedPlatform(platformId);
        setFormData({ project: "", caption: "", scheduleDate: "", status: "draft" });
        setSelectedFile(null);
        setPreviewUrl("");
        setFormError("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsModalOpen(true);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Size validation (< 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            setFormError("File size exceeds 10MB limit.");
            return;
        }

        setFormError("");
        setSelectedFile(file);

        // Create preview
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // Clean up memory when component unmounts or file changes
        return () => URL.revokeObjectURL(objectUrl);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        setFormLoading(true);

        try {
            if (!selectedFile) {
                throw new Error("Image is required");
            }
            if (!formData.project) {
                throw new Error("Project is required");
            }
            if (!formData.caption) {
                throw new Error("Caption is required");
            }

            const data = new FormData();
            data.append("platform", selectedPlatform);
            data.append("project", formData.project);
            data.append("caption", formData.caption);
            data.append("image", selectedFile);
            if (formData.scheduleDate) {
                data.append("scheduleDate", formData.scheduleDate);
            }
            data.append("status", formData.status);

            await api.post("/posts", data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setIsModalOpen(false);
            fetchPosts(1, pagination.limit);
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message || "Failed to create post";
            setFormError(msg);
        } finally {
            setFormLoading(false);
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return "N/A";
        if (bytes < 1024) return bytes + " B";
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
        else return (bytes / 1048576).toFixed(1) + " MB";
    };

    const formatDimensions = (meta?: ImageMetadata) => {
        if (!meta?.width || !meta?.height) return "N/A";
        return `${meta.width}x${meta.height}px`;
    };

    return (
        <>
            <PageMeta
                title="Create Post | Admin Dashboard"
                description="Create and manage social media posts"
            />

            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Create Post
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select a platform to start creating a new post
                </p>
            </div>

            {/* Platform Selection */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
                {PLATFORMS.map((platform) => (
                    <button
                        key={platform.id}
                        onClick={() => handlePlatformClick(platform.id)}
                        className="flex flex-col items-center justify-center rounded-xl border-2 border-gray-200 bg-white p-4 transition-all hover:border-brand-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500"
                    >
                        <div
                            className="mb-2 flex h-12 w-12 items-center justify-center rounded-full overflow-hidden"
                            style={{ backgroundColor: platform.icon ? 'transparent' : platform.color }}
                        >
                            {platform.icon ? (
                                <img
                                    src={platform.icon}
                                    alt={platform.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-white text-lg font-bold">
                                    {platform.name.charAt(0)}
                                </span>
                            )}
                        </div>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {platform.name}
                        </span>
                    </button>
                ))}
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                    <input
                        type="text"
                        placeholder="Search posts..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:text-gray-300"
                    />
                </div>
                <Select
                    className="w-40"
                    options={[
                        { value: "", label: "All Platforms" },
                        ...PLATFORMS.map(p => ({ value: p.id, label: p.name }))
                    ]}
                    onChange={(value) => setFilterPlatform(value)}
                    defaultValue={filterPlatform}
                />
                <Select
                    className="w-40"
                    options={[
                        { value: "", label: "All Status" },
                        { value: "draft", label: "Draft" },
                        { value: "scheduled", label: "Scheduled" },
                        { value: "published", label: "Published" },
                    ]}
                    onChange={(value) => setFilterStatus(value)}
                    defaultValue={filterStatus}
                />
            </div>

            {/* Posts Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                    <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                            <TableRow>
                                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500">Image</TableCell>
                                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500">Info</TableCell>
                                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500">Details</TableCell>
                                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500">Metadata</TableCell>
                                <TableCell isHeader className="px-5 py-3 text-start text-sm font-medium text-gray-500">Status</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="px-5 py-8 text-center text-gray-500">Loading...</TableCell>
                                </TableRow>
                            ) : posts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="px-5 py-8 text-center text-gray-500">No posts found.</TableCell>
                                </TableRow>
                            ) : (
                                posts.map((post) => (
                                    <TableRow key={post._id}>
                                        <TableCell className="px-5 py-4">
                                            <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                                                <img src={post.imageUrl} alt="Post" className="h-full w-full object-cover" />
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-800 dark:text-white capitalize">{post.platform}</span>
                                                <span className="text-xs text-gray-500">{post.project?.name || "No Project"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4 max-w-xs truncate text-gray-600 dark:text-gray-400">
                                            {post.caption}
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <div className="flex flex-col text-xs text-gray-500">
                                                <span>Size: {formatFileSize(post.imageMetadata?.size)}</span>
                                                <span>Dim: {formatDimensions(post.imageMetadata)}</span>
                                                <span>Fmt: {post.imageMetadata?.format || "N/A"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <Badge
                                                size="sm"
                                                color={
                                                    post.status === "published" ? "success" :
                                                        post.status === "scheduled" ? "warning" : "light"
                                                }
                                            >
                                                {post.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            {posts.length > 0 && (
                <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
                    <div className="flex flex-1 justify-between sm:hidden">
                        <Button
                            variant="outline"
                            onClick={() => handlePageChange(pagination.page - 1)}
                            disabled={pagination.page === 1}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handlePageChange(pagination.page + 1)}
                            disabled={pagination.page === pagination.pages}
                        >
                            Next
                        </Button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700 dark:text-gray-400">
                                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                                <span className="font-medium">
                                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                                </span>{" "}
                                of <span className="font-medium">{pagination.total}</span> results
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                            >
                                Previous
                            </Button>
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
                </div>
            )}

            {/* Create Post Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-lg w-full rounded-2xl p-0 overflow-hidden">
                <div className="p-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
                        Create {PLATFORMS.find(p => p.id === selectedPlatform)?.name} Post
                    </h3>

                    {formError && <Alert variant="error" title="Error" message={formError} />}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Project Selection */}
                        <div>
                            <Label>Project *</Label>
                            <Select
                                placeholder="Select Project"
                                options={[
                                    { value: "", label: "Select Project" },
                                    ...projects.map(p => ({ value: p._id, label: p.name }))
                                ]}
                                onChange={(value) => setFormData({ ...formData, project: value })}
                                defaultValue={formData.project}
                            />
                        </div>

                        {/* Image Upload */}
                        <div>
                            <Label>Image (Raw Upload, Max 10MB) *</Label>
                            <div className="mt-1">
                                {previewUrl ? (
                                    <div className="relative h-48 w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                                        <img src={previewUrl} alt="Preview" className="h-full w-full object-contain" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedFile(null);
                                                setPreviewUrl("");
                                                if (fileInputRef.current) fileInputRef.current.value = "";
                                            }}
                                            className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                                        >
                                            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                        {/* Show local file meta immediately */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-xs text-white">
                                            Size: {formatFileSize(selectedFile?.size)}
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-8 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
                                    >
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                            Click to upload image
                                        </p>
                                        <p className="mt-1 text-xs text-gray-400">
                                            Max 10MB. No compression applied.
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

                        {/* Caption */}
                        <div>
                            <Label>Caption *</Label>
                            <textarea
                                rows={3}
                                placeholder="Write your post caption..."
                                value={formData.caption}
                                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:text-gray-300"
                            />
                        </div>

                        {/* Schedule Date */}
                        <div>
                            <Label>Schedule Date (Optional)</Label>
                            <input
                                type="datetime-local"
                                value={formData.scheduleDate}
                                onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                                className="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:text-gray-300"
                            />
                        </div>

                        {/* Status */}
                        <div>
                            <Label>Status</Label>
                            <Select
                                options={[
                                    { value: "draft", label: "Draft" },
                                    { value: "scheduled", label: "Scheduled" },
                                    { value: "published", label: "Published" },
                                ]}
                                onChange={(value) => setFormData({ ...formData, status: value })}
                                defaultValue={formData.status}
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={formLoading}>
                                {formLoading ? "Creating..." : "Create Post"}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}
