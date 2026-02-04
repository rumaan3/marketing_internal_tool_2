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
import Alert from "../../components/ui/alert/Alert";
import PageMeta from "../../components/common/PageMeta";

interface User {
    _id: string;
    name: string;
    email: string;
    role: "admin" | "staff";
    isActive: boolean;
    createdAt: string;
}

interface Pagination {
    total: number;
    page: number;
    pages: number;
    limit: number;
}

export default function StaffList() {
    const [users, setUsers] = useState<User[]>([]);
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
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "staff" as "admin" | "staff",
    });
    const [formError, setFormError] = useState("");
    const [formLoading, setFormLoading] = useState(false);

    const fetchUsers = async (page = 1, limit = 10) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", page.toString());
            params.append("limit", limit.toString());
            if (search) params.append("search", search);
            if (filterActive) params.append("isActive", filterActive);

            const response = await api.get(`/users?${params.toString()}`);
            setUsers(response.data.users);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(pagination.page, pagination.limit);
    }, [search, filterActive]);

    const handlePageChange = (newPage: number) => {
        fetchUsers(newPage, pagination.limit);
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

    const handleToggleActive = async (userId: string) => {
        try {
            await api.patch(`/users/${userId}/toggle-active`);
            fetchUsers(pagination.page, pagination.limit);
        } catch (error) {
            console.error("Error toggling user status:", error);
        }
    };

    const openAddModal = () => {
        setEditingUser(null);
        setFormData({ name: "", email: "", password: "", role: "staff" });
        setFormError("");
        setIsModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: "",
            role: user.role,
        });
        setFormError("");
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError("");

        try {
            if (editingUser) {
                await api.put(`/users/${editingUser._id}`, {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                });
            } else {
                await api.post("/users", formData);
            }
            setIsModalOpen(false);
            fetchUsers(pagination.page, pagination.limit);
        } catch (error: any) {
            setFormError(error.response?.data?.message || "An error occurred");
        } finally {
            setFormLoading(false);
        }
    };

    const roleOptions = [
        { value: "staff", label: "Staff" },
        { value: "admin", label: "Admin" },
    ];

    const filterOptions = [
        { value: "", label: "All Status" },
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
    ];

    return (
        <>
            <PageMeta title="Staff Management | Admin Panel" description="Manage staff members" />

            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                {/* Header */}
                <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Staff Members
                    </h3>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 dark:border-gray-700 dark:text-white sm:w-48"
                            />
                        </div>
                        {/* Filter */}
                        <Select
                            className="w-48"
                            options={filterOptions}
                            onChange={(value) => setFilterActive(value)}
                            defaultValue={filterActive}
                        />
                        {/* Add Button */}
                        <Button size="sm" onClick={openAddModal}>
                            Add Staff
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="max-w-full overflow-x-auto">
                    <Table>
                        <TableHeader className="border-y border-gray-100 dark:border-gray-800">
                            <TableRow>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    Name
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    Email
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    Role
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    Status
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
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell className="px-5 py-8 text-center text-gray-500" colSpan={5}>
                                        No staff members found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user._id}>
                                        <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                                            {user.name}
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                                            {user.email}
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400 capitalize">
                                            {user.role}
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <Badge size="sm" color={user.isActive ? "success" : "error"}>
                                                {user.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="text-sm text-brand-500 hover:text-brand-600"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(user._id)}
                                                    className={`text-sm ${user.isActive ? "text-red-500 hover:text-red-600" : "text-green-500 hover:text-green-600"}`}
                                                >
                                                    {user.isActive ? "Deactivate" : "Activate"}
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
                        Showing {users.length} of {pagination.total} results
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Go to page:</span>
                            <input
                                type="number"
                                min={1}
                                max={pagination.pages}
                                placeholder="#"
                                className="w-16 rounded-lg border border-gray-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:text-gray-300"
                                onKeyDown={handleJumpToPage}
                            />
                        </div>
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
                        {editingUser ? "Edit Staff Member" : "Add Staff Member"}
                    </h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {formError && (
                            <Alert variant="error" title="Error" message={formError} />
                        )}
                        <div>
                            <Label>Name</Label>
                            <Input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter name"
                            />
                        </div>
                        <div>
                            <Label>Email</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Enter email"
                            />
                        </div>
                        {!editingUser && (
                            <div>
                                <Label>Password</Label>
                                <Input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Enter password"
                                />
                            </div>
                        )}
                        <div>
                            <Label>Role</Label>
                            <Select
                                options={roleOptions}
                                defaultValue={formData.role}
                                onChange={(value) => setFormData({ ...formData, role: value as "admin" | "staff" })}
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
                                {formLoading ? "Saving..." : editingUser ? "Update" : "Create"}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}
