import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const checklists = await (prisma.checklist as any).findMany({ include: { items: true } });
    return NextResponse.json(checklists);
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, type, items } = await req.json();

    const checklist = await (prisma.checklist as any).create({
        data: {
            title,
            type,
            items: {
                create: items.map((i: any) => ({ task: i.task, category: i.category }))
            }
        },
        include: { items: true }
    });

    return NextResponse.json(checklist);
}
