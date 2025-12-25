import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EmployeeDetailClient from "./client";

type Props = {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function EmployeeDetailPage(props: Props) {
    const params = await props.params;
    const { id } = params;
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
