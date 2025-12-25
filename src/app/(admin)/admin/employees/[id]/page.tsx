import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EmployeeDetailClient from "./client";

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
    // Await params object before accessing properties
    const { id } = await Promise.resolve(params);

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
