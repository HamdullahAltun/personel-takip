"use client";

import { useState } from "react";
import { User as UserIcon, ChevronRight, ChevronDown } from "lucide-react";

interface UserNode {
    id: string;
    name: string;
    role: string;
    profilePicture?: string;
    title?: string;
    managerId?: string | null;
    children?: UserNode[];
}

export default function OrgChartTree({ users }: { users: any[] }) {
    // Build the tree
    const rootNodes: UserNode[] = [];
    const userMap = new Map<string, UserNode>();

    // 1. Initialize map
    users.forEach(u => {
        userMap.set(u.id, { ...u, children: [] });
    });

    // 2. Connect parent/child
    users.forEach(u => {
        const node = userMap.get(u.id)!;
        if (u.managerId && userMap.has(u.managerId)) {
            userMap.get(u.managerId)!.children!.push(node);
        } else {
            rootNodes.push(node);
        }
    });

    // Sort by role/name
    const sortNodes = (nodes: UserNode[]) => {
        nodes.sort((a, b) => {
            const roleScore = (r: string) => r === 'EXECUTIVE' ? 3 : r === 'ADMIN' ? 2 : 1;
            return roleScore(b.role) - roleScore(a.role) || a.name.localeCompare(b.name);
        });
        nodes.forEach(n => {
            if (n.children) sortNodes(n.children);
        });
    };
    sortNodes(rootNodes);

    return (
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 overflow-x-auto">
            <div className="min-w-[600px]">
                {rootNodes.map(node => (
                    <OrgNode key={node.id} node={node} level={0} />
                ))}
                {rootNodes.length === 0 && <p className="text-slate-500 italic">Kullanıcı bulunamadı.</p>}
            </div>
        </div>
    );
}

function OrgNode({ node, level }: { node: UserNode, level: number }) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="mb-2">
            <div
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${level === 0 ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' :
                        level === 1 ? 'bg-white border-indigo-100 shadow-sm ml-8' :
                            'bg-slate-50 border-slate-200 ml-16'
                    }`}
                style={{ marginLeft: `${level * 2}rem` }}
            >
                {hasChildren && (
                    <button onClick={() => setExpanded(!expanded)} className="hover:bg-black/10 rounded p-0.5">
                        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                )}
                {!hasChildren && <div className="w-5" />}

                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0 border border-white/30">
                    {node.profilePicture ? (
                        <img src={node.profilePicture} alt={node.name} className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon className="w-5 h-5 opacity-70" />
                    )}
                </div>

                <div>
                    <div className="font-bold text-sm">{node.name}</div>
                    <div className={`text-xs ${level === 0 ? 'text-indigo-200' : 'text-slate-500'}`}>
                        {node.role} {node.title ? `• ${node.title}` : ''}
                    </div>
                </div>
            </div>

            {expanded && hasChildren && (
                <div className="relative">
                    {/* Connection lines could go here for a fancier chart */}
                    {node.children!.map(child => (
                        <OrgNode key={child.id} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
}
