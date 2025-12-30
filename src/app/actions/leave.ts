"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyJWT } from "@/lib/auth";
import { cookies } from "next/headers";

export async function requestLeave(prevState: any, formData: FormData) {
    const token = (await cookies()).get("personel_token")?.value;
    if (!token) return { error: "Unauthorized" };
    const user = await verifyJWT(token);
    if (!user) return { error: "Unauthorized" };

    const startDate = new Date(formData.get("startDate") as string);
    const endDate = new Date(formData.get("endDate") as string);
    const reason = formData.get("reason") as string;

    if (!startDate || !endDate || !reason) {
        return { error: "Mazeret ve tarihler gereklidir." };
    }

    if (startDate > endDate) {
        return { error: "Bitiş tarihi başlangıç tarihinden önce olamaz." };
    }

    await prisma.leaveRequest.create({
        data: {
            userId: user.id as string,
            startDate,
            endDate,
            reason,
            status: 'PENDING'
        }
    });

    revalidatePath("/leaves");
    return { success: true };
}

export async function updateLeaveStatus(id: string, status: "APPROVED" | "REJECTED") {
    // SECURITY CHECK: Verify Admin
    const token = (await cookies()).get("personel_token")?.value;
    if (!token) return { error: "Unauthorized" };
    const user = await verifyJWT(token);

    // Check role - assuming verifyJWT returns role or we need to check DB. 
    // verifyJWT(token) returns payload. If payload doesn't have role, we assume Staff?
    // Good practice: Check strictly.
    if (!user) return { error: "Unauthorized" };

    // In many JWT setups, role is in payload. If not, we might need a DB check.
    // Based on previous files, role IS in JWT payload usually, but sometimes minimal.
    // Let's safe check: 
    if (user.role !== 'ADMIN' && user.role !== 'admin') {
        return { error: "Forbidden: Only admins can manage leaves." };
    }

    const leave = await prisma.leaveRequest.update({
        where: { id },
        data: { status }
    });

    const { sendPushNotification } = await import("@/lib/notifications");
    const title = status === "APPROVED" ? "İzin Onaylandı ✅" : "İzin Reddedildi ❌";
    const body = `İzin talebiniz ${status === "APPROVED" ? "onaylandı" : "reddedildi"}.`;

    // Send asynchronously to not block
    sendPushNotification(leave.userId, title, body).catch(e => console.error("Notification failed", e));

    revalidatePath("/admin/dashboard");
    return { success: true };
}
