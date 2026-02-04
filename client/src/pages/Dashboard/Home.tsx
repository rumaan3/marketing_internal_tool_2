import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";

export default function Home() {
    const { user } = useAuth();

    return (
        <>
            <PageMeta
                title="Dashboard | Admin Panel"
                description="Admin Panel Dashboard"
            />

            <div className="rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mb-4">
                            Welcome, {user?.name || "User"}!
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg mb-6">
                            Admin Panel Dashboard
                        </p>
                        <div className="text-gray-400 dark:text-gray-500 text-sm">
                            Use the sidebar to navigate to Staff, Clients, or Projects
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
