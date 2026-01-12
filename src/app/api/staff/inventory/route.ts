import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getAuth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { itemName, quantity, reason } = body;

        const request = await prisma.inventoryRequest.create({
            data: {
                userId: session.id as string,
                itemName,
                quantity: parseInt(quantity) || 1,
                reason,
                status: "PENDING"
            }
        });

        return NextResponse.json(request);
    } catch (error) {
        console.error("Error creating inventory request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getAuth();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const requests = await prisma.inventoryRequest.findMany({
            where: { userId: session.id as string },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error("Error fetching inventory requests:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
