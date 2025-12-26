import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { id: session.id as string },
        select: { id: true, name: true, role: true, profilePicture: true }
    });

    return NextResponse.json({ user });
}
