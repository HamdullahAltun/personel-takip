import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // If Admin, return everything (or maybe still exclude some internals?)
        // For now, let's keep it consistent: Admin sees all, Staff sees directory info.

        const isManager = session.role === 'ADMIN' || session.role === 'EXECUTIVE';

        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: isManager ? undefined : {
                id: true,
                name: true,
                phone: true, // Maybe needed for contact?
                role: true,
                profilePicture: true,
                department: { select: { name: true } }
            }
        });

        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
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
