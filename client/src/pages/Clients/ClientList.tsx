import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

export default function ClientList() {
    return (
        <>
            <PageMeta
                title="Client Management | Admin Panel"
                description="Manage clients"
            />
            <PageBreadcrumb pageTitle="Clients" />
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
                        Clients
                    </h2>
                    <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm text-white hover:bg-brand-600 transition">
                        Add Client
                    </button>
                </div>
                <p className="text-gray-500 dark:text-gray-400">
                    Client management features coming soon...
                </p>
            </div>
        </>
    );
}
