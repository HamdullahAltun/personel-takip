import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const count = await prisma.message.count({
            where: {
                receiverId: session.id as string,
                read: false
            }
        });

        return NextResponse.json({ count });
    } catch (error) {
        return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }
}
