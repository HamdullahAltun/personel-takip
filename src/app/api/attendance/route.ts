import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT, getAuth } from '@/lib/auth';
import { logInfo, logError } from '@/lib/log-utils';

export async function POST(req: Request) {
    try {
        const session = await getAuth();
        
        const body = await req.json();
        let targetUserId: string = body.userId;
        const scannedContent: string = body.scannedContent; // "USER:..." or signed JWT
        const userLocation: { lat: number, lng: number } | undefined = body.location; // { lat, lng }

        // 1. Check for USER scan (Admin scanning Staff)
        let isUserScan = false;

        if (scannedContent && scannedContent.startsWith("USER:")) {
            isUserScan = true;
            targetUserId = scannedContent.split(":")[1];
        } else {
            // Try to decode as JWT to see if it's a USER_QR
            const typeCastToken = scannedContent as string;
            const payload = await verifyJWT(typeCastToken);
            if (payload && payload.type === 'USER_QR') {
                isUserScan = true;
                targetUserId = payload.userId as string;
            }
        }

        if (isUserScan) {
            const scannedUser = await prisma.user.findUnique({
                where: { id: targetUserId },
                select: { role: true }
            });

            if (scannedUser?.role === 'ADMIN') {
                if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                targetUserId = session.id;
            } else {
                if (!session || session.role !== 'ADMIN') {
                    return NextResponse.json({ error: 'Only admins can scan employee badges' }, { status: 403 });
                }
            }
        }

        // 2. Check for OFFICE scan (Staff scanning Office)
        else {
            if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            targetUserId = session.id;

            // Verify the signed QR content
            const qrPayload = await verifyJWT(scannedContent);
            if (!qrPayload || qrPayload.type !== 'OFFICE_QR') {
                return NextResponse.json({ error: 'Geçersiz veya süresi dolmuş QR Kod!' }, { status: 400 });
            }

            const qrLocation = qrPayload.location as { lat: number, lng: number } | undefined;

            const companySettings = await prisma.companySettings.findFirst();

            if (companySettings) {
                if (companySettings.geofenceRadius > 0) {
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
                }
            } else if (qrLocation && userLocation?.lat) {
                const fakeDistance = getDistanceInMeters(qrLocation.lat, qrLocation.lng, userLocation.lat, userLocation.lng);
                if (fakeDistance > 200) {
                    return NextResponse.json({ error: 'Konum doğrulanamadı (Ofis QR konumundan uzak).' }, { status: 400 });
                }
            }
        }

        const lastRecord = await prisma.attendanceRecord.findFirst({
            where: { userId: targetUserId },
            orderBy: { timestamp: 'desc' },
        });

        const isCheckedIn = lastRecord?.type === 'CHECK_IN';
        const newType = isCheckedIn ? 'CHECK_OUT' : 'CHECK_IN';

        const user = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { name: true }
        });
        const userName = user?.name || "";

        // Fetch Schedule (Shift) for Late Check
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const currentShift = await prisma.shift.findFirst({
            where: {
                userId: targetUserId,
                startTime: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        let isLate = false;
        if (newType === 'CHECK_IN' && currentShift) {
            const limitTime = new Date(currentShift.startTime);
            limitTime.setMinutes(limitTime.getMinutes() + 15); // 15 mins tolerance

            if (today.getTime() > limitTime.getTime()) {
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

        logInfo(`Attendance ${newType} recorded for ${userName}`, { targetUserId, isLate });

        // Update User's last known location
        if (userLocation && userLocation.lat && userLocation.lng) {
            await prisma.user.update({
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
            checkAndAwardBadges(targetUserId, 'ATTENDANCE_CHECKIN').catch(e => logError("Gamification error", e));
        }

        return NextResponse.json({
            success: true,
            type: newType,
            message: newType === 'CHECK_IN'
                ? `Hoş geldiniz, ${userName}${isLateMessage}`
                : `Güle güle, ${userName}`
        });

    } catch (error) {
        logError('Attendance API Error', error);
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
        logError("Attendance GET Error", error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
