
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const departments = await prisma.department.findMany({
        include: {
            _count: {
                select: { users: true }
            }
        }
    });

    return NextResponse.json(departments);
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, budgetLimit, managerName } = await req.json();

    const dept = await prisma.department.create({
        data: {
            name,
            budgetLimit,
            managerName
        }
    });

    return NextResponse.json(dept);
}

export async function PUT(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id, name, budgetLimit, managerName } = await req.json();

        const dept = await prisma.department.update({
            where: { id },
            data: {
                name,
                budgetLimit,
                managerName
            }
        });

        return NextResponse.json(dept);
    } catch (e) {
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await req.json();

        // Check if users exist
        const dept = await prisma.department.findUnique({
            where: { id },
            include: { _count: { select: { users: true } } }
        });

        if (dept && dept._count.users > 0) {
            return NextResponse.json({ error: "Bu departmanda çalışanlar var. Önce çalışanları taşıyın." }, { status: 400 });
        }

        await prisma.department.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
