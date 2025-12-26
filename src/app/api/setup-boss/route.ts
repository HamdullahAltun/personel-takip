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

    let userId = session?.id as string;

    // Optional: Allow promoting by phone number via query param
    const phone = searchParams.get('phone');
    if (phone) {
        const u = await prisma.user.findUnique({ where: { phone } });
        if (u) userId = u.id;
    }

    // Fallback: If we still don't have a valid ID (session might be stale/deleted user), just promote the very first user in the DB.
    // This ensures the script works even if the session is broken.
    if (!userId) {
        const firstUser = await prisma.user.findFirst();
        if (firstUser) {
            userId = firstUser.id;
        } else {
            return NextResponse.json({ error: 'No users found in database to promote.' }, { status: 404 });
        }
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: 'EXECUTIVE' }
    });

    return NextResponse.json({ success: true, user: updatedUser, message: "You are now an Executive. Log out and back in." });
}
