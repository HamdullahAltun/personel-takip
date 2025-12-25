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
        return { error: "All fields are required" };
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
    await prisma.leaveRequest.update({
        where: { id },
        data: { status }
    });
    revalidatePath("/admin/dashboard"); // Assuming we show it there or separate page
    return { success: true };
}
