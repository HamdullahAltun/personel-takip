"use server";

// Re-generating types...


import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

async function getSession() {
    const token = (await cookies()).get("personel_token")?.value;
    if (!token) return null;
    return await verifyJWT(token);
}

export async function createSwapRequest(shiftId: string, reason: string) {
    const session = await getSession();
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
                requesterId: session.id as string,
                reason,
                status: "OPEN",
            },
        });

        revalidatePath("/shifts");
        return { success: true };
    } catch (error) {
        console.error("Create swap error:", error);
        return { error: "Failed to create request" };
    }
}

export async function claimSwapRequest(requestId: string) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    try {
        const request = await prisma.shiftSwapRequest.findUnique({
            where: { id: requestId },
        });

        if (!request || request.status !== "OPEN") {
            return { error: "Request unavailable" };
        }

        if (request.requesterId === session.id) {
            return { error: "Cannot claim your own shift" };
        }

        await prisma.shiftSwapRequest.update({
            where: { id: requestId },
            data: {
                claimantId: session.id as string,
                status: "PENDING_APPROVAL",
            },
        });

        revalidatePath("/shifts");
        return { success: true };
    } catch (error) {
        console.error("Claim swap error:", error);
        return { error: "Failed to claim shift" };
    }
}

export async function approveSwapRequest(requestId: string) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    const admin = await prisma.user.findUnique({ where: { id: session.id as string } });
    if (!admin || admin.role !== 'ADMIN') return { error: "Forbidden" };

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
        console.error("Approve swap error:", error);
        return { error: "Failed to approve swap" };
    }
}

export async function rejectSwapRequest(requestId: string) {
    const session = await getSession();
    if (!session) return { error: "Unauthorized" };

    try {
        await prisma.shiftSwapRequest.update({
            where: { id: requestId },
            data: { status: "REJECTED" },
        });

        revalidatePath("/admin/shifts");
        return { success: true };
    } catch (error) {
        console.error("Reject swap error:", error);
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
    const session = await getSession();
    if (!session) return [];

    return await prisma.shiftSwapRequest.findMany({
        where: {
            OR: [
                { requesterId: session.id as string },
                { claimantId: session.id as string }
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
