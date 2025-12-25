import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const token = (await cookies()).get('personel_token')?.value;
        const payload = token ? await verifyJWT(token) : null;

        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;
        const body = await req.json();
        const { name, phone, role, hourlyRate, weeklyGoal } = body;

        const user = await prisma.user.update({
            where: { id },
            data: {
                name,
                phone,
                role,
                hourlyRate: parseFloat(hourlyRate),
                weeklyGoal: parseInt(weeklyGoal),
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const token = (await cookies()).get('personel_token')?.value;
        const payload = token ? await verifyJWT(token) : null;

        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await context.params;

        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
