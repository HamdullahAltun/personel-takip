import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, getAuth } from '@/lib/auth';
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
            // Check if the scanned QR belongs to an ADMIN
            // We need to fetch the role of the targetUserId (the user in the QR)
            const scannedUser = await prisma.user.findUnique({
                where: { id: targetUserId },
                select: { role: true }
            });

            if (scannedUser?.role === 'ADMIN' || scannedUser?.role === 'admin') {
                // If scanning an Admin, we treat this as the Scanner checking themselves in
                // So targetUserId becomes the UserPayload.id (the one holding the phone)
                if (!userPayload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                targetUserId = userPayload.id;

                // We implicitly allow this as a valid location/check-in
            } else {
                // Determine if the *Scanner* is allowed to scan *someone else*
                if (userPayload?.role !== 'ADMIN') {
                    return NextResponse.json({ error: 'Only admins can scan employee badges' }, { status: 403 });
                }
                // If Scanner is Admin, they are checking in the Target (Staff) -> continue
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
            // If the QR is confirmed as OFFICE_QR, we fetch the golden source of truth from DB
            const companySettings = await prisma.companySettings.findFirst();

            // If settings exist, enforce them. If not, fallback or skip (depending on strictness preference).
            // Here we assume if settings exist, we MUST enforce.
            if (companySettings) {
                if (!userLocation || !userLocation.lat || !userLocation.lng) {
                    return NextResponse.json({ error: 'Konum verisi alınamadı. Lütfen GPS izni verin.' }, { status: 400 });
                }

                const distance = getDistanceInMeters(
                    companySettings.officeLat,
                    companySettings.officeLng,
                    userLocation.lat,
                    userLocation.lng
                );

                if (distance > companySettings.geofenceRadius) {
                    return NextResponse.json({
                        error: `Ofis konumundan uzaktasınız! (${Math.round(distance)}m > ${companySettings.geofenceRadius}m)`
                    }, { status: 400 });
                }
            } else {
                // Legacy Fallback if CompanySettings table is empty: 
                // Rely on QR Payload if it has location, otherwise skip.
                if (qrPayload.location) {
                    const fakeDistance = getDistanceInMeters(qrPayload.location.lat, qrPayload.location.lng, userLocation?.lat || 0, userLocation?.lng || 0);
                    if (fakeDistance > 200) {
                        return NextResponse.json({ error: 'Konum doğrulanamadı (Legacy).' }, { status: 400 });
                    }
                }
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

        // Update User's last known location
        if (userLocation && userLocation.lat && userLocation.lng) {
            await (prisma.user as any).update({
                where: { id: targetUserId },
                data: {
                    lastLat: userLocation.lat,
                    lastLng: userLocation.lng,
                    lastLocationUpdate: today
                }
            });
        }

        const isLateMessage = isLate ? " (Geç Kaldınız!)" : "";

        // Gamification Trigger
        if (newType === 'CHECK_IN') {
            const { checkAndAwardBadges } = await import('@/lib/gamification');
            // Fire and forget to not block response
            checkAndAwardBadges(targetUserId, 'ATTENDANCE_CHECKIN').catch(console.error);
        }

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

export async function GET(req: Request) {
    try {
        const session = await getAuth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        let userId = searchParams.get('userId');

        // Security Check: If not admin, can only view own records
        if (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE') {
            if (userId && userId !== session.id) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            userId = session.id as string;
        }
        const dateStr = searchParams.get('date');

        // Date handling
        let dateFilter = {};
        if (dateStr) {
            // Assume user sends YYYY-MM-DD. 
            // We want full UTC day.
            const start = new Date(dateStr);
            start.setHours(0, 0, 0, 0);
            const end = new Date(dateStr);
            end.setHours(23, 59, 59, 999);

            dateFilter = {
                gte: start,
                lte: end
            };
        }

        const records = await prisma.attendanceRecord.findMany({
            where: {
                ...(dateStr ? { timestamp: dateFilter } : {}),
                ...(userId ? { userId: userId } : {})
            },
            include: {
                user: {
                    select: { name: true, role: true }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: 200
        });

        return NextResponse.json(records);

    } catch (error) {
        console.error("Attendance GET Error:", error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
