import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const total = await prisma.message.count();
        if (total === 0) return NextResponse.json({ positive: 0, negative: 0, neutral: 0, average: 0 });

        const positive = await prisma.message.count({ where: { sentimentLabel: 'POSITIVE' } });
        const negative = await prisma.message.count({ where: { sentimentLabel: 'NEGATIVE' } });
        const neutral = await prisma.message.count({ where: { sentimentLabel: 'NEUTRAL' } });

        const avg = await prisma.message.aggregate({
            _avg: { sentimentScore: true }
        });

        // Get Top Negative Senders (for HR intervention)
        // GroupBy is tricky in Prisma + Mongo sometimes, so be careful.
        // We'll just fetch negative and manual process for top list if needed, but for now stats are enough.

        return NextResponse.json({
            total,
            distribution: { positive, negative, neutral },
            averageScore: avg._avg.sentimentScore || 0
        });

    } catch (e) {
        return NextResponse.json({ error: "Failed to aggregation sentiment" }, { status: 500 });
    }
}
