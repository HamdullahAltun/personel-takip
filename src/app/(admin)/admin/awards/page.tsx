"use client";

import { useState, useEffect } from 'react';
import { Trophy, Star, Medal, Award, UserCheck, Trash2 } from 'lucide-react';

type User = {
    id: string;
    name: string;
    role: string;
};

type EmployeeOfMonth = {
    userId: string;
    month: number;
    year: number;
    user: User;
    note?: string;
};

export default function AwardsPage() {
    const [activeTab, setActiveTab] = useState<'EOM' | 'ACHIEVEMENT'>('EOM');

    // Data
    const [users, setUsers] = useState<User[]>([]);
    const [currentEOM, setCurrentEOM] = useState<EmployeeOfMonth | null>(null);

    // EOM Form
    const [selectedUserEOM, setSelectedUserEOM] = useState("");
    const [eomNote, setEomNote] = useState("");

    // Achievement Form
    const [selectedUserAch, setSelectedUserAch] = useState("");
    const [achTitle, setAchTitle] = useState("");
    const [achDesc, setAchDesc] = useState("");
    const [achIcon, setAchIcon] = useState("star");

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Init Load
        fetchUsers();
        fetchCurrentEOM();
    }, []);

    const fetchUsers = async () => {
        const res = await fetch('/api/users');
        if (res.ok) setUsers(await res.json());
    };

    const fetchCurrentEOM = async () => {
        const res = await fetch('/api/employee-of-month');
        if (res.ok) setCurrentEOM(await res.json());
    };

    const handleSetEOM = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/employee-of-month', {
                method: 'POST',
                body: JSON.stringify({ userId: selectedUserEOM, note: eomNote }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                fetchCurrentEOM();
                alert("Ayın personeli seçildi!");
            }
        } catch {
            alert("Hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    const handleAssignAchievement = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/achievements', {
                method: 'POST',
                body: JSON.stringify({
                    userId: selectedUserAch,
                    title: achTitle,
                    description: achDesc,
                    icon: achIcon
                }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                setAchTitle("");
                setAchDesc("");
                alert("Başarım verildi!");
            }
        } catch {
            alert("Hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-yellow-100 rounded-lg">
                    <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Ödül ve Başarımlar</h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('EOM')}
                    className={`pb-3 px-1 font-medium transition-all ${activeTab === 'EOM' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    Ayın Personeli
                </button>
                <button
                    onClick={() => setActiveTab('ACHIEVEMENT')}
                    className={`pb-3 px-1 font-medium transition-all ${activeTab === 'ACHIEVEMENT' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    Başarım Ver
                </button>
            </div>

            {activeTab === 'EOM' && (
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Current EOM Display */}
                    <div className="bg-gradient-to-br from-yellow-500 to-amber-600 text-white p-8 rounded-2xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-20">
                            <Trophy className="h-32 w-32" />
                        </div>
                        <h2 className="text-xl font-medium text-yellow-100 mb-2 flex justify-between items-center">
                            Ayın Personeli
                            {currentEOM && (
                                <button
                                    onClick={async () => {
                                        if (!confirm("Ayın personelini kaldırmak istiyor musunuz?")) return;
                                        await fetch('/api/employee-of-month/delete', { method: 'DELETE' });
                                        fetchCurrentEOM();
                                    }}
                                    className="bg-red-500/20 hover:bg-red-500/40 text-white p-1 rounded transition"
                                    title="Seçimi Kaldır"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            )}
                        </h2>
                        {currentEOM ? (
                            <div>
                                <h3 className="text-4xl font-bold mb-4">{currentEOM.user.name}</h3>
                                <p className="text-white/80 italic">"{currentEOM.note || 'Tebrikler!'}"</p>
                                <div className="mt-6 flex items-center gap-2 text-sm bg-white/20 w-fit px-3 py-1 rounded-full">
                                    <Star className="h-4 w-4" />
                                    <span>{new Date().toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-yellow-100">
                                <h3 className="text-2xl font-bold opacity-50">Henüz Seçilmedi</h3>
                                <p className="mt-2">Bu ay için bir personel seçin.</p>
                            </div>
                        )}
                    </div>

                    {/* Selection Form */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 text-slate-800">Seçim Yap</h3>
                        <form onSubmit={handleSetEOM} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Personel</label>
                                <select
                                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                                    value={selectedUserEOM}
                                    onChange={e => setSelectedUserEOM(e.target.value)}
                                    required
                                >
                                    <option value="">Seçiniz...</option>
                                    {users.filter(u => u.role !== 'ADMIN').map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Not / Mesaj</label>
                                <textarea
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    rows={3}
                                    placeholder="Neden seçildi? Tebrik mesajı..."
                                    value={eomNote}
                                    onChange={e => setEomNote(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 text-white py-2 rounded-lg hover:bg-slate-800 transition"
                            >
                                {loading ? "Kaydediliyor..." : "Kaydet ve Yayınla"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {activeTab === 'ACHIEVEMENT' && (
                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Achievement Form */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                            <Medal className="h-6 w-6 text-purple-600" />
                            Yeni Başarım Tanımla
                        </h3>

                        <form onSubmit={handleAssignAchievement} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Personel</label>
                                <select
                                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                                    value={selectedUserAch}
                                    onChange={e => setSelectedUserAch(e.target.value)}
                                    required
                                >
                                    <option value="">Seçiniz...</option>
                                    {users.filter(u => u.role !== 'ADMIN').map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Başarım Adı</label>
                                    <input
                                        className="w-full border border-slate-300 rounded-lg p-2"
                                        placeholder="Örn: Hızlı Çözümcü"
                                        value={achTitle}
                                        onChange={e => setAchTitle(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">İkon</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                                        value={achIcon}
                                        onChange={e => setAchIcon(e.target.value)}
                                    >
                                        <option value="star">Yıldız</option>
                                        <option value="trophy">Kupa</option>
                                        <option value="medal">Madalya</option>
                                        <option value="thumbsUp">Beğeni</option>
                                        <option value="zap">Yıldırım</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
                                <textarea
                                    className="w-full border border-slate-300 rounded-lg p-2"
                                    rows={2}
                                    placeholder="Başarımın detayı..."
                                    value={achDesc}
                                    onChange={e => setAchDesc(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
                            >
                                {loading ? "Veriliyor..." : "Başarımı Ver"}
                            </button>
                        </form>
                    </div>

                    {/* Recent Achievements List */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 text-slate-800">Son Verilen Başarımlar</h3>
                        <AchievementList key={loading ? 'loading' : 'loaded'} />
                    </div>
                </div>
            )}
        </div>
    );
}

function AchievementList() {
    const [achievements, setAchievements] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/achievements').then(r => r.json()).then(setAchievements);
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Bu başarımı silmek istediğinize emin misiniz?")) return;
        const res = await fetch(`/api/achievements?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
            setAchievements(prev => prev.filter(a => a.id !== id));
        }
    };

    if (achievements.length === 0) return <p className="text-slate-400 text-sm">Henüz başarım verilmemiş.</p>;

    return (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {achievements.map((ach) => (
                <div key={ach.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:border-purple-200 transition">
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg shadow-sm text-purple-600">
                            {ach.icon === 'star' && <Star className="h-4 w-4" />}
                            {ach.icon === 'trophy' && <Trophy className="h-4 w-4" />}
                            {ach.icon === 'medal' && <Medal className="h-4 w-4" />}
                            {ach.icon === 'thumbsUp' && <Award className="h-4 w-4" />}
                            {ach.icon === 'zap' && <Award className="h-4 w-4" />}
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm">{ach.title}</p>
                            <p className="text-xs text-slate-500">{ach.user.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleDelete(ach.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="Sil"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ))}
        </div>
    );
}
