import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getAuth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    if (session.role !== "ADMIN" && session.role !== "EXECUTIVE") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const shift = await prisma.shift.update({
            where: { id },
            data: {
                ...body,
                updatedAt: new Date()
            }
        });
        return NextResponse.json(shift);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update shift" }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getAuth();
    if (!session || (session.role !== "ADMIN" && session.role !== "EXECUTIVE")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await prisma.shift.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete shift" }, { status: 500 });
    }
}
