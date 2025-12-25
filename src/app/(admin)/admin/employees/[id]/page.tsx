import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EmployeeDetailClient from "./client";

export default async function EmployeeDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    console.log("Fetching employee details for:", id);

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            attendance: { orderBy: { timestamp: 'desc' }, take: 50 },
            leaves: { orderBy: { createdAt: 'desc' } }
        }
    });

    if (!user) notFound();

    return <EmployeeDetailClient user={user} />;
}
