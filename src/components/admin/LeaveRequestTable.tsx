"use client";

import { LeaveRequest, User } from "@prisma/client";
import { Check, X, Calendar, Clock, AlertCircle } from "lucide-react";
import { approveLeaveRequest, rejectLeaveRequest } from "@/app/actions/leaves";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type LeaveRequestWithUser = LeaveRequest & { user: User };

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function LeaveRequestTable({ pendingLeaves, pastLeaves }: { pendingLeaves: LeaveRequestWithUser[], pastLeaves: LeaveRequestWithUser[] }) {
    const { data } = useSWR('/api/leaves', fetcher, {
        refreshInterval: 3000,
        fallbackData: { pendingLeaves, pastLeaves } // Use initial server data immediately
    });

    const activePending = data ? data.pendingLeaves : pendingLeaves;
    const activePast = data ? data.pastLeaves : pastLeaves;

    const [activeTab, setActiveTab] = useState<"PENDING" | "HISTORY">("PENDING");
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const router = useRouter();

    const handleApprove = async (id: string) => {
        if (!confirm("Bu talebi onaylamak istediğinize emin misiniz?")) return;
        await approveLeaveRequest(id);
        router.refresh();
    };

    const openRejectModal = (id: string) => {
        setSelectedLeaveId(id);
        setRejectionReason("");
        setIsRejectModalOpen(true);
    };

    const handleRejectSubmit = async () => {
        if (!selectedLeaveId || !rejectionReason.trim()) return;
        await rejectLeaveRequest(selectedLeaveId, rejectionReason);
        setIsRejectModalOpen(false);
        router.refresh();
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab("PENDING")}
                    className={`flex-1 py-3 text-center font-medium text-sm transition-colors ${activeTab === "PENDING" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-slate-500 hover:bg-slate-50"}`}
                >
                    Bekleyenler ({activePending.length})
                </button>
                <button
                    onClick={() => setActiveTab("HISTORY")}
                    className={`flex-1 py-3 text-center font-medium text-sm transition-colors ${activeTab === "HISTORY" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-slate-500 hover:bg-slate-50"}`}
                >
                    Geçmiş ({activePast.length})
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Personel</th>
                            <th className="px-6 py-3">Tarih Aralığı</th>
                            <th className="px-6 py-3">Sebep</th>
                            <th className="px-6 py-3">Talep Tarihi</th>
                            <th className="px-6 py-3 text-right">Durum / İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {(activeTab === "PENDING" ? activePending : activePast).map((leave: LeaveRequestWithUser) => (
                            <tr key={leave.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-medium text-slate-900">{leave.user.name}</td>
                                <td className="px-6 py-4">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-slate-400" />
                                        {format(new Date(leave.startDate), "d MMM", { locale: tr })} - {format(new Date(leave.endDate), "d MMM yyyy", { locale: tr })}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    <p className="max-w-[200px] truncate" title={leave.reason}>{leave.reason}</p>
                                    {leave.rejectionReason && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Ret: {leave.rejectionReason}
                                        </p>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-slate-500">{format(new Date(leave.createdAt), "d MMM HH:mm", { locale: tr })}</td>
                                <td className="px-6 py-4 text-right">
                                    {leave.status === 'PENDING' ? (
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleApprove(leave.id)}
                                                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors" title="Onayla">
                                                <Check className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => openRejectModal(leave.id)}
                                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors" title="Reddet">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {leave.status === 'APPROVED' ? 'ONAYLANDI' : 'REDDELDİ'}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {(activeTab === "PENDING" ? activePending : activePast).length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    {activeTab === "PENDING" ? "Bekleyen talep yok." : "Geçmiş talep bulunamadı."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Rejection Modal */}
            {isRejectModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-200 font-bold text-slate-900">
                            İzin Talebini Reddet
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-slate-600 mb-2">Lütfen ret sebebini giriniz. Bu sebep personele gösterilecektir.</p>
                            <textarea
                                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                rows={3}
                                placeholder="Örn: İş yoğunluğu nedeniyle..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>
                        <div className="p-4 bg-slate-50 flex justify-end gap-2">
                            <button
                                onClick={() => setIsRejectModalOpen(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium"
                            >
                                Vazgeç
                            </button>
                            <button
                                onClick={handleRejectSubmit}
                                disabled={!rejectionReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                            >
                                Reddet
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
