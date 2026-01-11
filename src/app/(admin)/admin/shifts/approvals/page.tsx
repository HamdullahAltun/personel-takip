import { getPendingSwapRequests, approveSwapRequest, rejectSwapRequest } from "@/actions/shifts/marketplace";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { CheckCircle, XCircle, ArrowRight, Clock, User as UserIcon } from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function ShiftApprovalsPage() {
    // @ts-ignore
    const requests = await getPendingSwapRequests();

    return (
        <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Vardiya Takas Onayları
                </h1>
                <p className="text-slate-500">
                    Personel arası vardiya değişim taleplerini yönetin.
                </p>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">Bekleyen Talep Yok</h3>
                    <p className="text-slate-500">Şu anda onay bekleyen vardiya takas işlemi bulunmuyor.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {requests.map((req: any) => (
                        <div key={req.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between gap-6">

                            {/* Shift Details */}
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-4 text-sm text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 w-fit">
                                    <div className="flex items-center gap-2">
                                        <Clock size={16} />
                                        <span className="font-bold text-slate-700">{format(new Date(req.shift.startTime), 'd MMMM yyyy', { locale: tr })}</span>
                                    </div>
                                    <span>|</span>
                                    <span>{format(new Date(req.shift.startTime), 'HH:mm')} - {format(new Date(req.shift.endTime), 'HH:mm')}</span>
                                </div>

                                <div className="flex items-center gap-8">
                                    {/* Requester (Giver) */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center border border-red-100">
                                            <UserIcon size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold">Devreden</p>
                                            <p className="font-bold text-slate-900">{req.requester.name}</p>
                                            <p className="text-xs text-slate-400">{req.requester.department?.name}</p>
                                        </div>
                                    </div>

                                    <ArrowRight className="text-slate-300" />

                                    {/* Claimant (Receiver) */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center border border-green-100">
                                            <UserIcon size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase font-bold">Devralan</p>
                                            <p className="font-bold text-slate-900">{req.claimant.name}</p>
                                            <p className="text-xs text-slate-400">{req.claimant.department?.name}</p>
                                        </div>
                                    </div>
                                </div>

                                {req.reason && (
                                    <div className="text-sm text-slate-500 italic">
                                        " {req.reason} "
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 w-full md:w-auto">
                                <form action={async () => {
                                    "use server";
                                    await approveSwapRequest(req.id);
                                }}>
                                    <button className="w-full md:w-32 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                                        <CheckCircle size={18} />
                                        Onayla
                                    </button>
                                </form>

                                <form action={async () => {
                                    "use server";
                                    await rejectSwapRequest(req.id);
                                }}>
                                    <button className="w-full md:w-32 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                                        <XCircle size={18} />
                                        Reddet
                                    </button>
                                </form>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
