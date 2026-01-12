
"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Award, Target, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { User, CareerPath, Goal } from "@prisma/client";

type GoalWithUser = Goal & { user: { name: string } };

export default function CareerPage() {
    const [loading, setLoading] = useState(true);

    // Data
    const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
    const [goals, setGoals] = useState<GoalWithUser[]>([]);
    const [users, setUsers] = useState<User[]>([]);

    // Modals
    const [showPathModal, setShowPathModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);

    // Forms
    const [newPath, setNewPath] = useState({ title: "", level: 1, requiredSkills: "" });
    const [newGoal, setNewGoal] = useState({ title: "", description: "", dueDate: "", userId: "" });

    useEffect(() => {
        fetchData();
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            setUsers(await res.json());
        } catch { }
    };

    const fetchData = async () => {
        try {
            const [pathRes, goalRes] = await Promise.all([
                fetch('/api/admin/career'),
                fetch('/api/goals')
            ]);

            if (pathRes.ok) setCareerPaths(await pathRes.json());
            if (goalRes.ok) setGoals(await goalRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePath = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const skills = newPath.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
            const res = await fetch('/api/admin/career', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newPath, requiredSkills: skills })
            });
            if (res.ok) {
                toast.success("Kariyer yolu eklendi");
                setShowPathModal(false);
                setNewPath({ title: "", level: 1, requiredSkills: "" });
                fetchData();
            }
        } catch {
            toast.error("Hata oluştu");
        }
    };

    const handleDeletePath = async (id: string) => {
        if (!confirm("Silmek istediğinize emin misiniz?")) return;

        try {
            await fetch('/api/admin/career', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            toast.success("Silindi");
            fetchData();
        } catch {
            toast.error("Hata oluştu");
        }
    };

    const handleCreateGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newGoal)
            });
            if (res.ok) {
                toast.success("Hedef atandı");
                setShowGoalModal(false);
                setNewGoal({ title: "", description: "", dueDate: "", userId: "" });
                fetchData();
            }
        } catch {
            toast.error("Hata oluştu");
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Kariyer & Hedef Yönetimi</h1>
                    <p className="text-slate-500">Kariyer yolları oluşturun ve çalışan hedeflerini takip edin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* CAREER PATHS SECTION */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="text-indigo-600" />
                            Kariyer Yolları
                        </h2>
                        <button onClick={() => setShowPathModal(true)} className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition">
                            + Yeni Ekle
                        </button>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        {careerPaths.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">Henüz kariyer yolu tanımlanmamış.</div>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                                    <tr>
                                        <th className="p-4">Seviye</th>
                                        <th className="p-4">Unvan</th>
                                        <th className="p-4">Gerekli Yetkinlikler</th>
                                        <th className="p-4 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {careerPaths.map(path => (
                                        <tr key={path.id} className="hover:bg-slate-50">
                                            <td className="p-4 font-bold text-slate-600 text-center bg-slate-50/50 w-16">{path.level}</td>
                                            <td className="p-4 font-medium text-slate-900">{path.title}</td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {path.requiredSkills.map((skill, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-semibold">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <button onClick={() => handleDeletePath(path.id)} className="text-slate-400 hover:text-red-500">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* GOALS SECTION */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Target className="text-green-600" />
                            Personel Hedefleri
                        </h2>
                        <button onClick={() => setShowGoalModal(true)} className="text-sm font-bold text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg transition">
                            + Hedef Ata
                        </button>
                    </div>

                    <div className="space-y-3">
                        {goals.length === 0 ? (
                            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">Henüz hedef atanmamış.</div>
                        ) : (
                            goals.map(goal => (
                                <div key={goal.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-900">{goal.title}</h3>
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${goal.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                goal.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                                            }`}>
                                            {goal.status === 'IN_PROGRESS' ? 'Sürüyor' : goal.status === 'COMPLETED' ? 'Tamamlandı' : 'Beklemede'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-3">{goal.description}</p>
                                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                                {goal.user?.name?.[0]}
                                            </div>
                                            <span className="font-semibold">{goal.user?.name}</span>
                                        </div>
                                        {goal.dueDate && (
                                            <span>Son: {new Date(goal.dueDate).toLocaleDateString("tr-TR")}</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Path Modal */}
            {showPathModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-in zoom-in-95">
                        <h2 className="text-lg font-bold mb-4">Yeni Kariyer Yolu</h2>
                        <form onSubmit={handleCreatePath} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Unvan</label>
                                <input required className="w-full border rounded-lg p-2" value={newPath.title} onChange={e => setNewPath({ ...newPath, title: e.target.value })} placeholder="Örn: Senior Developer" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Seviye (1-10)</label>
                                <input required type="number" min="1" max="10" className="w-full border rounded-lg p-2" value={newPath.level} onChange={e => setNewPath({ ...newPath, level: parseInt(e.target.value) })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Gerekli Yetkinlikler (Virgülle ayırın)</label>
                                <textarea className="w-full border rounded-lg p-2" value={newPath.requiredSkills} onChange={e => setNewPath({ ...newPath, requiredSkills: e.target.value })} placeholder="Örn: Leadership, Kubernetes, English C1" />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowPathModal(false)} className="px-4 py-2 hover:bg-slate-100 rounded-lg">İptal</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Goal Modal */}
            {showGoalModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-in zoom-in-95">
                        <h2 className="text-lg font-bold mb-4">Yeni Hedef Ata</h2>
                        <form onSubmit={handleCreateGoal} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Hedef Başlığı</label>
                                <input required className="w-full border rounded-lg p-2" value={newGoal.title} onChange={e => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="Örn: Q1 Satış Hedefi" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Personel</label>
                                <select required className="w-full border rounded-lg p-2" value={newGoal.userId} onChange={e => setNewGoal({ ...newGoal, userId: e.target.value })}>
                                    <option value="">Seçiniz...</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Açıklama</label>
                                <textarea className="w-full border rounded-lg p-2" value={newGoal.description} onChange={e => setNewGoal({ ...newGoal, description: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Son Tarih</label>
                                <input type="date" required className="w-full border rounded-lg p-2" value={newGoal.dueDate} onChange={e => setNewGoal({ ...newGoal, dueDate: e.target.value })} />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setShowGoalModal(false)} className="px-4 py-2 hover:bg-slate-100 rounded-lg">İptal</button>
                                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">Ata</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
