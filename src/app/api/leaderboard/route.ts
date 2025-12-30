import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const users = await prisma.user.findMany({
            orderBy: [
                { points: 'desc' }, // Primary sort: Highest points first
                { name: 'asc' }     // Secondary sort: Alphabetical
            ],
            take: 50,
            select: {
                id: true,
                name: true,
                points: true,
                profilePicture: true,
                role: true
            }
        });
        return NextResponse.json(users);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userId, amount, reason } = await req.json();

    try {
        // Update user points
        const user = await prisma.user.update({
            where: { id: userId },
            data: { points: { increment: amount } }
            // Note: We could log this in a 'PointTransaction' table if we wanted history
        });

        // Add an Achievement log potentially if big points?
        if (reason) {
            await prisma.achievement.create({
                data: {
                    userId,
                    title: `Puan Kazanıldı: +${amount}`,
                    description: reason,
                    icon: 'award' // generic
                }
            });
        }

        return NextResponse.json(user);
    } catch (e) {
        return NextResponse.json({ error: "Failed to add points" }, { status: 500 });
    }
}
