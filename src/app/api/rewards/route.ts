import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getAuth();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rewards = await prisma.reward.findMany({
            where: { isActive: true },
            orderBy: { cost: 'asc' }
        });

        return NextResponse.json(rewards);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    // Admin only: Create Reward
    try {
        const session = await getAuth();
        if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { title, description, cost, stock, image } = body;

        const reward = await prisma.reward.create({
            data: {
                title,
                description,
                cost: parseInt(cost),
                stock: parseInt(stock),
                image
            }
        });

        return NextResponse.json(reward);
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getAuth();
        if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

        await prisma.reward.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
