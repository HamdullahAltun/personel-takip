import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJWT } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProfileView from "@/components/staff/ProfileView";

async function getUser() {
    const token = (await cookies()).get("personel_token")?.value;
    if (!token) return null;
    const payload = await verifyJWT(token);
    if (!payload?.id) return null;

    const user = await prisma.user.findUnique({
        where: { id: payload.id as string },
        include: {
            attendance: { orderBy: { timestamp: 'desc' } },
            achievements: { orderBy: { date: 'desc' } },
            shifts: {
                where: { startTime: { gte: new Date() } },
                orderBy: { startTime: 'asc' }
            },
            assets: true,
            documents: { orderBy: { uploadedAt: 'desc' } }
        }
    });
    return user as any;
}

export default async function ProfilePage() {
    const user = await getUser();

    if (!user) {
        redirect("/login");
    }

    return <ProfileView user={user} />;
}
