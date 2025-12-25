import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getAuth();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const { id } = await params;

        await prisma.achievement.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
