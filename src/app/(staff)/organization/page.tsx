"use client";

import { useState, useEffect } from "react";
import { User as UserIcon, ZoomIn, ZoomOut, ChevronRight, ChevronDown, Network, Search, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type UserNode = {
    id: string;
    name: string;
    role: string;
    profilePicture?: string;
    managerId: string | null;
    children?: UserNode[];
};

export default function StaffOrgChartPage() {
    const [users, setUsers] = useState<UserNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetch("/api/organization")
            .then(r => r.json())
            .then(data => {
                const hierarchy = buildHierarchy(data);
                setUsers(hierarchy);
            })
            .finally(() => setLoading(false));
    }, []);

    const buildHierarchy = (flatUsers: UserNode[]) => {
        const userMap = new Map<string, UserNode>();
        // Clone to avoid mutating original if needed, and init children
        flatUsers.forEach(u => userMap.set(u.id, { ...u, children: [] }));

        const roots: UserNode[] = [];
        const orphanNodes: UserNode[] = []; // Nodes that have a manager which is not in the list (shouldn't happen often but specific to data consistency)

        flatUsers.forEach(u => {
            const node = userMap.get(u.id)!;
            if (u.managerId && userMap.has(u.managerId)) {
                userMap.get(u.managerId)!.children!.push(node);
            } else {
                roots.push(node);
            }
        });

        return roots;
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-30 shadow-sm/50">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Network className="h-6 w-6 text-indigo-600" />
                            Organizasyon Şeması
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Şirket hiyerarşisi ve raporlama yapısı</p>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-slate-400 text-sm">Organizasyon yapısı yükleniyor...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {users.map((root, idx) => (
                            <OrgNode key={root.id} node={root} isRoot={true} />
                        ))}

                        {users.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                                <Network className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">Görüntülenecek veri bulunamadı.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function OrgNode({ node, isRoot = false }: { node: UserNode, isRoot?: boolean }) {
    const [isOpen, setIsOpen] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    // Dynamic role translation
    const roleName = node.role === 'ADMIN' ? 'Yönetici' : node.role === 'EXECUTIVE' ? 'Üst Yönetici' : 'Personel';
    const isManager = node.role === 'ADMIN' || node.role === 'EXECUTIVE' || hasChildren;

    return (
        <div className="relative">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                    "relative z-10 transition-all duration-200 bg-white border rounded-2xl p-4 flex items-center gap-4 group",
                    isRoot ? "border-indigo-100 shadow-md ring-1 ring-indigo-50" : "border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow-md"
                )}
            >
                {/* Profile Picture */}
                <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold overflow-hidden border-2 shrink-0 shadow-sm",
                    isManager ? "border-indigo-100 bg-indigo-50 text-indigo-600" : "border-slate-100 bg-slate-50 text-slate-500"
                )}>
                    {node.profilePicture ? (
                        <img src={node.profilePicture} alt={node.name} className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon className="h-6 w-6" />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className={cn("font-bold text-slate-900 truncate", isRoot ? "text-lg" : "text-base")}>
                        {node.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
                            node.role === 'ADMIN' ? "bg-purple-100 text-purple-700" :
                                node.role === 'EXECUTIVE' ? "bg-amber-100 text-amber-700" :
                                    "bg-slate-100 text-slate-600"
                        )}>
                            {roleName}
                        </span>
                        {hasChildren && (
                            <span className="text-[10px] text-slate-400 font-medium">
                                • {node.children!.length} Raporlayan
                            </span>
                        )}
                    </div>
                </div>

                {/* Toggle Button */}
                {hasChildren && (
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-colors"
                    >
                        {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </button>
                )}
            </motion.div>

            {/* Connecting Lines for Tree Structure */}
            <AnimatePresence>
                {isOpen && hasChildren && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="relative ml-6 pl-8 pt-6 space-y-6 overflow-hidden"
                    >
                        {/* Vertical Line */}
                        <div className="absolute left-[23px] top-0 bottom-6 w-px bg-slate-200"></div>

                        {node.children!.map((child, index) => (
                            <div key={child.id} className="relative">
                                {/* Horizontal Connector */}
                                <div className="absolute -left-8 top-[28px] w-8 h-px bg-slate-200"></div>
                                <OrgNode node={child} />
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
