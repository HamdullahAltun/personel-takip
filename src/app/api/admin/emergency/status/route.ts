import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const settings = await prisma.companySettings.findFirst() as any;
        return NextResponse.json({
            isEmergencyMode: settings?.isEmergencyMode || false,
            emergencyMessage: settings?.emergencyMessage
        });
    } catch (error) {
        return NextResponse.json({ isEmergencyMode: false });
    }
}
