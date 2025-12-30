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

        if (mode === 'my-bookings') {
            const bookings = await prisma.booking.findMany({
                where: {
                    userId: session.id as string,
                    // return recent history + futures
                    // startTime: { gte: new Date(Date.now() - 86400000) } 
                },
                include: { resource: { select: { name: true, type: true } } },
                orderBy: { startTime: 'desc' },
                take: 50
            });
            return NextResponse.json(bookings);
        }

        // Filter: Only future ACTIVE bookings
        try {
            const bookings = await prisma.booking.findMany({
                where: {
                    startTime: { gte: new Date() },
                    status: { not: 'CANCELLED' }
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

        if (action === 'UPDATE_RESOURCE') {
            if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            const { id, name, type } = body;
            const resource = await prisma.resource.update({ where: { id }, data: { name, type } });
            return NextResponse.json(resource);
        }

        if (action === 'DELETE_RESOURCE') {
            if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            const { id } = body;

            // Delete all bookings associated with this resource first
            await prisma.booking.deleteMany({ where: { resourceId: id } });

            await prisma.resource.delete({ where: { id } });
            return NextResponse.json({ success: true });
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

            // Check overlap (excluding CANCELLED)
            const overlap = await prisma.booking.findFirst({
                where: {
                    resourceId,
                    status: { not: 'CANCELLED' }, // Ignore cancelled bookings
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
                    purpose,
                    status: 'CONFIRMED'
                }
            });
            return NextResponse.json(booking);
        }

        // CANCEL / DELETE BOOKING
        if (action === 'DELETE' || action === 'CANCEL') {
            const { id, reason } = body;
            if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

            const booking = await prisma.booking.findUnique({ where: { id } });
            if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

            const isAdmin = session.role === 'ADMIN';
            const isOwner = booking.userId === (session.id as string);

            if (!isAdmin && !isOwner) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }

            // If Admin, they can provide a reason and it's a cancellation
            // If Staff, they are just cancelling their own
            await prisma.booking.update({
                where: { id },
                data: {
                    status: 'CANCELLED',
                    cancellationReason: reason || (isOwner ? 'Kullanıcı tarafından iptal edildi' : 'Yönetici tarafından iptal edildi')
                }
            });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid Action' }, { status: 400 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}
