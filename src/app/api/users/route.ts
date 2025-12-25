import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const token = (await cookies()).get('personel_token')?.value;
        const payload = token ? await verifyJWT(token) : null;

        if (!payload) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const token = (await cookies()).get('personel_token')?.value;
        const payload = token ? await verifyJWT(token) : null;

        if (!payload || payload.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, phone, role, hourlyRate, weeklyGoal } = body;

        if (!name || !phone) {
            return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { phone },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User with this phone already exists' }, { status: 400 });
        }

        const user = await prisma.user.create({
            data: {
                name,
                phone,
                role: role || 'STAFF',
                hourlyRate: parseFloat(hourlyRate) || 0,
                weeklyGoal: parseInt(weeklyGoal) || 40,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error('Create User Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
