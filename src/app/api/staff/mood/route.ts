import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const token = (await cookies()).get("personel_token")?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const payload = await verifyJWT(token);
        if (!payload) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { mood, note } = body;

        if (!mood) {
            return NextResponse.json({ error: "Mood is required" }, { status: 400 });
        }

        // Allow one mood per day per user? or multiple?
        // Let's create a new record.
        const newMood = await (prisma as any).teamMood.create({
            data: {
                userId: payload.id as string,
                mood,
                note
            }
        });

        return NextResponse.json({ success: true, mood: newMood });

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        // Get today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const moods = await (prisma as any).teamMood.findMany({
            where: {
                createdAt: {
                    gte: today
                }
            },
            include: {
                user: {
                    select: {
                        name: true,
                        profilePicture: true
                    }
                }
            }
        });

        // Aggregate stats
        const stats: Record<string, number> = {
            happy: 0,
            neutral: 0,
            sad: 0,
            tired: 0,
            motivated: 0
        };

        moods.forEach((m: any) => {
            const key = m.mood.toLowerCase();
            if (stats[key] !== undefined) {
                stats[key]++;
            }
        });

        const total = moods.length;
        const percentages = Object.keys(stats).reduce((acc, key) => {
            acc[key] = total > 0 ? Math.round((stats[key] / total) * 100) : 0;
            return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({ moods, stats, percentages, total });

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
