"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Plus, Clock, Car, Monitor, Armchair, AlertCircle, Trash } from "lucide-react";
import { format, addHours, isSameDay } from "date-fns";
import { tr } from "date-fns/locale";

export default function BookingPage() {
    const [resources, setResources] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [error, setError] = useState("");

    // Booking Form
    const [formData, setFormData] = useState({
        resourceId: "",
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "10:00",
        purpose: ""
    });

    // Resource Form
    const [resForm, setResForm] = useState({ name: "", type: "ROOM" });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const resRes = await fetch('/api/booking?mode=resources');
            const resData = await resRes.json();
            setResources(Array.isArray(resData) ? resData : []);

            const bookRes = await fetch('/api/booking');
            const bookData = await bookRes.json();
            setBookings(Array.isArray(bookData) ? bookData : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateResource = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/booking', {
            method: 'POST',
            body: JSON.stringify({ action: 'CREATE_RESOURCE', ...resForm }),
            headers: { 'Content-Type': 'application/json' }
        });
        setShowResourceModal(false);
        fetchData();
    };

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const start = new Date(`${formData.date}T${formData.startTime}`);
        const end = new Date(`${formData.date}T${formData.endTime}`);

        if (start < new Date()) {
            setError("Geçmiş zamana rezervasyon yapılamaz!");
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

    const handleDelete = async (id: string) => {
        if (!confirm("Bu rezervasyonu silmek istediğinize emin misiniz?")) return;

        const res = await fetch('/api/booking', {
            method: 'POST',
            body: JSON.stringify({ action: 'DELETE', id }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            fetchData();
        } else {
            alert("Silme işlemi başarısız.");
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
                        onClick={() => setShowResourceModal(true)}
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
                    {resources.map(res => (
                        <div key={res.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                                {getIcon(res.type)}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">{res.name}</p>
                                <p className="text-xs text-slate-500">{res.type}</p>
                            </div>
                        </div>
                    ))}
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
                                    <div key={book.id} className="p-4 flex items-center justify-between hover:bg-slate-50 group">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-indigo-50 text-indigo-700 w-12 h-12 rounded-lg flex flex-col items-center justify-center font-bold leading-none">
                                                <span className="text-sm">{format(new Date(book.startTime), 'd')}</span>
                                                <span className="text-[10px]">{format(new Date(book.startTime), 'MMM', { locale: tr })}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{book.resource.name}</h4>
                                                <p className="text-sm text-slate-500">{book.purpose} • <span className="text-indigo-600 font-medium">{book.user.name}</span></p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right text-sm">
                                                <p className="font-medium text-slate-900">
                                                    {format(new Date(book.startTime), 'HH:mm')} - {format(new Date(book.endTime), 'HH:mm')}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    {((new Date(book.endTime).getTime() - new Date(book.startTime).getTime()) / (1000 * 60)).toFixed(0)} dk
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(book.id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                title="Sil"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </button>
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
                        <h2 className="text-xl font-bold mb-4">Yeni Kaynak Ekle</h2>
                        <form onSubmit={handleCreateResource} className="space-y-4">
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
