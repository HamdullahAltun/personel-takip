import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LeaveForm from "@/components/staff/LeaveForm";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default async function LeavesPage() {
    const token = (await cookies()).get("personel_token")?.value;
    if (!token) redirect("/login");
    const payload = await verifyJWT(token);
    if (!payload) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: payload.id as string },
        select: { annualLeaveDays: true }
    });

    const leaves = await prisma.leaveRequest.findMany({
        where: { userId: payload.id as string },
        orderBy: { createdAt: 'desc' }
    });

    // Calculate remaining days (simplified logic: annualLeaveDays - approved/pending days)
    // For now just show the total assigned by admin.
    // Or better, calculate approved duration.

    // Logic: Total Annual Leave is what Admin sets. Usage is sum of leaves.
    // Let's just show the "Total Right" set by admin.

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold">İzin Talepleri</h1>

            {/* Leave Stats */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
                <p className="text-indigo-100 text-sm font-medium">Yıllık İzin Hakkı</p>
                <div className="flex items-end gap-2 mt-1">
                    <p className="text-4xl font-bold">{user?.annualLeaveDays || 0}</p>
                    <span className="text-lg font-medium opacity-80 mb-1">Gün</span>
                </div>
                <p className="text-xs text-indigo-200 mt-2">*Kullanılan izinler bakiyeden düşülür.</p>
            </div>

            <LeaveForm />

            <div className="space-y-4">
                <h2 className="font-semibold text-slate-900">Geçmiş Talepler</h2>
                {leaves.length === 0 ? (
                    <p className="text-slate-500 text-sm">Henüz izin talebiniz yok.</p>
                ) : (
                    <div className="grid gap-4">
                        {leaves.map((leave) => (
                            <div key={leave.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                                <div>
                                    <p className="font-medium text-slate-900">{leave.reason}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {format(leave.startDate, "d MMM yyyy", { locale: tr })} - {format(leave.endDate, "d MMM yyyy", { locale: tr })}
                                    </p>
                                </div>
                                <div>
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                        leave.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                        {leave.status === 'APPROVED' ? 'Onaylandı' :
                                            leave.status === 'REJECTED' ? 'Reddedildi' : 'Beklemede'}
                                    </span>
                                    {leave.status === 'REJECTED' && leave.rejectionReason && (
                                        <p className="text-[10px] text-red-500 mt-2 text-right max-w-[120px]">
                                            Sebep: {leave.rejectionReason}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
