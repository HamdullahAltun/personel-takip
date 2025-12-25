"use client";

import { useEffect, useState } from "react";
import { User, Trophy, Star, MessageSquareText, Briefcase, Phone, Calendar, Clock, MapPin, Award } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function UserProfilePage() {
    const params = useParams();
    const id = params?.id as string;

    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetch(`/api/users/${id}/profile`)
                .then(res => res.json())
                .then(data => {
                    if (!data.error) setUser(data);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }
    }, [id]);

    if (loading) return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>;
    if (!user) return <div className="p-8 text-center text-red-500">Kullanıcı bulunamadı.</div>;

    return (
        <div className="space-y-6 max-w-lg mx-auto pb-20">
            {/* Header Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div className="px-6 pb-6">
                    <div className="relative -mt-12 mb-4 flex justify-between items-end">
                        <div className="bg-white p-1.5 rounded-full shadow-lg">
                            <div className="bg-slate-100 p-4 rounded-full text-slate-500">
                                <User className="h-10 w-10" />
                            </div>
                        </div>
                        {user.isWorking ? (
                            <span className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200 shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                Şu an İşte
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
                                <Clock className="h-3 w-3" />
                                Mesai Dışı
                            </span>
                        )}
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                    <p className="text-slate-500 flex items-center gap-2 text-sm mt-1">
                        <Briefcase className="h-3 w-3" />
                        {user.role === 'ADMIN' ? 'Yönetici' : 'Personel'}
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-3">
                        <Link
                            href={`/messages/${user.id}`}
                            className="flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-medium shadow-sm hover:bg-blue-700 active:scale-[0.98] transition"
                        >
                            <MessageSquareText className="h-4 w-4" />
                            Mesaj Gönder
                        </Link>

                        <a
                            href={`tel:${user.phone}`}
                            className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 py-2.5 rounded-xl font-medium border border-slate-200 hover:bg-slate-200 active:scale-[0.98] transition"
                        >
                            <Phone className="h-4 w-4" />
                            Ara
                        </a>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-1 text-xs font-medium uppercase tracking-wider">
                        <Calendar className="h-3 w-3" />
                        Giriş Yılı
                    </div>
                    <p className="font-bold text-slate-900">
                        {new Date(user.createdAt).getFullYear()}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-500 mb-1 text-xs font-medium uppercase tracking-wider">
                        <MapPin className="h-3 w-3" />
                        Konum
                    </div>
                    <p className="font-bold text-slate-900">Merkez Ofis</p>
                </div>
            </div>

            {/* Achievements */}
            {user.achievements && user.achievements.length > 0 && (
                <div className="space-y-3">
                    <h3 className="font-bold text-slate-800 px-2 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Başarımlar ve Ödüller
                    </h3>
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
                        {user.achievements.map((ach: any) => (
                            <div key={ach.id} className="p-4 flex items-center gap-4">
                                <div className="bg-yellow-50 p-2.5 rounded-full text-yellow-600">
                                    <Star className="h-5 w-5 fill-current" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">{ach.title}</h4>
                                    <p className="text-slate-500 text-xs">{ach.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Employee of the Month */}
            {user.employeeOfTheMonths && user.employeeOfTheMonths.length > 0 && (
                <div className="space-y-3">
                    <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl border border-orange-200 shadow-sm p-4 flex items-center gap-4">
                        <div className="bg-white p-3 rounded-full shadow-sm text-orange-500">
                            <Award className="h-6 w-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-orange-900">Ayın Personeli</h4>
                            <p className="text-orange-700 text-sm">
                                {user.employeeOfTheMonths.length} kez seçildi
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
