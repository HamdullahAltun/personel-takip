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

        const newUser = await prisma.user.create({
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

        // Auto-assign Onboarding Checklist
        const onboardingChecklist = await prisma.checklist.findFirst({
            where: { type: 'ONBOARDING' }
        });

        if (onboardingChecklist) {
            await prisma.checklistAssignment.create({
                data: {
                    userId: newUser.id,
                    checklistId: onboardingChecklist.id,
                    progress: {},
                    status: 'IN_PROGRESS'
                }
            });
        }

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
        await prisma.$transaction(async (tx) => {
            // 1. Operational Data
            await tx.attendanceRecord.deleteMany({ where: { userId: id } });
            await tx.workSchedule.deleteMany({ where: { userId: id } });
            await tx.shift.deleteMany({ where: { userId: id } });
            await tx.leaveRequest.deleteMany({ where: { userId: id } });

            // 2. Performance & Financials
            await tx.payroll.deleteMany({ where: { userId: id } });
            await tx.advanceRequest.deleteMany({ where: { userId: id } });
            await tx.performanceReview.deleteMany({ where: { OR: [{ revieweeId: id }, { reviewerId: id }] } });
            await tx.achievement.deleteMany({ where: { userId: id } });
            await tx.employeeOfTheMonth.deleteMany({ where: { userId: id } });
            await tx.goal.deleteMany({ where: { userId: id } });

            // 3. Tasks & Workflow
            await tx.checklistAssignment.deleteMany({ where: { userId: id } });
            await tx.task.deleteMany({ where: { assignedToId: id } }); // Delete tasks assigned TO them
            // Tasks assigned BY them: Keep, but maybe set assignedBy to null? Prisma might complain. 
            // For now, let's leave assignedBy tasks as they are historical records of work definitions. 
            // But if assignedBy relation is strict, it might error. MongoDB relations are usually optional references unless enforced.

            // 4. Social & Messages
            await tx.post.deleteMany({ where: { userId: id } });
            await tx.comment.deleteMany({ where: { userId: id } });
            await tx.like.deleteMany({ where: { userId: id } });
            await tx.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } });

            // 5. Assets & Docs
            await tx.asset.updateMany({ where: { assignedToId: id }, data: { assignedToId: null, status: 'AVAILABLE' } });
            await tx.document.deleteMany({ where: { userId: id } });

            // Finally delete user
            await tx.user.delete({ where: { id } });
        });

        revalidatePath("/admin/employees");
        return { success: true };
    } catch (error) {
        console.error("Delete Employee Error:", error);
        return { error: "Failed to delete employee. Check logs." };
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
