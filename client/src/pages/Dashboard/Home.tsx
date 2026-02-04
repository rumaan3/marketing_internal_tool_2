import PageMeta from "../../components/common/PageMeta";

export default function Home() {
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
                            Welcome to Admin Panel
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            Upcoming Features
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
