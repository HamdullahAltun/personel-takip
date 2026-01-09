import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
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
    if (!session || session.role !== 'ADMIN') {
        console.log("Leaderboard POST: Unauthorized access attempt");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Leaderboard POST body:", body);
    const { userId, amount, reason } = body;

    const pointsToAdd = Math.floor(Number(amount));

    if (!userId || isNaN(pointsToAdd) || pointsToAdd <= 0) {
        console.log("Leaderboard POST: Invalid fields", { userId, amount });
        return NextResponse.json({ error: "Invalid fields: userId required, amount must be a positive number" }, { status: 400 });
    }

    try {
        // Update user points
        console.log(`Updating points for user ${userId}. Adding ${pointsToAdd}.`);
        const user = await prisma.user.update({
            where: { id: userId },
            data: { points: { increment: pointsToAdd } }
        });
        console.log("User updated:", user);

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

        revalidatePath('/admin/leaderboard');
        return NextResponse.json(user);
    } catch (e) {
        console.error("Leaderboard POST error:", e);
        return NextResponse.json({ error: "Failed to add points" }, { status: 500 });
    }
}
