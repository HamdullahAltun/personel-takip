"use client";

import { useState, useEffect } from "react";
import { ClipboardList, CheckCircle2, Circle, Clock, Building2, UserCheck, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StaffOnboarding() {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/staff/checklists").then(res => res.json()).then(data => {
            setAssignments(data);
            setLoading(false);
        });
    }, []);

    const toggleItem = async (assignmentId: string, itemId: string, currentStatus: boolean) => {
        const res = await fetch("/api/staff/checklists", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assignmentId, itemId, completed: !currentStatus })
        });
        if (res.ok) {
            // Optimistic update or refetch
            const data = await res.json();
            setAssignments(assignments.map(a => a.id === assignmentId ? data : a));
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="bg-gradient-to-br from-slate-900 to-indigo-900 -m-4 p-10 text-white rounded-b-[4rem] shadow-xl mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <ShieldCheck className="w-10 h-10 text-indigo-400" />
                    <h1 className="text-3xl font-black italic">HOŞ GELDİNİZ!</h1>
                </div>
                <p className="text-slate-300 text-sm max-w-sm">Sizin için hazırladığımız uyum sürecini buradan takip edebilir, adımları tamamladıkça işaretleyebilirsiniz.</p>
            </div>

            <div className="space-y-8">
                {assignments.map((assignment) => {
                    const total = assignment.checklist.items.length;
                    const completed = Object.values(assignment.progress || {}).filter(v => v).length;
                    const percent = (completed / total) * 100;

                    return (
                        <div key={assignment.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{assignment.checklist.title}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">AKTİF SÜREÇ</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-slate-900">%{percent.toFixed(0)}</div>
                                    <div className="text-[10px] text-slate-400 font-bold">TAMAMLANDI</div>
                                </div>
                            </div>

                            <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100">
                                <div
                                    className="h-full bg-indigo-600 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(79,70,229,0.4)]"
                                    style={{ width: `${percent}%` }}
                                ></div>
                            </div>

                            <div className="space-y-3 pt-4">
                                {assignment.checklist.items.map((item: any) => {
                                    const isDone = assignment.progress?.[item.id];
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => toggleItem(assignment.id, item.id, isDone)}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group",
                                                isDone
                                                    ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                                                    : "bg-white border-slate-100 hover:border-indigo-200 hover:scale-[1.01]"
                                            )}
                                        >
                                            {isDone ? (
                                                <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-500" />
                                            ) : (
                                                <Circle className="w-6 h-6 shrink-0 text-slate-300 group-hover:text-indigo-400" />
                                            )}
                                            <div className="flex-1">
                                                <p className={cn("text-sm font-bold", isDone && "line-through opacity-60")}>{item.task}</p>
                                                <span className="text-[10px] font-bold opacity-60 uppercase">{item.category}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {assignments.length === 0 && !loading && (
                    <div className="bg-white rounded-[2.5rem] p-12 text-center border-2 border-dashed border-slate-100">
                        <UserCheck className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900">Şu anlık bir süreç atanmadı</h3>
                        <p className="text-slate-400 text-sm">Yöneticileriniz size bir süreç atadığında burada görünecektir.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
