"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, Plus, Building2, TrendingUp, AlertTriangle, CheckCircle2, DollarSign, Users } from "lucide-react";

export default function DepartmentsAdmin() {
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newDept, setNewDept] = useState({ name: "", budgetLimit: 0, managerName: "" });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        const res = await fetch("/api/admin/departments");
        if (res.ok) setDepartments(await res.json());
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/admin/departments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newDept)
        });
        if (res.ok) {
            setShowAddModal(false);
            fetchDepartments();
            setNewDept({ name: "", budgetLimit: 0, managerName: "" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Departmanlar & Bütçe Yönetimi</h1>
                    <p className="text-slate-500">Şirket yapısını ve bütçe limitlerini takip edin.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Departman
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => {
                    const usagePercent = dept.budgetLimit > 0 ? (dept.budgetUsed / dept.budgetLimit) * 100 : 0;
                    return (
                        <div key={dept.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                                    <Users className="w-3 h-3" />
                                    {dept._count.users} Kişi
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{dept.name}</h3>
                                <p className="text-xs text-slate-500 font-medium">Md: {dept.managerName || "Belirtilmedi"}</p>
                            </div>

                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between text-xs font-bold mb-1">
                                    <span className="text-slate-500 uppercase tracking-wider">Harcama Durumu</span>
                                    <span className={usagePercent > 80 ? "text-rose-500" : "text-indigo-600"}>
                                        %{usagePercent.toFixed(1)}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${usagePercent > 90 ? 'bg-rose-500' : usagePercent > 75 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                        style={{ width: `${usagePercent}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>{dept.budgetUsed.toLocaleString('tr-TR')} TL</span>
                                    <span>/ {dept.budgetLimit.toLocaleString('tr-TR')} TL</span>
                                </div>
                            </div>

                            {usagePercent > 80 && (
                                <div className="flex items-center gap-2 bg-rose-50 text-rose-600 p-2 rounded-lg text-[10px] font-bold border border-rose-100">
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    Bütçe limitine çok yakın! Taleplerde kısıtlamaya gidilebilir.
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
                        <h2 className="text-xl font-bold mb-6">Yeni Departman Ekle</h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Departman Adı</label>
                                <input
                                    required
                                    type="text"
                                    value={newDept.name}
                                    onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Aylık Bütçe Limiti (TL)</label>
                                <input
                                    required
                                    type="number"
                                    value={newDept.budgetLimit}
                                    onChange={(e) => setNewDept({ ...newDept, budgetLimit: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Yönetici Adı</label>
                                <input
                                    type="text"
                                    value={newDept.managerName}
                                    onChange={(e) => setNewDept({ ...newDept, managerName: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3 border border-slate-200 rounded-xl">İptal</button>
                                <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 text-sm">Departmanı Oluştur</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
