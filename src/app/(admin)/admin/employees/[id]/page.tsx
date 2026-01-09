import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';
import EmployeeDetailClient from "./client";

export default async function EmployeeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            attendance: { orderBy: { timestamp: 'desc' }, take: 50 },
            leaves: { orderBy: { createdAt: 'desc' } },
            achievements: { orderBy: { date: 'desc' } },
            workSchedules: true,
            shifts: {
                where: { start: { gte: new Date() } },
                orderBy: { start: 'asc' }
            }
        }
    });

    if (!user) notFound();

    return <EmployeeDetailClient user={user} />;
}
