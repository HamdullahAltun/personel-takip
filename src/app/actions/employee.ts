"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { saveBase64ToFile } from "@/lib/upload-utils";
import { logInfo, logError } from "@/lib/log-utils";

export async function createEmployee(prevState: unknown, formData: FormData) {
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
        await logInfo(`New employee created: ${name} (${newUser.id}) by admin ${session.id}`);
        return { success: true };
    } catch (error) {
        await logError("Create Employee Error", error);
        return { error: "Failed to create employee" };
    }
}

export async function deleteEmployee(id: string) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return { error: "Unauthorized" };

    try {
        await prisma.$transaction(async (tx) => {
            // Core Records
            await tx.attendanceRecord.deleteMany({ where: { userId: id } });
            await tx.shift.deleteMany({ where: { userId: id } });
            await tx.leaveRequest.deleteMany({ where: { userId: id } });

            // Financial & Performance
            await tx.payroll.deleteMany({ where: { userId: id } });
            await tx.advanceRequest.deleteMany({ where: { userId: id } });
            await tx.performanceReview.deleteMany({ where: { OR: [{ revieweeId: id }, { reviewerId: id }] } });
            await tx.achievement.deleteMany({ where: { userId: id } });
            await tx.employeeOfTheMonth.deleteMany({ where: { userId: id } });
            await tx.goal.deleteMany({ where: { userId: id } });

            // Tasks & Checklists
            await tx.checklistAssignment.deleteMany({ where: { userId: id } });
            await tx.task.deleteMany({ where: { OR: [{ assignedToId: id }, { assignedById: id }] } });

            // Social & Communication
            await tx.post.deleteMany({ where: { userId: id } });
            await tx.comment.deleteMany({ where: { userId: id } });
            await tx.like.deleteMany({ where: { userId: id } });
            await tx.message.deleteMany({ where: { OR: [{ senderId: id }, { receiverId: id }] } });
            await tx.pollVote.deleteMany({ where: { userId: id } });
            await tx.story.deleteMany({ where: { userId: id } });
            await tx.teamMood.deleteMany({ where: { userId: id } });
            await tx.notification.deleteMany({ where: { userId: id } });

            // LMS & Training
            await tx.trainingCompletion.deleteMany({ where: { userId: id } });
            await tx.lmsCompletion.deleteMany({ where: { userId: id } });
            await tx.skillGap.deleteMany({ where: { userId: id } });

            // AI & Logs
            await tx.aiQueryLog.deleteMany({ where: { userId: id } });
            await tx.sentimentLog.deleteMany({ where: { userId: id } });
            await tx.attritionRisk.deleteMany({ where: { userId: id } });

            // Assets & Documents
            await tx.asset.updateMany({ where: { assignedToId: id }, data: { assignedToId: null, status: 'AVAILABLE' } });
            await tx.document.deleteMany({ where: { userId: id } });
            await tx.docSignature.deleteMany({ where: { userId: id } });

            // Inventory & Stock
            await tx.inventoryRequest.deleteMany({ where: { userId: id } });
            await tx.stockTransaction.deleteMany({ where: { userId: id } });

            // Other
            await tx.wellnessActivity.deleteMany({ where: { userId: id } });
            await tx.surveyResponse.deleteMany({ where: { userId: id } });
            await tx.visitor.deleteMany({ where: { invitedById: id } });

            // Finally, the user
            await tx.user.delete({ where: { id } });
        });

        const { logInfo } = await import("@/lib/log-utils");
        logInfo(`Employee deleted by admin: ${session.id}`, { targetUserId: id });

        revalidatePath("/admin/employees");
        return { success: true };
    } catch (error) {
        const { logError } = await import("@/lib/log-utils");
        logError("Delete Employee Error", error);
        return { error: "Failed to delete employee. Check logs." };
    }
}

export async function updateEmployee(id: string, prevState: unknown, formData: FormData) {
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
        const managerId = formData.get("managerId") as string || null;
        const skillsString = formData.get("skills") as string || "";
        const skills = skillsString.split(',').map(s => s.trim()).filter(s => s !== "");

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
                managerId: managerId === "" ? null : managerId,
                skills,
                ...(profilePicture && {
                    profilePicture: await saveBase64ToFile(profilePicture, `profile_${id}.jpg`)
                })
            }
        });

        revalidatePath("/admin/employees");
        revalidatePath(`/admin/employees/${id}`);
        await logInfo(`Employee ${id} updated by admin ${session.id}`, { name });
        return { success: true };
    } catch (error: unknown) {
        await logError("Update Employee Error", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return { error: `Update failed: ${errorMessage}` };
    }
}

export async function updateProfilePicture(formData: FormData) {
    try {
        const session = await getAuth();
        if (!session) return { error: "Unauthorized" };

        const profilePicture = formData.get("profilePicture") as string;
        if (!profilePicture) return { error: "Image required" };

        const fileUrl = await saveBase64ToFile(profilePicture, `profile_${session.id}.jpg`);

        await prisma.user.update({
            where: { id: session.id as string },
            data: { profilePicture: fileUrl }
        });

        revalidatePath("/profile");
        await logInfo(`User ${session.id} updated their profile picture`);
        return { success: true };

    } catch (error) {
        await logError("Profile Picture Update Error", error);
        return { error: "Failed to update" };
    }
}
