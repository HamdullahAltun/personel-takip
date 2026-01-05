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

    const [users, setUsers] = useState<any[]>([]);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
    const [selectedUser, setSelectedUser] = useState("");

    useEffect(() => {
        fetchChecklists();
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const res = await fetch("/api/users");
        if (res.ok) setUsers(await res.json());
    };

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

    const handleAssign = async () => {
        if (!selectedUser || !selectedChecklist) return;

        await fetch("/api/admin/checklists/assign", {
            method: "POST",
            body: JSON.stringify({ userId: selectedUser, checklistId: selectedChecklist.id }),
            headers: { "Content-Type": "application/json" }
        });

        alert("Görev listesi başarıyla atandı!");
        setShowAssignModal(false);
        setSelectedUser("");
        setSelectedChecklist(null);
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
                            <ul className="space-y-3 mb-4">
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
                            <div className="pt-4 border-t border-slate-50">
                                <button
                                    onClick={() => {
                                        setSelectedChecklist(list);
                                        setShowAssignModal(true);
                                    }}
                                    className="w-full py-2 bg-slate-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-50 transition border border-slate-100 hover:border-indigo-100 flex items-center justify-center gap-2"
                                >
                                    <Target className="w-4 h-4" />
                                    Personel Ata
                                </button>
                            </div>
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

            {/* Assign Modal */}
            {showAssignModal && selectedChecklist && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-bold mb-4">Görevi Ata</h2>
                        <p className="text-sm text-slate-500 mb-4">"{selectedChecklist.title}" listesini hangi personele atamak istiyorsunuz?</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Personel Seçin</label>
                                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl">
                                    {users.map(u => (
                                        <button
                                            key={u.id}
                                            onClick={() => setSelectedUser(u.id)}
                                            className={`w-full text-left px-4 py-3 text-sm border-b border-slate-50 last:border-0 hover:bg-indigo-50 transition flex justify-between items-center ${selectedUser === u.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700'}`}
                                        >
                                            {u.name}
                                            {selectedUser === u.id && <CheckSquare className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowAssignModal(false)}
                                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50"
                                >
                                    İptal
                                </button>
                                <button
                                    disabled={!selectedUser}
                                    onClick={handleAssign}
                                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Ata ve Bildir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
