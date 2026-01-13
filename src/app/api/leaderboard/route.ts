import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { logInfo, logError } from '@/lib/log-utils';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const users = await prisma.user.findMany({
            orderBy: [
                { points: 'desc' },
                { name: 'asc' }
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
        logError("Failed to fetch leaderboard", e);
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        logInfo("Leaderboard POST: Unauthorized attempt");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { userId, amount, reason } = body;
        const pointsToAdd = Math.floor(Number(amount));

        if (!userId || isNaN(pointsToAdd) || pointsToAdd <= 0) {
            logInfo("Leaderboard POST: Invalid fields", { userId, amount });
            return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
        }

        logInfo(`Adding ${pointsToAdd} points to user ${userId}`);


        // Update user points
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                points: { increment: pointsToAdd }
            }
        });

        logInfo("User points updated", { userId, pointsAdded: pointsToAdd });

        if (reason) {
            await prisma.achievement.create({
                data: {
                    userId,
                    title: `Puan Kazanıldı: +${pointsToAdd}`,
                    description: reason,
                    icon: 'award'
                }
            });
        }

        revalidatePath('/admin/leaderboard');
        return NextResponse.json(user);

    } catch (e: unknown) {
        logError("Leaderboard POST error", e);
        return NextResponse.json({ error: "Failed to add points" }, { status: 500 });
    }
}
