import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    // Define filter
    let where: any = {};

    if (userId) {
        // Requesting specific user's goals
        if (session.role !== 'ADMIN' && userId !== session.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        where.userId = userId;
    } else {
        // No specific user requested
        if (session.role === 'ADMIN') {
            // Admin sees all (limit to recent maybe?)
            // No strict filter on userId
        } else {
            // Staff only sees their own
            where.userId = session.id;
        }
    }

    const goals = await prisma.goal.findMany({
        where,
        include: { user: { select: { name: true } } }, // Include user name for context
        orderBy: { dueDate: 'asc' },
        take: 50 // Limit results regarding performance
    });

    return NextResponse.json(goals);
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { title, description, dueDate, userId } = await req.json();

        // Only admin can assign to others, users assign to self? 
        // Let's allow users to create their own goals for now.
        const targetUserId = userId || session.id;

        if (session.role !== 'ADMIN' && targetUserId !== session.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const goal = await prisma.goal.create({
            data: {
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
                userId: targetUserId
            }
        });

        return NextResponse.json(goal);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
    }
}
