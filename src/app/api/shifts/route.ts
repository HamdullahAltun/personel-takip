import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { ShiftType, ShiftStatus } from "@prisma/client";

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const userId = searchParams.get("userId");

    const where: any = {};

    if (start && end) {
        where.startTime = {
            gte: new Date(start),
            lte: new Date(end),
        };
    }

    // Admin can see all, Staff can only see theirs unless specified otherwise
    if (userId) {
        where.userId = userId;
    } else if (session.role === "STAFF") {
        where.userId = session.id;
    }

    try {
        const shifts = await prisma.shift.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        profilePicture: true,
                        department: { select: { name: true } }
                    }
                }
            },
            orderBy: { startTime: 'asc' }
        });
        return NextResponse.json(shifts);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { userId, startTime, endTime, type, title, notes, isOvertime } = body;

    // Staff can only request overtime (creating DRAFT shift)
    if (session.role !== "ADMIN" && session.role !== "EXECUTIVE") {
        if (type !== ShiftType.OVERTIME) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }

    try {
        const shift = await prisma.shift.create({
            data: {
                userId: userId || session.id,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                type: (type as ShiftType) || ShiftType.REGULAR,
                title,
                notes,
                isOvertime: isOvertime || type === ShiftType.OVERTIME,
                status: (session.role === "ADMIN" || session.role === "EXECUTIVE") ? ShiftStatus.PUBLISHED : ShiftStatus.DRAFT,
                approvedBy: (session.role === "ADMIN" || session.role === "EXECUTIVE") ? session.id : undefined,
                approvedAt: (session.role === "ADMIN" || session.role === "EXECUTIVE") ? new Date() : undefined,
            }
        });
        return NextResponse.json(shift);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create shift" }, { status: 500 });
    }
}
