import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    // Admin assigns checklist to user
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, checklistId } = await req.json();

    if (!userId || !checklistId) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if already assigned active? (Optional, skipping for simplicity)

    const assignment = await prisma.checklistAssignment.create({
        data: {
            userId,
            checklistId,
            progress: {},
            status: 'IN_PROGRESS'
        }
    });

    // Notify User
    try {
        const { sendPushNotification } = await import('@/lib/notifications');
        await sendPushNotification(userId, "Yeni Görev Listesi 📋", "Onboarding/Offboarding süreci atandı.");
    } catch (e) {
        // ignore
    }

    return NextResponse.json(assignment);
}
