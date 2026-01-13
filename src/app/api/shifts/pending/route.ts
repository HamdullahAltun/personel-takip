import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';

// Force TS re-check
export async function GET() {
    try {
        const session = await getAuth();
        if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const pendingSwaps = await prisma.shiftSwapRequest.findMany({
            where: {
                status: 'PENDING_APPROVAL'
            },
            include: {
                shift: true,
                requester: {
                    select: {
                        name: true,
                        department: { select: { name: true } }
                    }
                },
                claimant: {
                    select: {
                        name: true,
                        department: { select: { name: true } }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(pendingSwaps);
    } catch (error) {
        const { logError } = await import('@/lib/log-utils');
        await logError("Error fetching pending swaps", error);
        return NextResponse.json({ error: 'Failed to fetch pending swaps' }, { status: 500 });
    }
}
