import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Reset all staff safety status to UNKNOWN (or DANGER if preferred for alert)
        // Usually, we set to UNKNOWN so everyone has to check in.
        const updateResult = await prisma.user.updateMany({
            where: { role: 'STAFF' },
            data: {
                safetyStatus: 'UNKNOWN',
                lastSafetyUpdate: new Date()
            }
        });

        // 2. Create a System Log / Announcement
        await prisma.announcement.create({
            data: {
                title: "🔴 ACİL DURUM ALARMI",
                content: "Tüm personelin dikkatine! Acil durum ilanı yapılmıştır. Lütfen 'Güvendeyim' veya 'Tehlikedeyim' bildirimi yapınız.",
                isActive: true
            }
        });

        // 3. (Optional) Trigger Push Notifications via FCM if configured
        // ... FCM logic ...

        return NextResponse.json({
            success: true,
            message: "Emergency broadcast sent",
            affectedUsers: updateResult.count
        });

    } catch (e: any) {
        console.error("Broadcast Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
