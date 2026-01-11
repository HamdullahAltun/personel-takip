import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { title, body, targetUserId } = await req.json();

        if (targetUserId) {
            const { createNotification } = await import("@/lib/notifications");
            await createNotification(targetUserId, title, body, 'INFO');
        } else {
            const { sendBroadcastNotification } = await import("@/lib/notifications");
            await sendBroadcastNotification(title, body);
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
