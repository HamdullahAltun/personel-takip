import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';
import EmployeeDetailClient from "./client";

import { calculateRiskProfile } from "@/lib/analytics-utils";

export default async function EmployeeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            department: true,
            attendance: { orderBy: { timestamp: 'desc' }, take: 50 },
            leaves: { orderBy: { createdAt: 'desc' } },
            achievements: { orderBy: { date: 'desc' } },
            shifts: {
                where: { startTime: { gte: new Date() } },
                orderBy: { startTime: 'asc' }
            },
            reviewsReceived: { orderBy: { createdAt: 'desc' }, take: 1 },
            posts: { take: 10 } // For risk calc
        }
    });

    const allUsers = await prisma.user.findMany({
        select: { id: true, name: true, role: true },
        orderBy: { name: 'asc' }
    });

    if (!user) notFound();

    // Calculate risk on the fly
    const riskProfile = calculateRiskProfile(user as any);

    return <EmployeeDetailClient user={user as any} riskProfile={riskProfile} allUsers={allUsers} />;
}
