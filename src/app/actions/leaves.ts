"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { logInfo, logError } from "@/lib/log-utils";

export async function requestLeave(_prevState: any, formData: FormData) {
    const session = await getAuth();
    if (!session) return { error: "Oturum bulunamadı." };

    const startDateStr = formData.get("startDate") as string;
    const endDateStr = formData.get("endDate") as string;
    const reason = formData.get("reason") as string;

    if (!startDateStr || !endDateStr || !reason) {
        return { error: "Mazeret ve tarihler gereklidir." };
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (startDate > endDate) {
        return { error: "Bitiş tarihi başlangıç tarihinden önce olamaz." };
    }

    try {
        await prisma.leaveRequest.create({
            data: {
                userId: session.id,
                startDate,
                endDate,
                reason,
                status: 'PENDING'
            }
        });

        logInfo(`New leave request created by user ${session.id}`);
        revalidatePath("/leaves");
        return { success: true };
    } catch (error) {
        logError("Create Leave Request Error", error);
        return { error: "T talep oluşturulurken bir hata oluştu." };
    }
}

export async function updateLeaveStatus(id: string, status: "APPROVED" | "REJECTED", rejectionReason?: string) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return { error: "Bu işlem için yetkiniz yok." };
    }

    try {
        const currentLeave = await prisma.leaveRequest.findUnique({ 
            where: { id },
            include: { user: true }
        });

        if (!currentLeave) return { error: "İzin kaydı bulunamadı." };
        if (currentLeave.status === status) return { success: true };

        const { adjustLeaveBudget } = await import("@/lib/leave-utils");

        // Handle Annual Leave Days Budget
        if (status === "APPROVED" && currentLeave.status !== "APPROVED") {
            await adjustLeaveBudget(currentLeave.userId, currentLeave.startDate, currentLeave.endDate, 'DEDUCT');
        }

        if (status === "REJECTED" && currentLeave.status === "APPROVED") {
            await adjustLeaveBudget(currentLeave.userId, currentLeave.startDate, currentLeave.endDate, 'REFUND');
        }

        const updatedLeave = await prisma.leaveRequest.update({
            where: { id },
            data: { 
                status,
                rejectionReason: status === "REJECTED" ? rejectionReason : undefined
            }
        });

        // Notifications
        const { sendPushNotification } = await import("@/lib/notifications");
        const title = status === "APPROVED" ? "İzin Onaylandı ✅" : "İzin Reddedildi ❌";
        const body = status === "APPROVED" 
            ? "İzin talebiniz onaylandı." 
            : `İzin talebiniz reddedildi.${rejectionReason ? ` Sebep: ${rejectionReason}` : ''}`;

        sendPushNotification(updatedLeave.userId, title, body).catch(e => logError("Notification failed", e));

        logInfo(`Leave status updated to ${status} by admin ${session.id}`, { leaveId: id });
        
        revalidatePath("/admin/leaves");
        revalidatePath("/admin/dashboard");
        revalidatePath("/leaves");
        
        return { success: true };
    } catch (error) {
        logError("Update Leave Status Error", error);
        return { error: "İşlem başarısız." };
    }
}

// Keep compatible aliases for existing code
export async function approveLeaveRequest(id: string) {
    return updateLeaveStatus(id, "APPROVED");
}

export async function rejectLeaveRequest(id: string, reason: string) {
    return updateLeaveStatus(id, "REJECTED", reason);
}

export async function createLeaveRequest(userId: string, startDate: Date, endDate: Date, reason: string) {
    // This looks like a direct call version of requestLeave
    try {
        await prisma.leaveRequest.create({
            data: {
                userId,
                startDate,
                endDate,
                reason,
                status: "PENDING"
            }
        });
        revalidatePath("/leaves");
        return { success: true };
    } catch (error) {
        logError("Direct Create Leave Error", error);
        return { error: "Hata" };
    }
}
