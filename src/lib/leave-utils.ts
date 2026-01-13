import { prisma } from "./prisma";

/**
 * Adjusts the user's annual leave days budget when a request status changes.
 */
export async function adjustLeaveBudget(userId: string, startDate: Date, endDate: Date, action: 'DEDUCT' | 'REFUND') {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (action === 'DEDUCT') {
        await prisma.user.update({
            where: { id: userId },
            data: { annualLeaveDays: { decrement: days } }
        });
    } else {
        await prisma.user.update({
            where: { id: userId },
            data: { annualLeaveDays: { increment: days } }
        });
    }
}
