import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
            <div className="bg-slate-50 p-4 rounded-full mb-4">
                <Icon className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
            <p className="text-slate-500 text-sm max-w-sm mb-6">{description}</p>
            {action}
        </div>
    );
}
