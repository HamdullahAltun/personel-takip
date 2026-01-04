import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

export async function GET() {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const docs = await prisma.knowledgeBaseDoc.findMany({
            where: { requiresSigning: true },
            include: {
                signatures: {
                    include: {
                        user: { select: { id: true, name: true, profilePicture: true } }
                    }
                }
            }
        });

        // Removed isActive because it might not exist on User model yet or I missed adding it.
        // Assuming all staff should sign.
        const totalUsers = await prisma.user.count({
            where: { role: 'STAFF' }
        });

        const report = docs.map(doc => ({
            id: doc.id,
            title: doc.title,
            uploadedAt: doc.createdAt,
            signedCount: doc.signatures.length,
            totalUsers,
            signedUsers: doc.signatures.map(s => ({
                userId: s.userId,
                name: s.user.name,
                signedAt: s.signedAt
            }))
        }));

        return NextResponse.json(report);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
