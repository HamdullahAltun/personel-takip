import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const departments = await prisma.department.findMany({ include: { _count: { select: { users: true } } } });
    return NextResponse.json(departments);
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, budgetLimit, managerName } = await req.json();

    const department = await prisma.department.create({
        data: { name, budgetLimit, managerName }
    });

    return NextResponse.json(department);
}
