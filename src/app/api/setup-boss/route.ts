import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');

    // Super simple protection for this utility script
    if (secret !== 'make_me_boss') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const session = await getAuth();
    if (!session) {
        // Fallback: Promote the first user found or a specific phone
        // For now, let's just make the user with ID in query param boss, or the first user.
        return NextResponse.json({ error: 'Must be logged in to promote yourself (for safety)' }, { status: 401 });
    }

    const updatedUser = await prisma.user.update({
        where: { id: session.id as string },
        data: { role: 'EXECUTIVE' }
    });

    return NextResponse.json({ success: true, user: updatedUser, message: "You are now an Executive. Log out and back in." });
}
