"use client";

import { useState, useEffect } from "react";
import { User as UserIcon, ZoomIn, ZoomOut, Move } from "lucide-react";

type UserNode = {
    id: string;
    name: string;
    role: string;
    profilePicture?: string;
    managerId: string | null;
    children?: UserNode[];
};

export default function OrgChartPage() {
    const [users, setUsers] = useState<UserNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const res = await fetch("/api/organization");
        if (res.ok) {
            const data: UserNode[] = await res.json();
            const hierarchy = buildHierarchy(data);
            setUsers(hierarchy);
        }
        setLoading(false);
    };

    const buildHierarchy = (flatUsers: UserNode[]) => {
        const userMap = new Map<string, UserNode>();
        flatUsers.forEach(u => userMap.set(u.id, { ...u, children: [] }));

        const roots: UserNode[] = [];
        flatUsers.forEach(u => {
            if (u.managerId && userMap.has(u.managerId)) {
                userMap.get(u.managerId)!.children!.push(userMap.get(u.id)!);
            } else {
                roots.push(userMap.get(u.id)!);
            }
        });
        return roots;
    };

    return (
        <div className="h-[calc(100vh-6rem)] overflow-hidden flex flex-col relative bg-slate-50 rounded-xl border border-slate-200">
            {/* Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 bg-white p-2 rounded-lg shadow-md border border-slate-100">
                <button onClick={() => setScale(s => Math.min(s + 0.1, 2))} className="p-2 hover:bg-slate-100 rounded text-slate-600"><ZoomIn className="w-5 h-5" /></button>
                <button onClick={() => setScale(s => Math.max(s - 0.1, 0.4))} className="p-2 hover:bg-slate-100 rounded text-slate-600"><ZoomOut className="w-5 h-5" /></button>
                <button onClick={() => setScale(1)} className="p-2 hover:bg-slate-100 rounded text-slate-600 text-xs font-bold">100%</button>
            </div>

            <div className="absolute top-4 left-4 z-10">
                <h1 className="text-2xl font-bold text-slate-900">Organizasyon Şeması</h1>
                <p className="text-slate-500 text-sm">Zoom ve kaydırma ile inceleyebilirsiniz</p>
            </div>

            <div className="flex-1 overflow-auto cursor-grab active:cursor-grabbing p-20 flex justify-center items-start custom-scrollbar">
                <div
                    style={{ transform: `scale(${scale})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}
                    className="min-w-fit"
                >
                    <div className="flex gap-16 justify-center">
                        {users.map(root => (
                            <TreeNode key={root.id} node={root} />
                        ))}
                    </div>
                    {users.length === 0 && !loading && (
                        <div className="text-slate-400 mt-20 italic">Kullanıcı bulunamadı veya hiyerarşi tanımlanmamış.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TreeNode({ node }: { node: UserNode }) {
    return (
        <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 w-64 relative group hover:shadow-xl hover:border-indigo-200 transition-all z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold overflow-hidden border-2 border-white shadow-sm">
                        {node.profilePicture ? <img src={node.profilePicture} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">{node.name}</h3>
                        <p className="text-xs text-indigo-500 font-medium">{node.role === 'ADMIN' ? 'Yönetici' : 'Personel'}</p>
                    </div>
                </div>

                {/* Connecting Line to Parent - handled by parent generally, but top handled here? No. */}
            </div>

            {node.children && node.children.length > 0 && (
                <div className="flex flex-col items-center">
                    {/* Vertical Line Down */}
                    <div className="w-px h-8 bg-slate-300"></div>

                    {/* Horizontal Connector */}
                    <div className="relative flex justify-center gap-8 pt-4 border-t border-slate-300">
                        {/* 
                           We need a way to draw the horizontal line ONLY between first and last child.
                           CSS pseudo elements on the 'ul/li' structure is easier.
                           But with Flexbox:
                           We can use a wrapper that has border-top.
                           
                           Actually, a better trick for Flex lines:
                           Parent 
                             |
                           Div (Connects Parent to Children Container)
                             |
                           Children Container (Flex Row)
                        */}

                        {node.children?.map((child, index) => (
                            <div key={child.id} className="flex flex-col items-center relative">
                                {/* Connector Up - using negative margin or absolute?
                                    Actually the simplest recursive tree CSS is:
                                    Parent -> Line Down -> Children Wrapper (Flex) -> (Line Up + Child + Line Down)
                                */}
                                {/* Top vertical line for each child, but we need horizontal bar too. 
                                    Let's cheat: The border-t on the PARENT wrapper serves as horizontal.
                                    But it spans full width. We need it only between first and last center.
                                */}

                                {/* Workaround: Absolute lines on children */}
                                <div className="absolute top-[-17px] w-full h-[17px] border-t border-slate-300 left-1/2 -ml-[50%] first:ml-0 first:w-1/2 last:w-1/2 last:ml-0 last:border-l-0 last:left-0 first:left-1/2 first:border-r-0"></div>
                                {/* The above logic is complex. Let's stick to a simpler visual: just vertical lines, or standard tree.
                                    
                                    Let's try standard CSS Tree structure reused in Flex.
                                    
                                    <div className="relative flex flex-col items-center ...">
                                      <div className="-mt-4 w-px h-4 bg-slate-300 absolute top-0"></div> 
                                      <TreeNode ... />
                                    </div>
                                    
                                    But the horizontal line is key.
                                */}
                                {/* Simple Horizontal Line Wrapper */}
                                <div className={`absolute top-[-1px] left-0 w-1/2 h-px bg-slate-300 ${index === 0 ? 'hidden' : ''}`}></div>
                                <div className={`absolute top-[-1px] right-0 w-1/2 h-px bg-slate-300 ${index === (node.children?.length || 0) - 1 ? 'hidden' : ''}`}></div>
                                <div className="absolute top-[-17px] w-px h-[17px] bg-slate-300"></div>

                                <TreeNode node={child} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
