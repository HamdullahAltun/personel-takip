"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { X, Save, Trash, Clock, User as UserIcon, Type } from "lucide-react";
import { Shift, User } from "@prisma/client";

interface ShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (shift: Partial<Shift> & { userId: string }) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    users: Partial<User>[];
    initialShift?: Shift | null;
    selectedDate?: Date;
}

export default function ShiftModal({ isOpen, onClose, onSave, onDelete, users, initialShift, selectedDate }: ShiftModalProps) {
    const [userId, setUserId] = useState("");
    const [start, setStart] = useState("");
    const [end, setEnd] = useState("");
    const [type, setType] = useState("REGULAR");
    const [title, setTitle] = useState("");
    const [notes, setNotes] = useState("");
    const [isOvertime, setIsOvertime] = useState(false);
    const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED">("PUBLISHED");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialShift) {
                setUserId(initialShift.userId);
                setStart(format(new Date(initialShift.startTime), "yyyy-MM-dd'T'HH:mm"));
                setEnd(format(new Date(initialShift.endTime), "yyyy-MM-dd'T'HH:mm"));
                setType(initialShift.type);
                setTitle(initialShift.title || "");
                setNotes(initialShift.notes || "");
                setIsOvertime(initialShift.isOvertime || false);
                setStatus(initialShift.status as any);
            } else {
                setUserId("");
                const baseDate = selectedDate || new Date();
                // Default to 09:00 - 18:00
                const s = new Date(baseDate);
                s.setHours(9, 0, 0, 0);
                const e = new Date(baseDate);
                e.setHours(18, 0, 0, 0);

                setStart(format(s, "yyyy-MM-dd'T'HH:mm"));
                setEnd(format(e, "yyyy-MM-dd'T'HH:mm"));
                setType("REGULAR");
                setTitle("");
                setNotes("");
                setIsOvertime(false);
                setStatus("PUBLISHED");
            }
        }
    }, [isOpen, initialShift, selectedDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                userId,
                startTime: new Date(start),
                endTime: new Date(end),
                type: type as any,
                title,
                notes,
                isOvertime,
                status: status as any
            });
            onClose();
        } catch (error) {
            console.error(error);
            alert("Hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!initialShift || !onDelete || !confirm("Silmek istediğinize emin misiniz?")) return;
        setLoading(true);
        try {
            await onDelete(initialShift.id);
            onClose();
        } catch (error) {
            alert("Hata oluştu");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="font-bold text-lg text-slate-800">
                        {initialShift ? "Vardiya Düzenle" : "Yeni Vardiya"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Personel</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
                                <select
                                    required
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={userId}
                                    onChange={e => setUserId(e.target.value)}
                                >
                                    <option value="">Personel Seçin</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Başlangıç</label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={start}
                                    onChange={e => setStart(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Bitiş</label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={end}
                                    onChange={e => setEnd(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Durum</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
                                <select
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={status}
                                    onChange={e => setStatus(e.target.value as "DRAFT" | "PUBLISHED" | "COMPLETED" | "CANCELLED")}
                                    disabled={!initialShift}
                                >
                                    <option value="DRAFT">Taslak / Onay Bekliyor</option>
                                    <option value="PUBLISHED">Onaylandı / Yayında</option>
                                    <option value="COMPLETED">Tamamlandı</option>
                                    <option value="CANCELLED">İptal Edildi</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Tip</label>
                            <div className="relative">
                                <Type className="absolute left-3 top-2.5 text-slate-400 h-4 w-4" />
                                <select
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={type}
                                    onChange={e => {
                                        setType(e.target.value);
                                        if (e.target.value === 'OVERTIME') setIsOvertime(true);
                                    }}
                                >
                                    <option value="REGULAR">Normal Vardiya</option>
                                    <option value="OVERTIME">Fazla Mesai</option>
                                    <option value="FLEXIBLE">Esnek</option>
                                    <option value="REMOTE">Uzaktan</option>
                                    <option value="TRAINING">Eğitim</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 cursor-pointer" onClick={() => setIsOvertime(!isOvertime)}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${isOvertime ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                {isOvertime && <div className="w-2 h-2 bg-white rounded-full"></div>}
                            </div>
                            <span className="text-sm font-medium text-slate-700">Fazla Mesai Olarak İşaretle</span>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Başlık (Opsiyonel)</label>
                            <input
                                type="text"
                                placeholder="Örn: Açılış Vardiyası"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Notlar</label>
                            <textarea
                                rows={3}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                            />
                        </div>

                    </form>
                </div>

                <div className="p-4 border-t border-slate-100 flex gap-3 bg-slate-50">
                    {initialShift && onDelete && (
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={loading}
                            className="p-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-colors"
                        >
                            <Trash size={20} />
                        </button>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        {loading ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                </div>
            </div>
        </div>
    );
}
