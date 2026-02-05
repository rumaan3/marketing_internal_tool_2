import Badge from "../ui/badge/Badge";

interface Project {
    _id: string;
    name: string;
    description?: string;
    client: {
        _id: string;
        name: string;
        company?: string;
    };
    status: "planning" | "in-progress" | "completed" | "on-hold";
    isActive: boolean;
    createdAt: string;
    icon?: string;
    assignedStaff?: {
        _id: string;
        name: string;
        email: string;
    }[];
}

interface ProjectCardProps {
    project: Project;
    onEdit?: (project: Project) => void;
    onToggleActive?: (id: string) => void;
    isReadOnly?: boolean;
}

export const ProjectCard = ({ project, onEdit, onToggleActive, isReadOnly = false }: ProjectCardProps) => {

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "success";
            case "in-progress": return "primary";
            case "on-hold": return "warning";
            default: return "light";
        }
    };

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900/50 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                        {project.icon ? (
                            <img
                                src={`http://localhost:5000/uploads/project-icons/${project.icon}`}
                                alt={project.name}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500 font-bold text-xl">
                                {project.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white/90">
                            {project.name}
                        </h3>
                        {project.client && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {project.client.name} {project.client.company && `• ${project.client.company}`}
                            </p>
                        )}
                    </div>
                </div>
                {!isReadOnly && (
                    <div className="relative group">
                        <button className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                        </button>
                        {/* simple dropdown for actions */}
                        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block z-10 dark:bg-gray-800 dark:ring-gray-700">
                            <div className="py-1">
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit(project)}
                                        className="flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        <span className="mr-2">✏️</span> Edit
                                    </button>
                                )}
                                {onToggleActive && (
                                    <button
                                        onClick={() => onToggleActive(project._id)}
                                        className={`flex w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${project.isActive ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}
                                    >
                                        <span className="mr-2">{project.isActive ? "🚫" : "✅"}</span>
                                        {project.isActive ? "Deactivate" : "Activate"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 min-h-[40px]">
                    {project.description || "No description provided."}
                </p>
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-800">
                <div className="flex -space-x-2 overflow-hidden">
                    {project.assignedStaff && project.assignedStaff.length > 0 ? (
                        <>
                            {project.assignedStaff.slice(0, 3).map((staff) => (
                                <div key={staff._id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-900 bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600" title={staff.name}>
                                    {staff.name.charAt(0)}
                                </div>
                            ))}
                            {project.assignedStaff.length > 3 && (
                                <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-900 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                                    +{project.assignedStaff.length - 3}
                                </div>
                            )}
                        </>
                    ) : (
                        <span className="text-xs text-gray-400 italic">No staff assigned</span>
                    )}
                </div>
                <div className="flex gap-2">
                    <Badge size="sm" color={getStatusColor(project.status)}>
                        {project.status.replace("-", " ")}
                    </Badge>
                </div>
            </div>
        </div>
    );
};
