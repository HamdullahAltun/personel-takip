import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { format, startOfWeek, endOfWeek } from 'date-fns';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const today = new Date();
        const start = startOfWeek(today, { weekStartsOn: 1 });
        const end = endOfWeek(today, { weekStartsOn: 1 });

        const [activities, challenges] = await Promise.all([
            prisma.wellnessActivity.findMany({
                where: {
                    userId: session.id,
                    date: { gte: start, lte: end }
                },
                orderBy: { date: 'desc' }
            }),
            prisma.wellnessChallenge.findMany({
                where: { isActive: true },
                take: 3
            })
        ]);

        return NextResponse.json({ activities, challenges });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const activity = await prisma.wellnessActivity.create({
            data: {
                userId: session.id,
                type: body.type,
                value: parseFloat(body.value),
                unit: body.unit,
                date: new Date()
            }
        });

        // Award small points for logging (Gamification)
        await prisma.user.update({
            where: { id: session.id },
            data: { points: { increment: 5 } }
        });


        // CHECK CHALLENGES
        // Find active challenges for this type
        const challenges = await prisma.wellnessChallenge.findMany({
            where: {
                isActive: true,
                type: body.type,
                startDate: { lte: new Date() },
                endDate: { gte: new Date() }
            }
        });

        for (const challenge of challenges) {
            // Sum total for this user in period
            const result = await prisma.wellnessActivity.aggregate({
                where: {
                    userId: session.id,
                    type: body.type,
                    date: { gte: challenge.startDate, lte: challenge.endDate }
                },
                _sum: { value: true }
            });

            const total = result._sum.value || 0;
            if (total >= challenge.targetValue) {
                // Check if already notified/completed (using Participants array as completed list or verify via Notification)
                // Using participants list to track completion for now if simple
                const isCompleted = challenge.participants.includes(session.id as string);
                if (!isCompleted) {
                    // Mark as participant/completed
                    await prisma.wellnessChallenge.update({
                        where: { id: challenge.id },
                        data: { participants: { push: session.id as string } }
                    });

                    // Send Congrats Notification
                    await prisma.notification.create({
                        data: {
                            userId: session.id as string,
                            title: "Challenge Tamamlandı! 🎉",
                            message: `Tebrikler! ${challenge.title} hedefine ulaştın.`,
                            type: "SUCCESS"
                        }
                    });

                    // Award Points
                    await prisma.user.update({
                        where: { id: session.id as string },
                        data: { points: { increment: 50 } } // Default 50pts for challenge
                    });
                }
            }
        }

        return NextResponse.json(activity);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
