import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getAuth();
        if (!session || typeof session.id !== 'string') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { token } = await req.json();
        if (!token) {
            return NextResponse.json({ error: "Token required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.id as string }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        await prisma.user.update({
            where: { id: session.id as string },
            data: { fcmToken: token }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Token Register Error:", error);
        return NextResponse.json({ error: "Register failed" }, { status: 500 });
    }
}
