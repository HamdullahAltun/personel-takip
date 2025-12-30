"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Plus, Clock, Car, Monitor, Armchair, AlertCircle, Trash, Edit, XCircle, Info, Pencil, CheckCircle } from "lucide-react";
import { format, addHours, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";

type Resource = {
    id: string;
    name: string;
    type: string;
};

type Booking = {
    id: string;
    resource: Resource;
    user: { name: string };
    startTime: string;
    endTime: string;
    purpose: string;
    status: 'CONFIRMED' | 'CANCELLED';
    cancellationReason?: string;
};

export default function BookingPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Resource Management
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [resForm, setResForm] = useState({ name: "", type: "ROOM" });

    // Cancellation
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState("");

    const [error, setError] = useState("");

    // Booking Form
    const [formData, setFormData] = useState({
        resourceId: "",
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "10:00",
        purpose: ""
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const resRes = await fetch('/api/booking?mode=resources');
            if (resRes.status === 401) {
                window.location.href = "/api/auth/logout";
                return;
            }
            const resData = await resRes.json();
            setResources(Array.isArray(resData) ? resData : []);

            const bookRes = await fetch('/api/booking');
            if (bookRes.status === 401) {
                window.location.href = "/api/auth/logout";
                return;
            }
            const bookData = await bookRes.json();
            setBookings(Array.isArray(bookData) ? bookData : []);
        } catch (e) {
            console.error(e);
            setResources([]);
            setBookings([]);
        } finally {
            setLoading(false);
        }
    };

    // --- Resource Management ---

    const openResourceModal = (res?: Resource) => {
        if (res) {
            setEditingResource(res);
            setResForm({ name: res.name, type: res.type });
        } else {
            setEditingResource(null);
            setResForm({ name: "", type: "ROOM" });
        }
        setShowResourceModal(true);
    };

    const handleSaveResource = async (e: React.FormEvent) => {
        e.preventDefault();
        const action = editingResource ? 'UPDATE_RESOURCE' : 'CREATE_RESOURCE';
        const body = editingResource ? { ...resForm, id: editingResource.id, action } : { ...resForm, action };

        await fetch('/api/booking', {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        });
        setShowResourceModal(false);
        fetchData();
    };

    const handleDeleteResource = async (id: string) => {
        if (!confirm("Bu kaynağı silmek istediğinize emin misiniz?")) return;
        await fetch('/api/booking', {
            method: 'POST',
            body: JSON.stringify({ action: 'DELETE_RESOURCE', id }),
            headers: { 'Content-Type': 'application/json' }
        });
        fetchData();
    };


    // --- Booking Management ---

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const start = new Date(`${formData.date}T${formData.startTime}`);
        const end = new Date(`${formData.date}T${formData.endTime}`);

        if (start < new Date()) {
            setError("Geçmiş zamana rezervasyon yapılamaz!");
            return;
        }

        if (end <= start) {
            setError("Bitiş saati başlangıç saatinden sonra olmalıdır!");
            return;
        }

        const res = await fetch('/api/booking', {
            method: 'POST',
            body: JSON.stringify({
                action: 'BOOK',
                resourceId: formData.resourceId,
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                purpose: formData.purpose
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.status === 409) {
            setError("Seçilen saat aralığında bu kaynak dolu!");
            return;
        }

        if (res.ok) {
            setShowModal(false);
            fetchData();
        }
    };

    const handleCancelBooking = async (id: string) => {
        if (!cancelReason.trim()) return;

        const res = await fetch('/api/booking', {
            method: 'POST',
            body: JSON.stringify({ action: 'CANCEL', id, reason: cancelReason }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            setCancellingId(null);
            setCancelReason("");
            fetchData();
        } else {
            alert("İptal işlemi başarısız.");
        }
    };

    const getIcon = (type: string) => {
        if (type === 'CAR') return <Car className="h-5 w-5" />;
        if (type === 'DEVICE') return <Monitor className="h-5 w-5" />;
        return <Armchair className="h-5 w-5" />;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Rezervasyon Sistemi</h1>
                    <p className="text-slate-500">Toplantı odaları, araçlar ve ekipmanlar</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => openResourceModal()}
                        className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Kaynak Ekle
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
                    >
                        <Clock className="h-4 w-4" />
                        Rezervasyon Yap
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Resources List */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="font-bold text-slate-800">Kaynaklar</h3>
                    <div className="space-y-3">
                        {resources.map(res => (
                            <div key={res.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 group relative">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                                        {getIcon(res.type)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{res.name}</p>
                                        <p className="text-xs text-slate-500">{res.type}</p>
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-1 rounded">
                                    <button onClick={() => openResourceModal(res)} className="p-1 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="h-3.5 w-3.5" /></button>
                                    <button onClick={() => handleDeleteResource(res.id)} className="p-1 text-red-600 hover:bg-red-50 rounded"><Trash className="h-3.5 w-3.5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timeline / Recent Bookings */}
                <div className="lg:col-span-3">
                    <h3 className="font-bold text-slate-800 mb-4">Yaklaşan Rezervasyonlar</h3>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        {bookings.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">Henüz rezervasyon yok.</div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {bookings.map(book => (
                                    <div key={book.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 group border-l-4 ${book.status === 'CANCELLED' ? 'border-red-500 bg-red-50/30' : 'border-indigo-500'}`}>
                                        <div className="flex items-center gap-4 mb-2 sm:mb-0">
                                            <div className="bg-indigo-50 text-indigo-700 w-12 h-12 rounded-lg flex flex-col items-center justify-center font-bold leading-none flex-shrink-0">
                                                <span className="text-sm">{format(new Date(book.startTime), 'd')}</span>
                                                <span className="text-[10px]">{format(new Date(book.startTime), 'MMM', { locale: tr })}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className={`font-bold text-slate-900 ${book.status === 'CANCELLED' ? 'line-through text-slate-500' : ''}`}>{book.resource.name}</h4>
                                                    {book.status === 'CANCELLED' && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">İPTAL EDİLDİ</span>}
                                                </div>
                                                <p className="text-sm text-slate-500">{book.purpose} • <span className="text-indigo-600 font-medium">{book.user.name}</span></p>
                                                {book.status === 'CANCELLED' && book.cancellationReason && (
                                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><Info className="h-3 w-3" /> {book.cancellationReason}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                            <div className="text-right text-sm">
                                                <p className="font-medium text-slate-900">
                                                    {format(new Date(book.startTime), 'HH:mm')} - {format(new Date(book.endTime), 'HH:mm')}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {((new Date(book.endTime).getTime() - new Date(book.startTime).getTime()) / (1000 * 60)).toFixed(0)} dk
                                                </p>
                                            </div>

                                            {book.status !== 'CANCELLED' && (
                                                <div className="flex items-center">
                                                    {cancellingId === book.id ? (
                                                        <div className="flex items-center gap-2 animate-in slide-in-from-right">
                                                            <input
                                                                className="text-xs border rounded px-2 py-1 w-32"
                                                                placeholder="İptal sebebi..."
                                                                autoFocus
                                                                value={cancelReason}
                                                                onChange={e => setCancelReason(e.target.value)}
                                                            />
                                                            <button onClick={() => setCancellingId(null)}><XCircle className="h-5 w-5 text-slate-400" /></button>
                                                            <button onClick={() => handleCancelBooking(book.id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">İptal</button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => { setCancellingId(book.id); setCancelReason(""); }}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                            title="İptal Et"
                                                        >
                                                            <Trash className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* BOOKING MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">Rezervasyon Yap</h2>
                        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</div>}

                        <form onSubmit={handleBooking} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Kaynak Seçin</label>
                                <select required className="w-full border rounded-lg p-2" value={formData.resourceId} onChange={e => setFormData({ ...formData, resourceId: e.target.value })}>
                                    <option value="">Seçiniz...</option>
                                    {resources.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tarih</label>
                                <input type="date" required className="w-full border rounded-lg p-2" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Başlangıç</label>
                                    <input type="time" required className="w-full border rounded-lg p-2" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş</label>
                                    <input type="time" required className="w-full border rounded-lg p-2" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amaç / Not</label>
                                <input required className="w-full border rounded-lg p-2" value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} placeholder="Örn: Müşteri Toplantısı" />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">İptal</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Oluştur</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RESOURCE MODAL */}
            {showResourceModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">{editingResource ? 'Kaynağı Düzenle' : 'Yeni Kaynak Ekle'}</h2>
                        <form onSubmit={handleSaveResource} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Kaynak Adı</label>
                                <input required className="w-full border rounded-lg p-2" value={resForm.name} onChange={e => setResForm({ ...resForm, name: e.target.value })} placeholder="Örn: Toplantı Odası A" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tip</label>
                                <select className="w-full border rounded-lg p-2" value={resForm.type} onChange={e => setResForm({ ...resForm, type: e.target.value })}>
                                    <option value="ROOM">Oda</option>
                                    <option value="CAR">Araç</option>
                                    <option value="DEVICE">Cihaz</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowResourceModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">İptal</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
