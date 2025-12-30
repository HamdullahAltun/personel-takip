"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function approveLeaveRequest(id: string) {
    const { getAuth } = await import("@/lib/auth");
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return { error: "Unauthorized" };

    try {
        const leave = await prisma.leaveRequest.update({
            where: { id },
            data: { status: "APPROVED" },
        });

        const { sendPushNotification } = await import("@/lib/notifications");
        sendPushNotification(leave.userId, "İzin Onaylandı ✅", "İzin talebiniz onaylandı.").catch(console.error);

        revalidatePath("/admin/leaves");
        return { success: true };
    } catch (error) {
        return { error: "İşlem sırasında bir hata oluştu" };
    }
}

export async function rejectLeaveRequest(id: string, reason: string) {
    const { getAuth } = await import("@/lib/auth");
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return { error: "Unauthorized" };

    try {
        const leave = await prisma.leaveRequest.update({
            where: { id },
            data: {
                status: "REJECTED",
                rejectionReason: reason
            },
        });

        const { sendPushNotification } = await import("@/lib/notifications");
        sendPushNotification(leave.userId, "İzin Reddedildi ❌", `İzin talebiniz reddedildi. Sebep: ${reason}`).catch(console.error);

        revalidatePath("/admin/leaves");
        return { success: true };
    } catch (error) {
        return { error: "İşlem sırasında bir hata oluştu" };
    }
}

export async function createLeaveRequest(userId: string, startDate: Date, endDate: Date, reason: string) {
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
        revalidatePath("/leaves"); // or wherever user sees it
        return { success: true };
    } catch (error) {
        return { error: "Hata" };
    }
}
