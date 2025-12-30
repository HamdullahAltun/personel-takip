import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    try {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1; // 1-12

        const record = await prisma.employeeOfTheMonth.findFirst({
            where: {
                month: currentMonth,
                year: currentYear
            },
            include: {
                user: {
                    select: {
                        name: true,
                        achievements: true, // Maybe we want to show their badges too
                        role: true
                    }
                }
            }
        });

        return NextResponse.json(record);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getAuth();
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userId, note } = await req.json();
        const date = new Date();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        // Check if exists, update or create
        const record = await prisma.employeeOfTheMonth.upsert({
            where: {
                month_year: { month, year } // Composite unique key usage
            },
            update: {
                userId,
                note
            },
            create: {
                userId,
                month,
                year,
                note
            }
        });

        const { sendPushNotification } = await import("@/lib/notifications");
        sendPushNotification(userId, "Ayın Elemanı Seçildin! 🌟", `Tebrikler! Bu ayın elemanı seçildin. ${note ? `Not: ${note}` : ""}`).catch(console.error);

        // Optional: Broadcast to everyone else?
        // const { sendBroadcastNotification } = await import("@/lib/notifications");
        // sendBroadcastNotification("Ayın Elemanı Belli Oldu! 🌟", "Uygulamaya girip kimin seçildiğini gör!");

        return NextResponse.json(record);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to set employee of the month" }, { status: 500 });
    }
}
