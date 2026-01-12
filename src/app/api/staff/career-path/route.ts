import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getAuth();
        if (!session || !session.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Use findFirst because email is not unique in schema
        const user = await prisma.user.findFirst({
            where: { email: session.email },
            include: {
                skillGaps: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Fetch all Career Paths
        const careerPaths = await prisma.careerPath.findMany({
            orderBy: { level: 'asc' }
        });

        return NextResponse.json({
            currentLevel: user.skillScore,
            skillGaps: user.skillGaps,
            careerPaths: careerPaths
        });

    } catch (error) {
        console.error("Error fetching career path:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
