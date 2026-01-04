import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { lat, lng } = await req.json();

    if (!lat || !lng) {
        return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    try {
        await (prisma.user as any).update({
            where: { id: session.id as string },
            data: {
                lastLat: lat,
                lastLng: lng,
                lastLocationUpdate: new Date(),
            }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating location:', error);
        return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
    }
}
