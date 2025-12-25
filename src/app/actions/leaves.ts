"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function approveLeaveRequest(id: string) {
    try {
        await prisma.leaveRequest.update({
            where: { id },
            data: { status: "APPROVED" },
        });
        revalidatePath("/admin/leaves");
        return { success: true };
    } catch (error) {
        return { error: "İşlem sırasında bir hata oluştu" };
    }
}

export async function rejectLeaveRequest(id: string, reason: string) {
    try {
        await prisma.leaveRequest.update({
            where: { id },
            data: {
                status: "REJECTED",
                rejectionReason: reason
            },
        });
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
