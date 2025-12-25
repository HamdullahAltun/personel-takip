import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const token = (await cookies()).get('personel_token')?.value;
        const userPayload = token ? await verifyJWT(token) : null;

        const body = await req.json();
        let targetUserId = body.userId;
        const scannedContent = body.scannedContent; // "USER:..." or signed JWT
        const userLocation = body.location; // { lat, lng }

        // 1. Check for USER scan (Admin scanning Staff)
        // Can be "USER:ID" (Legacy) or Signed JWT
        let isUserScan = false;

        if (scannedContent && scannedContent.startsWith("USER:")) {
            isUserScan = true;
            targetUserId = scannedContent.split(":")[1];
        } else {
            // Try to decode as JWT to see if it's a USER_QR
            const payload = await verifyJWT(scannedContent) as any;
            if (payload && payload.type === 'USER_QR') {
                isUserScan = true;
                targetUserId = payload.userId;
            }
        }

        if (isUserScan) {
            if (userPayload?.role !== 'ADMIN') {
                return NextResponse.json({ error: 'Only admins can scan employee badges' }, { status: 403 });
            }
        }

        // 2. Check for OFFICE scan (Staff scanning Office)
        else {
            if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            targetUserId = userPayload.id;

            // Verify the signed QR content
            const qrPayload = await verifyJWT(scannedContent) as any;
            if (!qrPayload || qrPayload.type !== 'OFFICE_QR') {
                return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş QR Kod!' }, { status: 400 });
            }

            // Verify Co-location (Geofence)
            // If QR has location, we must be close to it
            if (qrPayload.location) {
                if (!userLocation || !userLocation.lat || !userLocation.lng) {
                    return NextResponse.json({ error: 'Konum verisi alınamadı. Lütfen GPS izni verin.' }, { status: 400 });
                }

                const distance = getDistanceInMeters(
                    qrPayload.location.lat,
                    qrPayload.location.lng,
                    userLocation.lat,
                    userLocation.lng
                );

                // Allow 200 meters tolerance (GPS drift + office size)
                if (distance > 200) {
                    return NextResponse.json({
                        error: `Ofis konumundan uzaktasınız! (${Math.round(distance)}m)`
                    }, { status: 400 });
                }
            } else {
                // Optional: If Admin didn't provide location, maybe we allow it or warn?
                // For strictness, if system demands location, we might fail here.
                // But user wanted "onay verilsin", so if QR lacks location, we might skip check?
                // Let's assume skip if admin has no GPS.
            }
        }

        const lastRecord = await prisma.attendanceRecord.findFirst({
            where: { userId: targetUserId },
            orderBy: { timestamp: 'desc' },
        });

        const isCheckedIn = lastRecord?.type === 'CHECK_IN';
        const newType = isCheckedIn ? 'CHECK_OUT' : 'CHECK_IN';

        // Fetch user details for the message
        const user = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { name: true }
        });
        const userName = user?.name || "";

        // Fetch Schedule for Late Check
        const today = new Date();
        const currentDayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // JS: 0=Sun, 6=Sat -> ISO: 1=Mon, 7=Sun

        const schedule = await prisma.workSchedule.findUnique({
            where: {
                userId_dayOfWeek: {
                    userId: targetUserId,
                    dayOfWeek: currentDayOfWeek
                }
            }
        });

        let isLate = false;
        if (newType === 'CHECK_IN' && schedule && !schedule.isOffDay) {
            const [schedHour, schedMin] = schedule.startTime.split(':').map(Number);
            const limitTime = new Date(today);
            limitTime.setHours(schedHour, schedMin + 15, 0, 0); // 15 mins tolerance

            if (today > limitTime) {
                isLate = true;
            }
        }

        await prisma.attendanceRecord.create({
            data: {
                userId: targetUserId,
                type: newType,
                method: 'QR',
                timestamp: today,
                isLate
            }
        });

        const isLateMessage = isLate ? " (Geç Kaldınız!)" : "";

        return NextResponse.json({
            success: true,
            type: newType,
            message: newType === 'CHECK_IN'
                ? `Hoş geldiniz, ${userName}${isLateMessage}`
                : `Güle güle, ${userName}`
        });

    } catch (error) {
        console.error('Attendance API Error:', error);
        return NextResponse.json({ error: 'İşlem başarısız.' }, { status: 500 });
    }
}

// Haversine Formula
function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
}
