import { prisma } from "@/lib/prisma";
import { getAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Megaphone } from "lucide-react";

export default async function StaffAnnouncementsPage() {
    const session = await getAuth();
    if (!session) redirect("/login");

    const announcements = await prisma.announcement.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg">
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    <Megaphone className="h-6 w-6" />
                    Duyurular
                </h1>
                <p className="text-indigo-200 mt-2">Şirket içi güncel haberler ve bildirimler.</p>
            </div>

            <div className="grid gap-4">
                {announcements.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-100">
                        Henüz yayınlanmış bir duyuru yok.
                    </div>
                ) : announcements.map(ann => (
                    <div key={ann.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg text-slate-900">{ann.title}</h3>
                            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                                {new Date(ann.createdAt).toLocaleDateString('tr-TR')}
                            </span>
                        </div>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
