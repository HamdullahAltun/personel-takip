import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const pendingLeaves = await prisma.leaveRequest.findMany({
            where: { status: "PENDING" },
            include: { user: true },
            orderBy: { createdAt: "desc" }
        });

        const pastLeaves = await prisma.leaveRequest.findMany({
            where: { status: { not: "PENDING" } },
            include: { user: true },
            orderBy: { createdAt: "desc" },
            take: 50
        });

        return NextResponse.json({ pendingLeaves, pastLeaves });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}
