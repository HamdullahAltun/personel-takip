import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Check if admin already exists to avoid overwriting or errors if not needed (though upsert handles this)
    const admin = await prisma.user.upsert({
        where: { phone: '5555555555' },
        update: {}, // No updates if exists
        create: {
            name: 'Admin',
            phone: '5555555555',
            role: 'ADMIN',
            hourlyRate: 0,
            weeklyGoal: 40
        },
    })
    console.log('Admin user seeded:', admin)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
