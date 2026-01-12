
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id } = await params;
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                manager: { select: { id: true, name: true, profilePicture: true } },
                columns: {
                    orderBy: { order: 'asc' },
                    include: {
                        tasks: {
                            orderBy: { createdAt: 'desc' },
                            include: {
                                assignedTo: { select: { id: true, name: true, profilePicture: true } }
                            }
                        }
                    }
                },
                // members: true - Removed as it is not a relation
            }
        });

        if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

        // Fetch full member details manually since members is an array of IDs
        const members = await prisma.user.findMany({
            where: {
                id: { in: project.members }
            },
            select: { id: true, name: true, profilePicture: true, role: true }
        });

        return NextResponse.json({ ...project, membersDetails: members });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
