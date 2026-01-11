import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const risks = await prisma.attritionRisk.findMany({
            orderBy: { riskScore: 'desc' },
            include: { user: { select: { name: true, role: true, profilePicture: true } } }
        });

        const stats = {
            total: risks.length,
            highRisk: risks.filter(r => r.riskScore > 70).length
        };

        return NextResponse.json({ risks, stats });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
