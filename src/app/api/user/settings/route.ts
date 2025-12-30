import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { theme, accentColor } = await req.json();

    const updated = await (prisma as any).user.update({
        where: { id: session.id as string },
        data: { theme, accentColor }
    });

    return NextResponse.json(updated);
}
