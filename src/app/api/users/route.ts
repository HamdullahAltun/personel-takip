import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@/lib/auth';
import { logInfo } from '@/lib/log-utils';

// src/app/api/users/route.ts
export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const isManager = session.role === 'ADMIN' || session.role === 'EXECUTIVE';

        const { searchParams } = new URL(req.url);
        const sort = searchParams.get('sort');
        
        const pageParam = searchParams.get('page');
        const limitParam = searchParams.get('limit');

        // Base query - can be extended for filtering later
        const where: any = {}; 

        const selectOptions = isManager || sort === 'points' ? {
            id: true,
            name: true,
            phone: true,
            email: true,
            role: true,
            points: true,
            department: { select: { name: true } },
            profilePicture: true,
            createdAt: true, 
            hourlyRate: isManager, 
            weeklyGoal: isManager,
        } : {
            id: true,
            name: true,
            phone: true,
            role: true,
            profilePicture: true,
            department: { select: { name: true } },
            points: true
        };

        const paginatedParam = searchParams.get('paginated');

        // Check for specific pagination requirement
        const isPaginatedRequested = paginatedParam === 'true';

        // Base query options
        const queryOptions: any = {
            where,
            orderBy: sort === 'points' ? { points: 'desc' } : { createdAt: 'desc' },
            select: selectOptions as any
        };

        if (isPaginatedRequested) {
            const page = parseInt(pageParam || '1');
            const limit = parseInt(limitParam || '20');
            const skip = (page - 1) * limit;

            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    ...queryOptions,
                    skip,
                    take: limit,
                }),
                prisma.user.count({ where })
            ]);

            return NextResponse.json({
                data: users,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            });
        }

        // Default behavior: return array (respecting limit if provided, but still an array)
        if (limitParam) {
            queryOptions.take = parseInt(limitParam);
        }
        if (pageParam && limitParam) {
            queryOptions.skip = (parseInt(pageParam) - 1) * parseInt(limitParam);
        }

        const users = await prisma.user.findMany(queryOptions);
        return NextResponse.json(users);
    } catch (error) {
        const { logError } = await import('@/lib/log-utils');
        await logError("Fetch Users Error", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const { name, phone, email, role, hourlyRate, weeklyGoal } = body;

        if (!name || !phone) {
            return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
        }

        const existingUser = await prisma.user.findFirst({
            where: { 
                OR: [
                    { phone },
                    ...(email ? [{ email }] : [])
                ]
            },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User with this phone or email already exists' }, { status: 400 });
        }

        const user = await prisma.user.create({
            data: {
                name,
                phone,
                email: email || null,
                role: role || 'STAFF',
                hourlyRate: parseFloat(hourlyRate) || 0,
                weeklyGoal: parseInt(weeklyGoal) || 40,
            },
        });

        logInfo(`User ${user.id} created by admin ${session.id}`, { name: user.name, role: user.role });
        return NextResponse.json(user);
    } catch (error) {
        const { logError } = await import('@/lib/log-utils');
        await logError('Create User Error', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
