import { useState, useEffect } from "react";
import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

interface DashboardStats {
    totalStaff: number;
    activeStaff: number;
    totalClients: number;
    activeClients: number;
    totalProjects: number;
    activeProjects: number;
}

export default function Home() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalStaff: 0,
        activeStaff: 0,
        totalClients: 0,
        activeClients: 0,
        totalProjects: 0,
        activeProjects: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [staffRes, clientsRes, projectsRes] = await Promise.all([
                    api.get("/users?limit=1"),
                    api.get("/clients?limit=1"),
                    api.get("/projects?limit=1"),
                ]);

                setStats({
                    totalStaff: staffRes.data.pagination?.total || 0,
                    activeStaff: staffRes.data.pagination?.total || 0,
                    totalClients: clientsRes.data.pagination?.total || 0,
                    activeClients: clientsRes.data.pagination?.total || 0,
                    totalProjects: projectsRes.data.pagination?.total || 0,
                    activeProjects: projectsRes.data.pagination?.total || 0,
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        {
            title: "Total Staff",
            value: stats.totalStaff,
            color: "bg-brand-500",
            link: "/staff",
        },
        {
            title: "Total Clients",
            value: stats.totalClients,
            color: "bg-success-500",
            link: "/clients",
        },
        {
            title: "Total Projects",
            value: stats.totalProjects,
            color: "bg-warning-500",
            link: "/projects",
        },
    ];

    return (
        <>
            <PageMeta
                title="Dashboard | Admin Panel"
                description="Admin Panel Dashboard"
            />

            {/* Welcome Section */}
            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Welcome back, {user?.name || "Admin"}!
                </h1>
                <p className="mt-1 text-gray-500 dark:text-gray-400">
                    Here's an overview of your admin panel
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
                {statCards.map((card) => (
                    <Link
                        key={card.title}
                        to={card.link}
                        className="rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {card.title}
                                </p>
                                <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white">
                                    {loading ? "..." : card.value}
                                </p>
                            </div>
                            <div className={`${card.color} rounded-full p-3`}>
                                <svg
                                    className="h-6 w-6 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Link
                        to="/staff"
                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-all hover:border-brand-500 hover:bg-brand-50 dark:border-gray-700 dark:hover:border-brand-500 dark:hover:bg-brand-900/20"
                    >
                        <div className="rounded-lg bg-brand-100 p-2 dark:bg-brand-900/30">
                            <svg className="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                            </svg>
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                            Manage Staff
                        </span>
                    </Link>
                    <Link
                        to="/clients"
                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-all hover:border-success-500 hover:bg-success-50 dark:border-gray-700 dark:hover:border-success-500 dark:hover:bg-success-900/20"
                    >
                        <div className="rounded-lg bg-success-100 p-2 dark:bg-success-900/30">
                            <svg className="h-5 w-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                            Manage Clients
                        </span>
                    </Link>
                    <Link
                        to="/projects"
                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-all hover:border-warning-500 hover:bg-warning-50 dark:border-gray-700 dark:hover:border-warning-500 dark:hover:bg-warning-900/20"
                    >
                        <div className="rounded-lg bg-warning-100 p-2 dark:bg-warning-900/30">
                            <svg className="h-5 w-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                            Manage Projects
                        </span>
                    </Link>
                </div>
            </div>

            {/* Upcoming Features */}
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                    Upcoming Features
                </h2>
                <ul className="space-y-2 text-gray-500 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        Project timeline visualization
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        Activity logs and audit trail
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        Email notifications
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                        Export to PDF/Excel
                    </li>
                </ul>
            </div>
        </>
    );
}
