"use client";

import { useState, useEffect } from "react";
import { UserX, Search, ShieldAlert, Archive, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OffboardingPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [step, setStep] = useState(1); // 1: Select, 2: Assets, 3: Checklist, 4: Confirm
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Mock checklist for now
    const [checklist, setChecklist] = useState([
        { id: 1, text: "E-posta hesabı kapatıldı", checked: false },
        { id: 2, text: "VPN erişimi iptal edildi", checked: false },
        { id: 3, text: "Ofis anahtarı/kartı teslim alındı", checked: false },
        { id: 4, text: "Slack/Teams hesabından çıkarıldı", checked: false },
    ]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const res = await fetch("/api/users");
        if (res.ok) setUsers(await res.json());
    };

    const fetchUserAssets = async (userId: string) => {
        setLoading(true);
        // Mock fetch assets for now, replace with real API
        // const res = await fetch(`/api/assets?userId=${userId}`);
        // if(res.ok) setAssets(await res.json());

        // Simulating assets
        setTimeout(() => {
            setAssets([
                { id: 'a1', name: 'MacBook Pro M2', type: 'LAPTOP', serial: 'C02...', status: 'ASSIGNED' },
                { id: 'a2', name: 'iPhone 14', type: 'PHONE', serial: 'IMEI...', status: 'ASSIGNED' }
            ]);
            setLoading(false);
        }, 500);
    };

    const handleUserSelect = (user: any) => {
        setSelectedUser(user);
        fetchUserAssets(user.id);
        setStep(2);
    };

    const handleAssetReturn = (assetId: string) => {
        setAssets(assets.map(a => a.id === assetId ? { ...a, status: 'RETURNED' } : a));
    };

    const handleChecklistToggle = (id: number) => {
        setChecklist(checklist.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
    };

    const handleCompleteOffboarding = async () => {
        if (!confirm("Bu personeli arşivlemek istediğinize emin misiniz?")) return;

        // API call to archive user
        // await fetch(`/api/users/${selectedUser.id}/archive`, { method: 'POST' });

        alert("Personel başarıyla işten çıkarıldı ve arşivlendi.");
        setStep(1);
        setSelectedUser(null);
    };

    const filteredUsers = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <UserX className="text-red-600" />
                        Offboarding (Çıkış İşlemleri)
                    </h1>
                    <p className="text-slate-500">Personel çıkış sürecini güvenli ve eksiksiz yönetin.</p>
                </div>
            </div>

            {/* Stepper */}
            {selectedUser && (
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 overflow-x-auto">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold min-w-fit",
                            step === s ? "bg-red-50 text-red-600" : step > s ? "text-green-600" : "text-slate-400"
                        )}>
                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs border-2",
                                step === s ? "border-red-600 bg-red-600 text-white" : step > s ? "border-green-600 bg-green-600 text-white" : "border-slate-300"
                            )}>
                                {step > s ? <CheckCircle2 className="w-3 h-3" /> : s}
                            </div>
                            {s === 1 ? "Personel Seçimi" : s === 2 ? "Zimmet İade" : s === 3 ? "Erişim İptali" : "Onay & Arşiv"}
                        </div>
                    ))}
                </div>
            )}

            {step === 1 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                            placeholder="İsim ile personel ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredUsers.map(user => (
                            <button
                                key={user.id}
                                onClick={() => handleUserSelect(user)}
                                className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-red-200 hover:bg-red-50 transition text-left group"
                            >
                                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-lg font-bold text-slate-500 group-hover:bg-white group-hover:text-red-500 transition">
                                    {user.profilePicture ? <img src={user.profilePicture} className="w-full h-full object-cover rounded-full" /> : user.name[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{user.name}</h3>
                                    <p className="text-xs text-slate-500">{user.role}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 2 && selectedUser && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Archive className="text-amber-500" />
                            Zimmet İadeleri
                        </h2>
                        <p className="text-sm text-slate-500 mb-6">Personelin üzerindeki zimmetlerin iadesini alın.</p>

                        {loading ? <div className="p-10 text-center">Yükleniyor...</div> : (
                            <div className="space-y-3">
                                {assets.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl">Zimmet bulunamadı.</div>
                                ) : assets.map(asset => (
                                    <div key={asset.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50">
                                        <div>
                                            <h4 className="font-bold text-slate-900">{asset.name}</h4>
                                            <p className="text-xs text-slate-500">Seri No: {asset.serial}</p>
                                        </div>
                                        {asset.status === 'RETURNED' ? (
                                            <span className="text-green-600 font-bold text-xs bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> İade Alındı
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleAssetReturn(asset.id)}
                                                className="text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-lg text-xs font-bold transition"
                                            >
                                                İade Al
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => setStep(3)}
                                disabled={assets.some(a => a.status !== 'RETURNED')}
                                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                            >
                                Sonraki Adım <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && selectedUser && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <ShieldAlert className="text-indigo-500" />
                        Erişim İptalleri
                    </h2>
                    <div className="space-y-4 mb-8">
                        {checklist.map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleChecklistToggle(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-4 p-4 rounded-xl border transition text-left",
                                    item.checked ? "bg-green-50 border-green-200" : "bg-white border-slate-200 hover:border-indigo-200"
                                )}
                            >
                                <div className={cn("w-6 h-6 rounded border-2 flex items-center justify-center transition",
                                    item.checked ? "bg-green-500 border-green-500 text-white" : "border-slate-300"
                                )}>
                                    {item.checked && <CheckCircle2 className="w-4 h-4" />}
                                </div>
                                <span className={cn("font-medium", item.checked ? "text-green-700" : "text-slate-700")}>{item.text}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button onClick={() => setStep(2)} className="text-slate-500 font-bold px-4">Geri</button>
                        <button
                            onClick={() => setStep(4)}
                            disabled={!checklist.every(i => i.checked)}
                            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
                        >
                            Sonraki Adım <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {step === 4 && selectedUser && (
                <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center max-w-lg mx-auto">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                        <AlertTriangle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Çıkış İşlemini Onayla</h2>
                    <p className="text-slate-500 mb-8">
                        <b>{selectedUser.name}</b> isimli personelin tüm hakları geri alınacak, hesap arşivlenecek ve sisteme girişi engellenecektir. Bu işlem geri alınamaz.
                    </p>

                    <button
                        onClick={handleCompleteOffboarding}
                        className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 shadow-lg shadow-red-200 transition"
                    >
                        Evet, İşlemi Tamamla
                    </button>
                    <button onClick={() => setStep(3)} className="mt-4 text-slate-400 font-bold hover:text-slate-600">Geri Dön</button>
                </div>
            )}
        </div>
    );
}
