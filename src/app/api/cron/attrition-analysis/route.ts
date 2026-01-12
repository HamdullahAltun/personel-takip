import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeSentiment } from '@/lib/ai';

export const dynamic = 'force-dynamic'; // Ensure it runs dynamically

/**
 * CRON JOB: Calculates Attrition Risk based on:
 * 1. Sentiment Analysis of recent messages
 * 2. Team Mood entries
 * 3. Recent Poll Votes (if any)
 * 4. Absenteeism (Attendance)
 */
export async function GET(req: Request) {
    // Basic security: Check for a secret header or assume internal call (in Vercel Cron)
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { return NextResponse.json({ error: 'Unauthorized' }, { status: 401 }); }

    try {
        const users = await prisma.user.findMany({
            where: { role: 'STAFF' },
            include: {
                sentMessages: { take: 10, orderBy: { createdAt: 'desc' } },
                moods: { take: 5, orderBy: { createdAt: 'desc' } },
                attendance: { take: 10, orderBy: { timestamp: 'desc' } }
            }
        });

        let updatedCount = 0;

        for (const user of users) {
            let riskScore = 0; // 0-100
            const factors: string[] = [];

            // 1. Mood Analysis
            if (user.moods.length > 0) {
                const recentMoods = user.moods.map(m => m.mood);
                const badMoods = recentMoods.filter(m => ['SAD', 'TIRED', 'ANGRY'].includes(m)).length;
                if (badMoods > 2) {
                    riskScore += 20;
                    factors.push("Frequent Negative Mood");
                }
            }

            // 2. Message Sentiment Analysis (Sample one latest message for efficiency)
            if (user.sentMessages.length > 0) {
                const latestMsg = user.sentMessages[0].content || "";
                if (latestMsg.length > 10) {
                    const sentiment = await analyzeSentiment(latestMsg);
                    if (sentiment.label === 'NEGATIVE') {
                        riskScore += 15;
                        factors.push("Negative Communication Style");
                    }

                    // Store sentiment log
                    await prisma.sentimentLog.create({
                        data: {
                            userId: user.id,
                            type: 'MESSAGE',
                            score: sentiment.score,
                            // @ts-ignore
                            label: sentiment.label,
                            sourceId: user.sentMessages[0].id
                        }
                    });
                }
            }

            // 3. Attendance / Lateness
            const lateArrivals = user.attendance.filter(a => a.isLate).length;
            if (lateArrivals > 3) {
                riskScore += 25;
                factors.push("Frequent Lateness");
            }

            // Cap at 100
            riskScore = Math.min(100, riskScore);

            // Update or Create Risk Profile
            if (riskScore > 0) {
                await prisma.attritionRisk.upsert({
                    where: { userId: user.id },
                    create: {
                        userId: user.id,
                        riskScore,
                        factors: factors
                    },
                    update: {
                        riskScore,
                        factors: factors
                    }
                });
                updatedCount++;
            }
        }

        return NextResponse.json({ success: true, analysisCount: users.length, updatedCount });

    } catch (e: any) {
        console.error("Attrition Analysis Failed", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
