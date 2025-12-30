import { prisma } from "@/lib/prisma";
import { User, Phone, Mail, Linkedin, MapPin, Globe } from "lucide-react";

export default async function PublicCardPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    const user = await prisma.user.findUnique({
        where: { id: params.id },
        select: {
            name: true,
            role: true,
            phone: true,
            email: true,
            profilePicture: true,
            // Assuming we might have these fields in future, for now fallback
        }
    });

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-400">
                Kişi bulunamadı.
            </div>
        );
    }

    const roleName = user.role === 'ADMIN' ? 'Yönetici' : user.role === 'EXECUTIVE' ? 'Üst Yönetici' : 'Personel';

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full rounded-3xl shadow-2xl overflow-hidden relative">
                {/* Background Pattern */}
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_50%_120%,#fff,transparent)]" />
                </div>

                <div className="px-6 pb-8 relative">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg absolute -top-12 left-6">
                        <div className="w-full h-full rounded-full bg-slate-50 flex items-center justify-center overflow-hidden">
                            {user.profilePicture ? (
                                <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="h-10 w-10 text-slate-300" />
                            )}
                        </div>
                    </div>

                    <div className="mt-14 mb-6">
                        <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                        <p className="text-indigo-600 font-medium">{roleName}</p>
                        <p className="text-sm text-slate-500 mt-1">Personel Takip A.Ş.</p>
                    </div>

                    <div className="space-y-4">
                        <a href={`tel:${user.phone}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-green-500">
                                <Phone className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Telefon</p>
                                <p className="text-sm font-semibold text-slate-900">{user.phone}</p>
                            </div>
                        </a>

                        {user.email && (
                            <a href={`mailto:${user.email}`} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-red-500">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">E-posta</p>
                                    <p className="text-sm font-semibold text-slate-900">{user.email}</p>
                                </div>
                            </a>
                        )}

                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-500">
                                <Globe className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Web Sitesi</p>
                                <p className="text-sm font-semibold text-slate-900">personel.sirket.com</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
                        <button className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold text-sm shadow-xl active:scale-95 transition-transform flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Rehbere Ekle
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
