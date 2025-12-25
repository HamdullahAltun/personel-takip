import { prisma } from "@/lib/prisma";
import LeaveRequestTable from "@/components/admin/LeaveRequestTable";

export default async function AdminLeavesPage() {
    const pendingLeaves = await prisma.leaveRequest.findMany({
        where: { status: "PENDING" },
        include: { user: true },
        orderBy: { createdAt: "desc" }
    });

    const pastLeaves = await prisma.leaveRequest.findMany({
        where: { status: { not: "PENDING" } },
        include: { user: true },
        orderBy: { createdAt: "desc" },
        take: 50 // Limit history
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">İzin Talepleri</h1>
            <p className="text-slate-500">Bekleyen ve geçmiş izin taleplerini yönetin.</p>

            <LeaveRequestTable pendingLeaves={pendingLeaves} pastLeaves={pastLeaves} />
        </div>
    );
}
