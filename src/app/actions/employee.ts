"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createEmployee(prevState: any, formData: FormData) {
    try {
        const name = formData.get("name") as string;
        const phone = formData.get("phone") as string;
        const email = formData.get("email") as string || null;
        const hourlyRate = parseFloat(formData.get("hourlyRate") as string) || 0;
        const weeklyGoal = parseInt(formData.get("weeklyGoal") as string) || 40;
        const annualLeaveDays = parseInt(formData.get("annualLeaveDays") as string) || 0;
        const role = formData.get("role") as "STAFF" | "ADMIN" || "STAFF";

        if (!name || !phone) {
            return { error: "Name and Phone are required" };
        }

        // Check phone
        const existingPhone = await prisma.user.findUnique({ where: { phone } });
        if (existingPhone) return { error: "Phone number already registered" };

        // Check email distinct uniqueness if provided? No strict unique constraint on DB now but good to check
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
    try {
        await prisma.user.delete({ where: { id } });
        revalidatePath("/admin/employees");
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete employee" };
    }
}

export async function updateEmployee(id: string, prevState: any, formData: FormData) {
    try {
        const name = formData.get("name") as string;
        const phone = formData.get("phone") as string;
        const email = formData.get("email") as string || null;
        const hourlyRate = parseFloat(formData.get("hourlyRate") as string) || 0;
        const weeklyGoal = parseInt(formData.get("weeklyGoal") as string) || 40;
        const annualLeaveDays = parseInt(formData.get("annualLeaveDays") as string) || 0;
        const role = formData.get("role") as "STAFF" | "ADMIN" || "STAFF";

        await prisma.user.update({
            where: { id },
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
        revalidatePath(`/admin/employees/${id}`);
        return { success: true };
    } catch (error) {
        console.error("Update Employee Error:", error);
        return { error: "Failed to update employee" };
    }
}
