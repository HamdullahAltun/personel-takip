import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { theme, accentColor } = await req.json();

        await prisma.user.update({
            where: { id: session.id as string },
            data: {
                ...(theme && { theme }),
                ...(accentColor && { accentColor })
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Theme update error:", error);
        return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 });
    }
}
