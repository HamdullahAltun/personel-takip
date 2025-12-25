const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const phone = "5300176328";

    // Try to find user first
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { phone: phone },
                { phone: "+90" + phone }
            ]
        }
    });

    if (user) {
        const updated = await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' },
        });
        console.log(`User ${updated.phone} role updated to ADMIN`);
    } else {
        // If not exists, create it
        const created = await prisma.user.create({
            data: {
                phone: phone,
                name: "Admin User",
                role: "ADMIN"
            }
        });
        console.log(`Created new ADMIN user: ${created.phone}`);
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
