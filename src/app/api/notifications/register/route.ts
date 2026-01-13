import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { logInfo, logError } from '@/lib/log-utils';

export async function POST(req: Request) {
    try {
        const session = await getAuth();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { token } = await req.json();
        if (!token) {
            return NextResponse.json({ error: "Token required" }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: session.id },
            data: { fcmToken: token }
        });

        logInfo(`FCM Token registered for user ${session.id}`);
        return NextResponse.json({ success: true });

    } catch (error) {
        logError("Token Register Error", error);
        return NextResponse.json({ error: "Register failed" }, { status: 500 });
    }
}
