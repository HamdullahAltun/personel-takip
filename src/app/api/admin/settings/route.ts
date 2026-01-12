
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const settings = await prisma.companySettings.findFirst();
        return NextResponse.json(settings || {});
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { officeLat, officeLng, geofenceRadius } = body;

        // Update or Create (since we usually have 1)
        const first = await prisma.companySettings.findFirst();

        let settings;
        if (first) {
            settings = await prisma.companySettings.update({
                where: { id: first.id },
                data: { officeLat, officeLng, geofenceRadius }
            });
        } else {
            settings = await prisma.companySettings.create({
                data: { officeLat, officeLng, geofenceRadius }
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
}
