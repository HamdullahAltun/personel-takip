"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Square, ClipboardList, CheckCircle2, Clock, Trash2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

export default function StaffOnboardingPage() {
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        const res = await fetch("/api/onboarding");
        if (res.ok) setAssignments(await res.json());
        setLoading(false);
    };

    const handleCheck = async (assignmentId: string, itemId: string, currentStatus: boolean) => {
        // Optimistic update
        const newStatus = !currentStatus;
        setAssignments(prev => prev.map(a => {
            if (a.id === assignmentId) {
                const newProgress = { ...a.progress, [itemId]: newStatus };

                // Check if all completed
                const totalItems = a.checklist.items.length;
                const completedCount = Object.values(newProgress).filter(Boolean).length;
                if (completedCount === totalItems && !a.status.includes('COMPLETED')) {
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }

                return { ...a, progress: newProgress };
            }
            return a;
        }));

        await fetch("/api/onboarding", {
            method: "PATCH",
            body: JSON.stringify({ assignmentId, itemId, checked: newStatus }),
            headers: { "Content-Type": "application/json" }
        });
    };

    if (loading) return <div className="text-center py-20 text-slate-400">Yükleniyor...</div>;

    return (
        <div className="space-y-6 pb-24">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Oryantasyon & Görevler</h1>
                <p className="text-slate-500">Tamamlamanız gereken süreçler.</p>
            </div>

            {assignments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
                    <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Atanmış bir görev listeniz yok.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {assignments.map(assignment => {
                        const totalItems = assignment.checklist.items.length;
                        const completedItems = Object.values(assignment.progress || {}).filter(Boolean).length;
                        const progressPercent = Math.round((completedItems / totalItems) * 100);
                        const isCompleted = completedItems === totalItems;

                        return (
                            <div key={assignment.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-slate-50 bg-slate-50/50">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg text-slate-900">{assignment.checklist.title}</h3>
                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
                                            isCompleted ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                        )}>
                                            {isCompleted ? "Tamamlandı" : "Devam Ediyor"}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                            style={{ width: `${progressPercent}%` }}
                                        />
                                    </div>
                                    <p className="text-right text-xs text-slate-500 mt-1 font-medium">{progressPercent}% Tamamlandı</p>
                                </div>

                                <div className="p-2">
                                    {assignment.checklist.items.map((item: any) => {
                                        const isChecked = assignment.progress?.[item.id] || false;
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => handleCheck(assignment.id, item.id, isChecked)}
                                                className={cn(
                                                    "w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left group",
                                                    isChecked ? "bg-green-50/50" : "hover:bg-slate-50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors shrink-0",
                                                    isChecked ? "bg-green-500 border-green-500 text-white" : "border-slate-300 text-transparent group-hover:border-indigo-400"
                                                )}>
                                                    <CheckSquare className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className={cn(
                                                        "text-sm font-medium transition-colors",
                                                        isChecked ? "text-slate-400 line-through" : "text-slate-700"
                                                    )}>
                                                        {item.task}
                                                    </p>
                                                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{item.category}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
