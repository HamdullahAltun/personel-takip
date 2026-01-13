"use server";

import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { validateShiftConstraints } from "@/lib/scheduler-utils";
import { createNotification } from "@/lib/notifications";
import { logInfo, logError } from "@/lib/log-utils";

export async function createSwapRequest(shiftId: string, reason: string) {
    const session = await getAuth();
    if (!session) return { error: "Unauthorized" };

    try {
        const shift = await prisma.shift.findUnique({
            where: { id: shiftId },
        });

        if (!shift || shift.userId !== session.id) {
            return { error: "Shift not found or not owned by you" };
        }

        await prisma.shiftSwapRequest.create({
            data: {
                shiftId,
                requesterId: session.id,
                reason,
                status: "OPEN",
            },
        });

        logInfo(`Shift swap request created by ${session.id}`, { shiftId });
        revalidatePath("/shifts");
        return { success: true };
    } catch (error) {
        logError("Create swap error", error);
        return { error: "Failed to create request" };
    }
}

export async function claimSwapRequest(requestId: string) {
    const session = await getAuth();
    if (!session) return { error: "Unauthorized" };

    try {
        const request = await prisma.shiftSwapRequest.findUnique({
            where: { id: requestId },
            include: { shift: true }
        });

        if (!request || request.status !== "OPEN") {
            return { error: "Talebe ulaşılamadı veya zaten alınmış." };
        }

        if (request.requesterId === session.id) {
            return { error: "Kendi vardiyanızı alamazsınız." };
        }

        // --- AUTO-APPROVAL LOGIC ---
        const validation = await validateShiftConstraints(
            session.id,
            request.shift.startTime,
            request.shift.endTime
        );

        if (validation.valid) {
            // AUTO APPROVE
            await prisma.$transaction([
                prisma.shiftSwapRequest.update({
                    where: { id: requestId },
                    data: {
                        claimantId: session.id,
                        status: "APPROVED"
                    }
                }),
                prisma.shift.update({
                    where: { id: request.shiftId },
                    data: {
                        userId: session.id,
                        notes: (request.shift.notes || "") + ` \n[OTOMATİK TAKAS: ${request.requesterId} -> ${session.id}]`
                    }
                })
            ]);

            logInfo(`Shift swap auto-approved for user ${session.id}`, { requestId });

            // Notify
            await createNotification(request.requesterId, "Vardiya Takası Onaylandı", "Vardiyanız kurallar dahilinde otomatik olarak devredildi.", "SUCCESS");

            revalidatePath("/shifts");
            return { success: true, message: "Vardiya kurallara uygun olduğu için otomatik olarak onaylandı ve size atandı." };
        } else {
            // PENDING APPROVAL (Rules not met or manual check needed)
            await prisma.shiftSwapRequest.update({
                where: { id: requestId },
                data: {
                    claimantId: session.id,
                    status: "PENDING_APPROVAL",
                },
            });

            logInfo(`Shift swap pending approval for user ${session.id}`, { requestId, reason: validation.reason });

            revalidatePath("/shifts");
            return { success: true, message: "Takas talebiniz alındı. Bazı kurallar (çalışma saati vb.) nedeniyle yönetici onayı bekleniyor." };
        }

    } catch (error) {
        logError("Claim swap error", error);
        return { error: "İşlem başarısız." };
    }
}

export async function approveSwapRequest(requestId: string) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return { error: "Forbidden" };
    }

    try {
        const request = await prisma.shiftSwapRequest.findUnique({
            where: { id: requestId },
            include: { shift: true }
        });

        if (!request || request.status !== "PENDING_APPROVAL" || !request.claimantId) {
            return { error: "Invalid request state" };
        }

        await prisma.$transaction([
            prisma.shiftSwapRequest.update({
                where: { id: requestId },
                data: { status: "APPROVED" },
            }),
            prisma.shift.update({
                where: { id: request.shiftId },
                data: {
                    userId: request.claimantId,
                    notes: (request.shift.notes || "") + ` \n[Swapped from ${request.requesterId} to ${request.claimantId}]`
                },
            })
        ]);

        logInfo(`Shift swap request approved by admin ${session.id}`, { requestId });

        await prisma.notification.createMany({
            data: [
                {
                    userId: request.requesterId,
                    title: "Vardiya Takası Onaylandı",
                    message: "Vardiya takas talebiniz onaylandı ve vardiya devredildi.",
                    type: "INFO"
                },
                {
                    userId: request.claimantId,
                    title: "Vardiya Takası Onaylandı",
                    message: "Yeni bir vardiya devraldınız.",
                    type: "INFO"
                }

            ]
        });

        revalidatePath("/admin/shifts");
        return { success: true };

    } catch (error) {
        logError("Approve swap error", error);
        return { error: "Failed to approve swap" };
    }
}

export async function rejectSwapRequest(requestId: string) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return { error: "Forbidden" };
    }

    try {
        await prisma.shiftSwapRequest.update({
            where: { id: requestId },
            data: { status: "REJECTED" },
        });

        logInfo(`Shift swap request rejected by admin ${session.id}`, { requestId });

        revalidatePath("/admin/shifts");
        return { success: true };
    } catch (error) {
        logError("Reject swap error", error);
        return { error: "Failed to reject swap" };
    }
}


export async function getOpenMarketplaceShifts() {
    return await prisma.shiftSwapRequest.findMany({
        where: { status: "OPEN" },
        include: {
            shift: true,
            requester: {
                select: { name: true, profilePicture: true, department: { select: { name: true } } }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function getBiddingShifts() {
    return await prisma.shift.findMany({
        where: { isBiddingOpen: true },
        include: {
            user: {
                select: { name: true, profilePicture: true }
            }
        },
        orderBy: { startTime: 'asc' }
    });
}

export async function getPendingSwapRequests() {
    return await prisma.shiftSwapRequest.findMany({
        where: { status: "PENDING_APPROVAL" },
        include: {
            shift: true,
            requester: {
                select: { name: true, profilePicture: true, department: { select: { name: true } } }
            },
            claimant: {
                select: { name: true, profilePicture: true, department: { select: { name: true } } }
            }
        },
        orderBy: { updatedAt: 'desc' }
    });
}

export async function getUserSwapRequests() {
    const session = await getAuth();
    if (!session) return [];

    return await prisma.shiftSwapRequest.findMany({
        where: {
            OR: [
                { requesterId: session.id },
                { claimantId: session.id }
            ]
        },
        include: {
            shift: true,
            requester: { select: { name: true } },
            claimant: { select: { name: true } }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
    });
}

