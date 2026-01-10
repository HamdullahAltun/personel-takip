import { prisma } from "@/lib/prisma";
import { verifyJWT } from "@/lib/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        const token = (await cookies()).get("personel_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const payload = await verifyJWT(token);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const notifications = await (prisma as any).notification.findMany({
            where: {
                userId: payload.id as string
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20 // Limit to last 20
        });

        return NextResponse.json({ notifications });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const token = (await cookies()).get("personel_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const payload = await verifyJWT(token);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { id, type } = body; // type="single" or "all"

        if (type === 'all') {
            await (prisma as any).notification.updateMany({
                where: {
                    userId: payload.id as string,
                    read: false
                },
                data: {
                    read: true
                }
            });
        } else if (id) {
            await (prisma as any).notification.update({
                where: { id },
                data: { read: true }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const token = (await cookies()).get("personel_token")?.value;
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const payload = await verifyJWT(token);
        if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        await (prisma as any).notification.deleteMany({
            where: {
                userId: payload.id as string
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
