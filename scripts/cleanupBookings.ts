
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting cleanup of orphaned bookings...');

    // 1. Fetch all bookings
    const bookings = await prisma.booking.findMany();
    console.log(`Found ${bookings.length} total bookings.`);

    if (bookings.length === 0) {
        console.log('No bookings to check.');
        return;
    }

    // 2. Extract unique User IDs and Resource IDs referenced in bookings
    const bookedUserIds = new Set(bookings.map(b => b.userId));
    const bookedResourceIds = new Set(bookings.map(b => b.resourceId));

    // 3. Find which of these IDs actually exist in the database
    const validUsers = await prisma.user.findMany({
        where: {
            id: { in: Array.from(bookedUserIds) }
        },
        select: { id: true }
    });
    const validUserIds = new Set(validUsers.map(u => u.id));

    const validResources = await prisma.resource.findMany({
        where: {
            id: { in: Array.from(bookedResourceIds) }
        },
        select: { id: true }
    });
    const validResourceIds = new Set(validResources.map(r => r.id));

    // 4. Identify orphaned bookings
    const bookingsToDelete = bookings.filter(booking => {
        const userExists = validUserIds.has(booking.userId);
        const resourceExists = validResourceIds.has(booking.resourceId);

        if (!userExists) {
            console.log(`Booking ${booking.id} is orphaned: User ${booking.userId} does not exist.`);
        }
        if (!resourceExists) {
            console.log(`Booking ${booking.id} is orphaned: Resource ${booking.resourceId} does not exist.`);
        }

        return !userExists || !resourceExists;
    });

    console.log(`Found ${bookingsToDelete.length} orphaned bookings.`);

    if (bookingsToDelete.length > 0) {
        const deleteIds = bookingsToDelete.map(b => b.id);
        const result = await prisma.booking.deleteMany({
            where: {
                id: { in: deleteIds }
            }
        });
        console.log(`Successfully deleted ${result.count} orphaned bookings.`);
    } else {
        console.log('No orphaned bookings found.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
