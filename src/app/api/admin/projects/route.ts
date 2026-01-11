import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const projects = await prisma.project.findMany({
            include: {
                manager: { select: { name: true, profilePicture: true } },
                _count: { select: { tasks: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(projects);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    // Only Admin/Executive or Manager can create projects? Let's say Admin/Exec for now
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const project = await prisma.project.create({
            data: {
                title: body.title,
                description: body.description,
                status: 'ACTIVE',
                managerId: session.id,
                members: body.members || [], // Array of User IDs
                // Create default columns
                columns: {
                    create: [
                        { title: 'Yapılacaklar', order: 0 },
                        { title: 'Devam Edenler', order: 1 },
                        { title: 'Tamamlananlar', order: 2 }
                    ]
                }
            }
        });

        return NextResponse.json(project);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
