import { Link } from "react-router";
import PageMeta from "../../components/common/PageMeta";

export default function NotFound() {
    return (
        <>
            <PageMeta
                title="404 - Page Not Found | Admin Panel"
                description="Page not found"
            />
            <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900 px-4">
                <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-800">
                    404
                </h1>
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90 mt-4">
                    Page Not Found
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-center">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Link
                    to="/"
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-6 py-3 text-sm text-white hover:bg-brand-600 transition"
                >
                    Back to Home
                </Link>
            </div>
        </>
    );
}
