"use client";

import Link from "next/link";
import {
    Briefcase,
    Calendar,
    FileText,
    GraduationCap,
    MessageCircle,
    CreditCard,
    Plane,
    Users
} from "lucide-react";

export default function DashboardQuickActions() {
    const actions = [
        { label: "İzin Talebi", icon: Plane, href: "/leave", color: "bg-blue-50 text-blue-600", border: "border-blue-100" },
        { label: "Bordro", icon: FileText, href: "/payroll", color: "bg-emerald-50 text-emerald-600", border: "border-emerald-100" },
        { label: "Eğitimler", icon: GraduationCap, href: "/lms", color: "bg-indigo-50 text-indigo-600", border: "border-indigo-100" },
        { label: "Avans", icon: CreditCard, href: "/payroll/advance", color: "bg-violet-50 text-violet-600", border: "border-violet-100" },
        { label: "Sosyal Duvar", icon: Users, href: "/social", color: "bg-pink-50 text-pink-600", border: "border-pink-100" },
        { label: "Vardiyam", icon: Calendar, href: "/shifts", color: "bg-orange-50 text-orange-600", border: "border-orange-100" },
    ];

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h2 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-slate-400" />
                Hızlı İşlemler
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {actions.map((action, i) => (
                    <Link
                        key={i}
                        href={action.href}
                        className={`
                            flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-300
                            hover:shadow-lg hover:-translate-y-1 active:scale-95
                            ${action.color} ${action.border} bg-white
                        `}
                    >
                        <div className={`p-3 rounded-xl ${action.color} bg-opacity-20`}>
                            <action.icon className="h-6 w-6" />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{action.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
