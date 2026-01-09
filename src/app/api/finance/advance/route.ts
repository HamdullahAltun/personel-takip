import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // If admin, show all pending (or filter by query). If staff, show own.
    const { searchParams } = new URL(req.url);
    const isAdmin = session.role === 'ADMIN' || session.role === 'EXECUTIVE';

    if (isAdmin) {
        const requests = await prisma.advanceRequest.findMany({
            include: { user: { select: { name: true, role: true } } },
            orderBy: { requestedAt: 'desc' }
        });
        return NextResponse.json(requests);
    } else {
        const requests = await prisma.advanceRequest.findMany({
            where: { userId: session.id },
            orderBy: { requestedAt: 'desc' }
        });
        return NextResponse.json(requests);
    }
}

export async function POST(req: Request) {
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { amount, reason } = await req.json();

    if (!amount || amount <= 0) {
        return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Check if user has active pending request
    const pending = await prisma.advanceRequest.findFirst({
        where: { userId: session.id, status: 'PENDING' }
    });

    if (pending) {
        return NextResponse.json({ error: "Onay bekleyen avans talebiniz zaten var." }, { status: 400 });
    }

    const request = await prisma.advanceRequest.create({
        data: {
            userId: session.id,
            amount,
            reason,
            status: 'PENDING'
        }
    });

    return NextResponse.json(request);
}

export async function PATCH(req: Request) {
    const session = await getAuth();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await req.json(); // APPROVED, REJECTED

    const request = await prisma.advanceRequest.update({
        where: { id },
        data: {
            status,
            processedAt: new Date()
        }
    });

    return NextResponse.json(request);
}
