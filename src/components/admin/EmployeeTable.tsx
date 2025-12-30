"use client";

import { useState } from "react";
import { User } from "@prisma/client";
import { Plus, Pencil, Trash2, Search, X, Loader2 } from "lucide-react";
import { createEmployee, deleteEmployee, updateEmployee } from "@/app/actions/employee";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";

export default function EmployeeTable({ initialEmployees }: { initialEmployees: User[] }) {
    const [employees] = useState(initialEmployees);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    // Simplified: In a real app, use useOptimistic or useEffect to sync with Server Actions result
    // ensuring the list updates. Since we use revalidatePath, the page props might update if we hard refresh 
    // or use router.refresh().
    const router = useRouter();

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const filtered = initialEmployees.filter(emp =>
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.phone.includes(search)
    );

    const handleDelete = async (id: string) => {
        if (!confirm("Bu personeli silmek istediğinize emin misiniz?")) return;
        await deleteEmployee(id);
        router.refresh(); // Refresh server data
    };

    return (
        <div>
            {/* Toolbar */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Ara..."
                        value={search}
                        onChange={handleSearch}
                        className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <button
                    onClick={() => { setEditingEmployee(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium w-full sm:w-auto justify-center"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Personel
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                            <th className="px-4 py-3 sm:px-6">Personel</th>
                            <th className="px-4 py-3 hidden sm:table-cell">Rol</th>
                            <th className="px-4 py-3 hidden md:table-cell text-right">Saatlik</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filtered.map((emp) => (
                            <tr
                                key={emp.id}
                                className="group hover:bg-slate-50/50 transition-colors cursor-pointer relative"
                                onClick={() => {
                                    setLoading(true); // reusing local loading state for nav indicator
                                    router.push(`/admin/employees/${emp.id}`);
                                }}
                            >
                                <td className="px-4 py-4 sm:px-6 relative">
                                    {/* Loading Overlay for this row if global loading is true? No, that's complex. 
                                         Just show a global transparent spinner or similar. 
                                         Actually, user asked for "Yükleniyor ibaresi".
                                     */}
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200">
                                            {emp.profilePicture ? (
                                                <img src={emp.profilePicture} alt={emp.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-bold text-slate-500 text-xs">{emp.name.charAt(0)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{emp.name}</p>
                                            <p className="text-slate-500 text-xs sm:hidden">
                                                {emp.role === 'ADMIN' ? 'Yönetici' : emp.role === 'EXECUTIVE' ? 'Üst Yönetici' : 'Personel'}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4 hidden sm:table-cell">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                                        ${emp.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                            emp.role === 'EXECUTIVE' ? 'bg-amber-100 text-amber-700' :
                                                'bg-blue-100 text-blue-700'}`}>
                                        {emp.role === 'ADMIN' ? 'Yönetici' : emp.role === 'EXECUTIVE' ? 'Üst Yönetici' : 'Personel'}
                                    </span>
                                </td>
                                <td className="px-4 py-4 hidden md:table-cell text-right text-slate-600">
                                    ₺{emp.hourlyRate}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filtered.length === 0 && (
                    <EmptyState
                        icon={Search}
                        title="Personel Bulunamadı"
                        description={search ? `"${search}" araması ile eşleşen sonuç bulunamadı.` : "Henüz hiç personel eklenmemiş."}
                        action={
                            !search && (
                                <button
                                    onClick={() => { setEditingEmployee(null); setIsModalOpen(true); }}
                                    className="text-blue-600 font-medium hover:underline"
                                >
                                    İlk Personeli Ekle
                                </button>
                            )
                        }
                    />
                )}
            </div>

            {/* Global Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-[100] flex items-center justify-center">
                    <div className="bg-white p-4 rounded-xl shadow-xl flex items-center gap-3">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <span className="font-medium text-slate-700">Profil Yükleniyor...</span>
                    </div>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <EmployeeModal
                    employee={editingEmployee}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => { setIsModalOpen(false); router.refresh(); }}
                />
            )}
        </div>
    );
}

function EmployeeModal({ employee, onClose, onSuccess }: { employee: User | null, onClose: () => void, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        let res;

        if (employee) {
            res = await updateEmployee(employee.id, null, formData);
        } else {
            res = await createEmployee(null, formData);
        }

        setLoading(false);

        if (res?.error) {
            setError(res.error);
        } else {
            onSuccess();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="font-bold text-lg text-slate-900">
                        {employee ? "Personeli Düzenle" : "Yeni Personel Ekle"}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Ad Soyad</label>
                            <input name="name" defaultValue={employee?.name} required className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ad Soyad" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Telefon</label>
                            <input name="phone" defaultValue={employee?.phone} required className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0555..." />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">E-Posta</label>
                        <input name="email" type="email" defaultValue={employee?.email || ''} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="isim@ornek.com" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Saatlik Ücret</label>
                            <input name="hourlyRate" type="number" step="0.5" defaultValue={employee?.hourlyRate || 0} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-slate-700">Haftalık Hedef (Saat)</label>
                            <input name="weeklyGoal" type="number" defaultValue={employee?.weeklyGoal || 40} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Rol</label>
                        <select name="role" defaultValue={employee?.role || "STAFF"} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            <option value="STAFF">Personel</option>
                            <option value="ADMIN">Yönetici</option>
                            <option value="EXECUTIVE">Üst Yönetici</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Vazgeç</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {employee ? "Güncelle" : "Kaydet"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
