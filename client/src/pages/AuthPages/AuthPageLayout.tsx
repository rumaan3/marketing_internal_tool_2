import { ReactNode } from "react";

interface AuthPageLayoutProps {
    children: ReactNode;
}

export default function AuthPageLayout({ children }: AuthPageLayoutProps) {
    return (
        <div className="relative flex flex-col justify-center w-full min-h-screen p-4 lg:p-8 dark:bg-gray-900">
            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-12">
                {/* Left Side - Branding */}
                <div className="hidden lg:flex lg:flex-col lg:w-1/2 lg:items-center lg:justify-center">
                    <div className="max-w-md text-center">
                        <img
                            src="/images/logo/logo.svg"
                            alt="Logo"
                            className="mx-auto mb-6 dark:hidden"
                            width={180}
                            height={48}
                        />
                        <img
                            src="/images/logo/logo-dark.svg"
                            alt="Logo"
                            className="mx-auto mb-6 hidden dark:block"
                            width={180}
                            height={48}
                        />
                        <h1 className="text-3xl font-semibold text-gray-800 dark:text-white/90 mb-4">
                            Admin Panel
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400">
                            Client & Project Management Dashboard
                        </p>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full rounded-2xl bg-white p-6 shadow-theme-lg dark:bg-gray-800 lg:w-1/2 lg:max-w-md lg:mx-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}
