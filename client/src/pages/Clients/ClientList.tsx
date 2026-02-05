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

interface Client {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    isActive: boolean;
    createdAt: string;
}

interface Pagination {
    total: number;
    page: number;
    pages: number;
    limit: number;
}

export default function ClientList() {
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

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
    });
    const [formError, setFormError] = useState("");
    const [formLoading, setFormLoading] = useState(false);

    // User Modal state
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userFormData, setUserFormData] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [userFormError, setUserFormError] = useState("");
    const [userFormLoading, setUserFormLoading] = useState(false);
    const [selectedClientIdForUser, setSelectedClientIdForUser] = useState<string | null>(null);

    const fetchClients = async (page = 1, limit = 10) => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append("page", page.toString());
            params.append("limit", limit.toString());
            if (search) params.append("search", search);
            if (filterActive) params.append("isActive", filterActive);

            const response = await api.get(`/clients?${params.toString()}`);
            setClients(response.data.clients);
            setPagination(response.data.pagination);
        } catch (error) {
            console.error("Error fetching clients:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients(pagination.page, pagination.limit);
    }, [search, filterActive]);

    const handlePageChange = (newPage: number) => {
        fetchClients(newPage, pagination.limit);
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

    const handleToggleActive = async (clientId: string) => {
        try {
            await api.patch(`/clients/${clientId}/toggle-active`);
            fetchClients(pagination.page, pagination.limit);
        } catch (error) {
            console.error("Error toggling client status:", error);
        }
    };

    const openAddModal = () => {
        setEditingClient(null);
        setFormData({ name: "", email: "", phone: "", company: "" });
        setFormError("");
        setIsModalOpen(true);
    };

    const openEditModal = (client: Client) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            email: client.email,
            phone: client.phone || "",
            company: client.company || "",
        });
        setFormError("");
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError("");

        try {
            if (editingClient) {
                await api.put(`/clients/${editingClient._id}`, formData);
            } else {
                await api.post("/clients", formData);
            }
            setIsModalOpen(false);
            fetchClients(pagination.page, pagination.limit);
        } catch (error: any) {
            setFormError(error.response?.data?.message || "An error occurred");
        } finally {
            setFormLoading(false);
        }
    };

    const openCreateUserModal = (client: Client) => {
        setSelectedClientIdForUser(client._id);
        setUserFormData({ name: client.name, email: client.email, password: "" });
        setUserFormError("");
        setIsUserModalOpen(true);
    };

    const handleUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClientIdForUser) return;

        setUserFormLoading(true);
        setUserFormError("");

        try {
            await api.post("/users", {
                ...userFormData,
                role: "client",
                clientId: selectedClientIdForUser,
            });
            setIsUserModalOpen(false);
            // Optional: show success message
        } catch (error: any) {
            setUserFormError(error.response?.data?.message || "An error occurred");
        } finally {
            setUserFormLoading(false);
        }
    };

    const filterOptions = [
        { value: "", label: "All Status" },
        { value: "true", label: "Active" },
        { value: "false", label: "Inactive" },
    ];

    return (
        <>
            <PageMeta title="Client Management | Admin Panel" description="Manage clients" />

            <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                {/* Header */}
                <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Clients
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
                        {/* Filter */}
                        <Select
                            className="w-48"
                            options={filterOptions}
                            onChange={(value) => setFilterActive(value)}
                            defaultValue={filterActive}
                        />
                        {/* Add Button */}
                        <Button size="sm" onClick={openAddModal}>
                            Add Client
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
                                    Phone
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                    Company
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
                                    <TableCell className="px-5 py-8 text-center text-gray-500" colSpan={6}>
                                        Loading...
                                    </TableCell>
                                </TableRow>
                            ) : clients.length === 0 ? (
                                <TableRow>
                                    <TableCell className="px-5 py-8 text-center text-gray-500" colSpan={6}>
                                        No clients found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                clients.map((client) => (
                                    <TableRow key={client._id}>
                                        <TableCell className="px-5 py-4 text-gray-800 dark:text-white/90">
                                            {client.name}
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                                            {client.email}
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                                            {client.phone || "-"}
                                        </TableCell>
                                        <TableCell className="px-5 py-4 text-gray-500 dark:text-gray-400">
                                            {client.company || "-"}
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <Badge size="sm" color={client.isActive ? "success" : "error"}>
                                                {client.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEditModal(client)}
                                                    className="text-sm text-brand-500 hover:text-brand-600"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(client._id)}
                                                    className={`text-sm ${client.isActive ? "text-red-500 hover:text-red-600" : "text-green-500 hover:text-green-600"}`}
                                                >
                                                    {client.isActive ? "Deactivate" : "Activate"}
                                                </button>
                                            </div>
                                            <div className="mt-2">
                                                <button
                                                    onClick={() => openCreateUserModal(client)}
                                                    className="text-xs text-blue-500 hover:text-blue-600 underline"
                                                >
                                                    Create Login
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
                        Showing {clients.length} of {pagination.total} results
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
                        {editingClient ? "Edit Client" : "Add Client"}
                    </h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {formError && (
                            <Alert variant="error" title="Error" message={formError} />
                        )}
                        <div>
                            <Label>Name *</Label>
                            <Input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter client name"
                            />
                        </div>
                        <div>
                            <Label>Email *</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Enter email"
                            />
                        </div>
                        <div>
                            <Label>Phone</Label>
                            <Input
                                type="text"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Enter phone"
                            />
                        </div>
                        <div>
                            <Label>Company</Label>
                            <Input
                                type="text"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                placeholder="Enter company name"
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
                                {formLoading ? "Saving..." : editingClient ? "Update" : "Create"}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Create User Modal */}
            <Modal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)}>
                <div className="p-6">
                    <h4 className="mb-6 text-lg font-semibold text-gray-800 dark:text-white">
                        Create Client Login
                    </h4>
                    <form onSubmit={handleUserSubmit} className="space-y-4">
                        {userFormError && (
                            <Alert variant="error" title="Error" message={userFormError} />
                        )}
                        <div>
                            <Label>Name *</Label>
                            <Input
                                type="text"
                                value={userFormData.name}
                                onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                                placeholder="Enter user name"
                            />
                        </div>
                        <div>
                            <Label>Email *</Label>
                            <Input
                                type="email"
                                value={userFormData.email}
                                onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                                placeholder="Enter login email"
                            />
                        </div>
                        <div>
                            <Label>Password *</Label>
                            <Input
                                type="password"
                                value={userFormData.password}
                                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                                placeholder="Enter temporary password"
                            />
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsUserModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={userFormLoading}>
                                {userFormLoading ? "Creating..." : "Create Login"}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}
