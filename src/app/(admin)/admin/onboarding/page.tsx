"use client";

import { useState, useEffect } from "react";
import { ClipboardList, Plus, Trash2, CheckSquare, Target, BookOpen, Settings } from "lucide-react";

export default function OnboardingAdmin() {
    const [checklists, setChecklists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newChecklist, setNewChecklist] = useState({
        title: "",
        type: "ONBOARDING",
        items: [{ task: "", category: "HR" }]
    });

    useEffect(() => {
        fetchChecklists();
    }, []);

    const fetchChecklists = async () => {
        const res = await fetch("/api/admin/checklists");
        if (res.ok) setChecklists(await res.json());
        setLoading(false);
    };

    const handleAddItem = () => {
        setNewChecklist({
            ...newChecklist,
            items: [...newChecklist.items, { task: "", category: "HR" }]
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/admin/checklists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newChecklist)
        });
        if (res.ok) {
            setShowAddModal(false);
            fetchChecklists();
            setNewChecklist({ title: "", type: "ONBOARDING", items: [{ task: "", category: "HR" }] });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Onboarding & Offboarding</h1>
                    <p className="text-slate-500">Çalışan giriş-çıkış süreçlerini otomatikleştirin ve takip edin.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Süreç Oluştur
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {checklists.map((list) => (
                    <div key={list.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${list.type === 'ONBOARDING' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {list.type === 'ONBOARDING' ? <CheckSquare className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
                                </div>
                                <h3 className="font-bold text-slate-900">{list.title}</h3>
                            </div>
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                                {list.type}
                            </span>
                        </div>
                        <div className="p-5 flex-1 bg-white">
                            <ul className="space-y-3">
                                {list.items.map((item: any, idx: number) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 mt-0.5">
                                            {idx + 1}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-slate-700 font-medium">{item.task}</span>
                                            <span className="text-[10px] text-indigo-500">{item.category}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <Settings className="text-indigo-600" />
                            Yeni İş Akışı Hazırla
                        </h2>
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Süreç Başlığı</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Örn: Yazılım Ekibi Onboarding"
                                        value={newChecklist.title}
                                        onChange={(e) => setNewChecklist({ ...newChecklist, title: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Tür</label>
                                    <select
                                        value={newChecklist.type}
                                        onChange={(e) => setNewChecklist({ ...newChecklist, type: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    >
                                        <option value="ONBOARDING">Onboarding (Giriş)</option>
                                        <option value="OFFBOARDING">Offboarding (Çıkış)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                                    <label className="text-sm font-bold text-slate-900">Süreç Adımları</label>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="text-indigo-600 text-xs font-bold hover:underline flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> Ekle
                                    </button>
                                </div>
                                <div className="max-h-60 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                    {newChecklist.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-3 items-center">
                                            <input
                                                required
                                                placeholder="Görev tanımı"
                                                value={item.task}
                                                onChange={(e) => {
                                                    const items = [...newChecklist.items];
                                                    items[idx].task = e.target.value;
                                                    setNewChecklist({ ...newChecklist, items });
                                                }}
                                                className="flex-1 px-3 py-2 border border-slate-100 bg-slate-50 rounded-lg text-sm outline-none focus:bg-white focus:border-indigo-300"
                                            />
                                            <select
                                                value={item.category}
                                                onChange={(e) => {
                                                    const items = [...newChecklist.items];
                                                    items[idx].category = e.target.value;
                                                    setNewChecklist({ ...newChecklist, items });
                                                }}
                                                className="w-24 px-2 py-2 border border-slate-100 bg-slate-50 rounded-lg text-xs outline-none"
                                            >
                                                <option value="HR">IK</option>
                                                <option value="IT">BT</option>
                                                <option value="FIN">Mali</option>
                                                <option value="OP">Op</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-medium hover:bg-slate-50 transition"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition"
                                >
                                    Kaydet ve Aktif Et
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
