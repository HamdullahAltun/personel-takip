"use client";

import { useState, useEffect } from "react";
import { Clock, Plus, Car, Monitor, Armchair, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function StaffBookingPage() {
    const [resources, setResources] = useState<any[]>([]);
    const [myBookings, setMyBookings] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        resourceId: "",
        date: new Date().toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "10:00",
        purpose: ""
    });

    useEffect(() => {
        fetchResources();
    }, []);

    const fetchResources = async () => {
        const res = await fetch('/api/booking?mode=resources');
        const data = await res.json();
        setResources(Array.isArray(data) ? data : []);
        // For staff, maybe we only show their bookings or simple success message?
        // Let's assume we list their upcoming bookings if API supports filtering by user.
        // For now just resource list.
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
            setError("Bu saat aralığı dolu!");
            return;
        }

        if (res.ok) {
            alert("Rezervasyonunuz oluşturuldu!");
            setShowModal(false);
            setFormData({
                resourceId: "",
                date: new Date().toISOString().split('T')[0],
                startTime: "09:00",
                endTime: "10:00",
                purpose: ""
            });
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
                    <h1 className="text-2xl font-bold text-slate-900">Rezervasyon</h1>
                    <p className="text-slate-500">Toplantı odası ve araç kiralama</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Rezervasyon
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {resources.map(res => (
                    <div key={res.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
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

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">Rezervasyon Yap</h2>
                        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {error}</div>}

                        <form onSubmit={handleBooking} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Kaynak</label>
                                <select required className="w-full border rounded-lg p-2" value={formData.resourceId} onChange={e => setFormData({ ...formData, resourceId: e.target.value })}>
                                    <option value="">Seçiniz...</option>
                                    {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
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
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amaç</label>
                                <input required className="w-full border rounded-lg p-2" value={formData.purpose} onChange={e => setFormData({ ...formData, purpose: e.target.value })} placeholder="Örn: Toplantı" />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">İptal</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Oluştur</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
