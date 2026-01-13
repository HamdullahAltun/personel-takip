import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { ShiftType, ShiftStatus } from "@prisma/client";
import { z } from "zod";
import { logInfo, logError } from "@/lib/log-utils";

const createShiftSchema = z.object({
    userId: z.string().optional(),
    startTime: z.string().or(z.date()).transform((val) => new Date(val)),
    endTime: z.string().or(z.date()).transform((val) => new Date(val)),
    type: z.nativeEnum(ShiftType).optional().default(ShiftType.REGULAR),
    title: z.string().optional(),
    notes: z.string().optional(),
    isOvertime: z.boolean().optional(),
});

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const userId = searchParams.get("userId");

    try {
        const where: any = {};

        if (start && end) {
            where.startTime = {
                gte: new Date(start),
                lte: new Date(end),
            };
        }

        // Admin/Executive can see all, Staff can only see theirs unless specified otherwise
        if (userId) {
            where.userId = userId;
        } else if (session.role === "STAFF") {
            where.userId = session.id;
        }

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
        logError("Failed to fetch shifts", error);
        return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const body = await req.json();
        const parseResult = createShiftSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json({ error: "Invalid input", details: parseResult.error.flatten() }, { status: 400 });
        }

        const { userId, startTime, endTime, type, title, notes, isOvertime } = parseResult.data;
        const targetUserId = userId || session.id;

        // Staff can only request overtime (creating DRAFT shift)
        if (session.role !== "ADMIN" && session.role !== "EXECUTIVE") {
            if (type !== ShiftType.OVERTIME) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const isManager = session.role === "ADMIN" || session.role === "EXECUTIVE";

        const shift = await prisma.shift.create({
            data: {
                userId: targetUserId,
                startTime: startTime,
                endTime: endTime,
                type: type,
                title,
                notes,
                isOvertime: isOvertime || type === ShiftType.OVERTIME,
                status: isManager ? ShiftStatus.PUBLISHED : ShiftStatus.DRAFT,
                approvedBy: isManager ? session.id : undefined,
                approvedAt: isManager ? new Date() : undefined,
            }
        });

        logInfo(`Shift created for ${targetUserId} by ${session.id}`, { shiftId: shift.id, type });

        return NextResponse.json(shift);
    } catch (error) {
        logError("Shift creation error", error);
        return NextResponse.json({ error: "Failed to create shift" }, { status: 500 });
    }
}
