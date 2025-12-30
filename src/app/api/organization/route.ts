import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                role: true, // Defines title effectively
                profilePicture: true,
                managerId: true
            }
        });
        return NextResponse.json(users);
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch org chart" }, { status: 500 });
    }
}
