"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";

export async function createEmployee(prevState: any, formData: FormData) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return { error: "Unauthorized" };

    try {
        const name = formData.get("name") as string;
        const phone = formData.get("phone") as string;
        const email = formData.get("email") as string || null;
        const hourlyRate = parseFloat(formData.get("hourlyRate") as string) || 0;
        const weeklyGoal = parseInt(formData.get("weeklyGoal") as string) || 40;
        const annualLeaveDays = parseInt(formData.get("annualLeaveDays") as string) || 0;
        const role = formData.get("role") as "STAFF" | "ADMIN" | "EXECUTIVE" || "STAFF";

        if (!name || !phone) {
            return { error: "Name and Phone are required" };
        }

        const existingPhone = await prisma.user.findUnique({ where: { phone } });
        if (existingPhone) return { error: "Phone number already registered" };

        if (email) {
            const existingEmail = await prisma.user.findFirst({ where: { email } });
            if (existingEmail) return { error: "Email already registered" };
        }

        await prisma.user.create({
            data: {
                name,
                phone,
                email,
                hourlyRate,
                weeklyGoal,
                annualLeaveDays,
                role
            }
        });

        revalidatePath("/admin/employees");
        return { success: true };
    } catch (error) {
        console.error("Create Employee Error:", error);
        return { error: "Failed to create employee" };
    }
}

export async function deleteEmployee(id: string) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return { error: "Unauthorized" };

    try {
        await prisma.user.delete({ where: { id } });
        revalidatePath("/admin/employees");
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete employee" };
    }
}

export async function updateEmployee(id: string, prevState: any, formData: FormData) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return { error: "Unauthorized" };

    try {
        const name = formData.get("name") as string;
        const phone = formData.get("phone") as string;
        const email = formData.get("email") as string || null;
        const hourlyRate = parseFloat(formData.get("hourlyRate") as string) || 0;
        const weeklyGoal = parseInt(formData.get("weeklyGoal") as string) || 40;
        const annualLeaveDays = parseInt(formData.get("annualLeaveDays") as string) || 0;
        const role = formData.get("role") as "STAFF" | "ADMIN" | "EXECUTIVE" || "STAFF";
        const profilePicture = formData.get("profilePicture") as string;

        await prisma.user.update({
            where: { id },
            data: {
                name,
                phone,
                email,
                hourlyRate,
                weeklyGoal,
                annualLeaveDays,
                role,
                ...(profilePicture && { profilePicture })
            }
        });

        revalidatePath("/admin/employees");
        revalidatePath(`/admin/employees/${id}`);
        return { success: true };
    } catch (error: any) {
        console.error("Update Employee Error Details:", error);
        return { error: `Güncelleme başarısız: ${error.message}` };
    }
}

export async function updateProfilePicture(formData: FormData) {
    try {
        const session = await getAuth();
        if (!session) return { error: "Unauthorized" };

        const profilePicture = formData.get("profilePicture") as string;
        if (!profilePicture) return { error: "Image required" };

        await prisma.user.update({
            where: { id: session.id as string },
            data: { profilePicture }
        });

        revalidatePath("/profile");
        return { success: true };
    } catch (e) {
        return { error: "Failed to update" };
    }
}
