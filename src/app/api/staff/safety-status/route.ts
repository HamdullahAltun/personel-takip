import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { status, lat, lng } = await req.json();

        const updateData: any = {
            safetyStatus: status,
            lastSafetyUpdate: new Date(),
        };

        if (lat && lng) {
            updateData.lastLat = lat;
            updateData.lastLng = lng;
            updateData.lastLocationUpdate = new Date();
        }

        await prisma.user.update({
            where: { id: session.id },
            data: updateData
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
