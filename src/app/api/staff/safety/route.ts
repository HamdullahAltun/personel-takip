import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { status } = await req.json(); // SAFE, DANGER
        const user = await prisma.user.update({
            where: { id: (session as any).user.id },
            data: {
                safetyStatus: status,
                lastSafetyUpdate: new Date()
            }
        });

        // Send Notification to Admins if DANGER
        if (status === 'DANGER') {
            const admins = await prisma.user.findMany({
                where: { role: 'ADMIN', fcmToken: { not: null } },
                select: { id: true }
            });

            const { sendPushNotification } = await import('@/lib/notifications');
            for (const admin of admins) {
                await sendPushNotification(
                    admin.id,
                    "🚨 ACİL DURUM BİLDİRİMİ",
                    `${user.name} acil durum butonuna bastı! Lütfen kontrol edin.`,
                    { url: '/admin/emergency' }
                );
            }
        }

        return NextResponse.json(user);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to update safety status' }, { status: 500 });
    }
}
