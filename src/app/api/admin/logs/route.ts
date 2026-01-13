import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getAuth } from '@/lib/auth';

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const level = searchParams.get('level');
        const search = searchParams.get('search');
        const skip = (page - 1) * limit;

        const where: Prisma.SystemLogWhereInput = {};
        if (level) where.level = level;
        if (search) {
            where.message = { contains: search, mode: 'insensitive' };
        }

        const [logs, total] = await Promise.all([
            prisma.systemLog.findMany({
                where,
                take: limit,
                skip: skip,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.systemLog.count({ where })
        ]);

        return NextResponse.json({
            logs,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
