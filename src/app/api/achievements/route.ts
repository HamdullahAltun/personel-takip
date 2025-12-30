import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await getAuth();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userId, title, description, icon } = await req.json();

        if (!userId || !title) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const achievement = await prisma.achievement.create({
            data: {
                userId,
                title,
                description,
                icon: icon || "star"
            }
        });

        const { sendPushNotification } = await import("@/lib/notifications");
        sendPushNotification(userId, "Yeni Başarı Kazandın! 🏆", `Tebrikler! "${title}" başarısını kazandın.`).catch(console.error);

        return NextResponse.json(achievement);
    } catch (error) {
        return NextResponse.json({ error: "Failed to assign achievement" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    // Optional: Get all achievements for admin view
    try {
        const session = await getAuth();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Maybe fetch recent achievements?
        const achievements = await prisma.achievement.findMany({
            include: { user: { select: { name: true } } },
            orderBy: { date: 'desc' },
            take: 20
        });

        return NextResponse.json(achievements);
    } catch (error) {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getAuth();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await prisma.achievement.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
