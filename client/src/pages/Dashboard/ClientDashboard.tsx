import { useEffect, useState } from "react";
import api from "../../api/axios";
import PageMeta from "../../components/common/PageMeta";
import { ProjectCard } from "../../components/project/ProjectCard";
import { CalendarCard } from "../../components/calendar/CalendarCard";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import Alert from "../../components/ui/alert/Alert";

interface Project {
    _id: string;
    name: string;
    description: string;
    client: {
        _id: string;
        name: string;
        company: string;
        email: string;
    };
    status: "planning" | "in-progress" | "completed" | "on-hold";
    startDate: string;
    endDate: string;
    icon?: string;
    isActive: boolean;
    assignedStaff: {
        _id: string;
        name: string;
        email: string;
        role: string;
    }[];
    createdAt: string;
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
        company: string;
    };
    platform: string;
    socialMediaEntry?: {
        platform: string;
        imageUrl?: string;
    };
    isActive: boolean;
    createdAt: string;
}

export default function ClientDashboard() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [clientData, setClientData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Credential Modal State
    const [isCredModalOpen, setIsCredModalOpen] = useState(false);
    const [credForm, setCredForm] = useState({ platform: "", password: "" });
    const [credLoading, setCredLoading] = useState(false);
    const [credentialError, setCredentialError] = useState("");
    const [credentialSuccess, setCredentialSuccess] = useState("");

    const openCredModal = () => {
        setCredForm({ platform: "", password: "" });
        setCredentialError("");
        setCredentialSuccess("");
        setIsCredModalOpen(true);
    };

    const handleCredSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!credForm.platform || !credForm.password) {
            setCredentialError("Please fill in all fields");
            return;
        }

        setCredLoading(true);
        setCredentialError("");

        try {
            await api.post("/clients/credentials", {
                credentials: [credForm],
            });
            setCredentialSuccess(`Credential for ${credForm.platform} saved successfully.`);
            setIsCredModalOpen(false);
            // Refresh client data to show new credential in list
            refreshClientData();
        } catch (error: any) {
            setCredentialError(error.response?.data?.message || "Failed to save credential");
        } finally {
            setCredLoading(false);
        }
    };

    const refreshClientData = async () => {
        if (!user || user.role !== 'client') return;
        // user object in AuthContext needs to contain clientId
        // Casting user as any if clientId is missing from interface for now (checked next step)
        const clientId = (user as any).clientId;
        if (!clientId) return;

        try {
            const res = await api.get(`/clients/${clientId}`);
            setClientData(res.data.client);
        } catch (error) {
            console.error("Error fetching client details:", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // The backend automatically filters by clientId for "client" role
                const [projectsRes, calendarsRes] = await Promise.all([
                    api.get("/projects?limit=100&isActive=true"),
                    api.get("/calendars?limit=100&isActive=true"),
                ]);
                setProjects(projectsRes.data.projects);
                setCalendars(calendarsRes.data.calendars);

                await refreshClientData();
            } catch (error) {
                console.error("Error fetching client data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchData();
        }
    }, [user]);

    return (
        <>
            <PageMeta
                title="Client Dashboard | Marketing Tool"
                description="View your projects and content calendars"
            />

            <div className="space-y-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                        Welcome, {user?.name}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Overview of your projects and calendars.
                    </p>
                </div>

                <section>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Your Projects
                    </h3>
                    {loading ? (
                        <div className="py-8 text-center text-gray-500">Loading projects...</div>
                    ) : projects.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">No projects found.</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {projects.map((project) => (
                                <ProjectCard
                                    key={project._id}
                                    project={project}
                                    isReadOnly={true}
                                />
                            ))}
                        </div>
                    )}
                </section>

                <section>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Content Calendars
                    </h3>
                    {loading ? (
                        <div className="py-8 text-center text-gray-500">Loading calendars...</div>
                    ) : calendars.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">No calendars found.</div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {calendars.map((calendar) => (
                                <CalendarCard
                                    key={calendar._id}
                                    calendar={calendar}
                                    isReadOnly={true}
                                />
                            ))}
                        </div>
                    )}
                </section>
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                            Platform Credentials
                        </h3>
                        <Button size="sm" onClick={openCredModal}>
                            Add Credential
                        </Button>
                    </div>

                    {credentialSuccess && (
                        <div className="mb-4">
                            <Alert variant="success" title="Success" message={credentialSuccess} />
                        </div>
                    )}

                    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                        {clientData?.credentials && clientData.credentials.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {clientData.credentials.map((cred: any, index: number) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                                    >
                                        <div className="font-medium text-gray-800 dark:text-white">
                                            {cred.platform}
                                        </div>
                                        <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded dark:bg-green-900/30 dark:text-green-400">
                                            Connected
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                No credentials linked yet. Click "Add Credential" to link your platforms.
                            </p>
                        )}
                    </div>
                </section>
            </div>

            <Modal isOpen={isCredModalOpen} onClose={() => setIsCredModalOpen(false)} className="max-w-md">
                <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
                        Add Platform Credential
                    </h3>
                    <form onSubmit={handleCredSubmit} className="space-y-4">
                        {credentialError && <Alert variant="error" title="Error" message={credentialError} />}

                        <div>
                            <Label>Platform Name</Label>
                            <Input
                                type="text"
                                placeholder="e.g. Facebook, Instagram, LinkedIn"
                                value={credForm.platform}
                                onChange={(e) => setCredForm({ ...credForm, platform: e.target.value })}
                                disabled={credLoading}
                            />
                        </div>

                        <div>
                            <Label>Password / API Key</Label>
                            <Input
                                type="password"
                                placeholder="Enter password or token"
                                value={credForm.password}
                                onChange={(e) => setCredForm({ ...credForm, password: e.target.value })}
                                disabled={credLoading}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Your credentials are encrypted safely.
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setIsCredModalOpen(false)}
                                disabled={credLoading}
                                type="button"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={credLoading}>
                                {credLoading ? "Saving..." : "Save Credential"}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>
        </>
    );
}
