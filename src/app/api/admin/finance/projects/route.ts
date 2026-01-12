import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getAuth();
        if (!session || (session.role !== 'ADMIN' && session.role !== 'EXECUTIVE')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const projects = await prisma.project.findMany({
            include: {
                expenses: true,
                manager: { select: { name: true } }
            }
        });

        // Calculate totals
        const report = projects.map(project => {
            const totalExpenses = project.expenses.reduce((sum, exp) => sum + exp.amount, 0);
            // Assuming Project doesn't have a budget field yet, but Department does. 
            // If Project needs budget, we should have added it to schema. For now we just show expenses.
            return {
                id: project.id,
                title: project.title,
                status: project.status,
                manager: project.manager.name,
                totalExpenses,
                expenseCount: project.expenses.length,
                // budget: project.budget || 0 
            };
        });

        return NextResponse.json({ projects: report });

    } catch (error) {
        console.error("Error fetching project finance:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
