import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');

    try {
        if (mode === 'resources') {
            const resources = await prisma.resource.findMany();
            return NextResponse.json(resources);
        }

        // Filter: Only future bookings
        try {
            const bookings = await prisma.booking.findMany({
                where: {
                    startTime: {
                        gte: new Date()
                    }
                },
                include: {
                    user: { select: { name: true } },
                    resource: { select: { name: true } }
                },
                orderBy: { startTime: 'asc' }
            });
            return NextResponse.json(bookings);
        } catch (e: any) {
            // Handle Prisma "Inconsistent query result" by cleaning orphans
            if (e.code === 'P2025' || e.message?.includes('Inconsistent query result')) {
                console.log("Cleaning up orphaned bookings...");

                // Fetch all data to verify integrity
                const allBookings = await prisma.booking.findMany();
                const allUsers = await prisma.user.findMany({ select: { id: true } });
                const allResources = await prisma.resource.findMany({ select: { id: true } });

                const userIds = new Set(allUsers.map(u => u.id));
                const resourceIds = new Set(allResources.map(r => r.id));

                // Identify orphans
                const orphans = allBookings
                    .filter(b => !userIds.has(b.userId) || !resourceIds.has(b.resourceId))
                    .map(b => b.id);

                if (orphans.length > 0) {
                    console.log(`Found ${orphans.length} orphaned bookings. Deleting... IDs: ${orphans.join(', ')}`);
                    await prisma.booking.deleteMany({ where: { id: { in: orphans } } });
                }

                // Retry fetch
                const bookings = await prisma.booking.findMany({
                    where: { startTime: { gte: new Date() } },
                    include: {
                        user: { select: { name: true } },
                        resource: { select: { name: true } }
                    },
                    orderBy: { startTime: 'asc' }
                });
                return NextResponse.json(bookings);
            }
            throw e;
        }
    } catch (error) {
        console.error("Booking API Error:", error);
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const { action } = body;

        if (action === 'CREATE_RESOURCE') {
            if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            const { name, type } = body;
            const resource = await prisma.resource.create({ data: { name, type } });
            return NextResponse.json(resource);
        }

        if (action === 'BOOK') {
            const { resourceId, startTime, endTime, purpose } = body;
            const start = new Date(startTime);
            const end = new Date(endTime);

            // Verify User Exists
            const userExists = await prisma.user.findUnique({ where: { id: session.id as string } });
            if (!userExists) {
                return NextResponse.json({ error: 'User does not exist in database' }, { status: 400 });
            }

            // Verify Resource Exists
            const resourceExists = await prisma.resource.findUnique({ where: { id: resourceId } });
            if (!resourceExists) {
                return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
            }

            // Check overlap
            const overlap = await prisma.booking.findFirst({
                where: {
                    resourceId,
                    OR: [
                        { startTime: { lt: end, gte: start } },
                        { endTime: { gt: start, lte: end } },
                        { startTime: { lte: start }, endTime: { gte: end } }
                    ]
                }
            });

            if (overlap) {
                return NextResponse.json({ error: 'Conflict' }, { status: 409 });
            }

            const booking = await prisma.booking.create({
                data: {
                    resourceId,
                    userId: session.id as string,
                    startTime: start,
                    endTime: end,
                    purpose
                }
            });
            return NextResponse.json(booking);
        }

        // DELETE BOOKING
        if (action === 'DELETE') {
            const { id } = body;
            if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

            const booking = await prisma.booking.findUnique({ where: { id } });
            if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

            if (session.role !== 'ADMIN' && booking.userId !== (session.id as string)) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }

            await prisma.booking.delete({ where: { id } });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}
