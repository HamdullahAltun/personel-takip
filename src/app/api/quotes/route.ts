import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    try {
        // Simple logic: Get a random quote or one set for today
        // For now, let's just return a random active quote
        const count = await (prisma as any).motivationalQuote.count({ where: { isActive: true } });
        if (count === 0) {
            // Return default
            return NextResponse.json({
                quote: {
                    text: "Başarı, hazırlık ve fırsatın buluştuğu yerdir.",
                    author: "Bobby Unser"
                }
            });
        }

        const skip = Math.floor(Math.random() * count);
        const quote = await (prisma as any).motivationalQuote.findFirst({
            where: { isActive: true },
            skip
        });

        return NextResponse.json({ quote });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
