import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { createNotification, sendBroadcastNotification } from '@/lib/notifications';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { isEmergency, message } = await req.json();

        // 1. Update Company Settings
        const settings = await prisma.companySettings.findFirst();
        if (settings) {
            await (prisma.companySettings as any).update({
                where: { id: settings.id },
                data: {
                    isEmergencyMode: isEmergency,
                    emergencyMessage: message || (isEmergency ? "ACİL DURUM! Lütfen durumunuzu bildirin." : null)
                }
            });
        }

        // 2. If Emergency ORANGE/RED - Reset everyone's status to HELP_NEEDED or UNKNOWN
        if (isEmergency) {
            await prisma.user.updateMany({
                where: { role: 'STAFF' },
                data: { safetyStatus: 'HELP_NEEDED' }
            });

            // 3. Send Broadcast Notification
            await sendBroadcastNotification(
                "🚨 ACİL DURUM BİLDİRİMİ",
                message || "Bir acil durum ilan edildi. Lütfen uygulamaya girip durumunuzu bildirin!"
            );
        } else {
            // Reset to SAFE when emergency is over
            await prisma.user.updateMany({
                where: { role: 'STAFF' },
                data: { safetyStatus: 'SAFE' }
            });
        }

        return NextResponse.json({ success: true, isEmergencyMode: isEmergency });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
