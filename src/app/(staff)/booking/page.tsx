"use client";

import { useState, useEffect } from "react";
import { Clock, Plus, Car, Monitor, Armchair, AlertCircle, Info, XCircle } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

type Resource = {
    id: string;
    name: string;
    type: string;
};

type Booking = {
    id: string;
    resource: Resource;
    startTime: string;
    endTime: string;
    purpose: string;
    status: 'CONFIRMED' | 'CANCELLED';
    cancellationReason?: string;
};

export default function StaffBookingPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [myBookings, setMyBookings] = useState<Booking[]>([]);
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
        fetchMyBookings();
    }, []);

    const fetchResources = async () => {
        const res = await fetch('/api/booking?mode=resources');
        const data = await res.json();
        setResources(Array.isArray(data) ? data : []);
    };

    const fetchMyBookings = async () => {
        const res = await fetch('/api/booking?mode=my-bookings');
        if (res.ok) setMyBookings(await res.json());
    };

    // Generate time slots (08:00 to 20:00)
    const generateTimeSlots = () => {
        const slots = [];
        for (let i = 8; i <= 19; i++) {
            slots.push(`${i < 10 ? '0' + i : i}:00`);
            slots.push(`${i < 10 ? '0' + i : i}:30`);
        }
        return slots;
    };

    const timeSlots = generateTimeSlots();

    // Dynamically filter end times based on start time
    const getEndTimes = () => {
        if (!formData.startTime) return timeSlots;
        const startIndex = timeSlots.indexOf(formData.startTime);
        return timeSlots.slice(startIndex + 1);
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

        if (end <= start) {
            setError("Bitiş saati, başlangıç saatinden sonra olmalıdır.");
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
            fetchMyBookings();
            setFormData({
                resourceId: "",
                date: new Date().toISOString().split('T')[0],
                startTime: "09:00",
                endTime: "10:00",
                purpose: ""
            });
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm("Rezervasyonu iptal etmek istiyor musunuz?")) return;
        const res = await fetch('/api/booking', {
            method: 'POST',
            body: JSON.stringify({ action: 'CANCEL', id }),
            headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) fetchMyBookings();
    };

    const getIcon = (type: string) => {
        if (type === 'CAR') return <Car className="h-5 w-5" />;
        if (type === 'DEVICE') return <Monitor className="h-5 w-5" />;
        return <Armchair className="h-5 w-5" />;
    };

    return (
        <div className="space-y-6 max-w-lg mx-auto pb-20">
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
                    Yeni
                </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {resources.map(res => (
                    <div key={res.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center gap-2">
                        <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                            {getIcon(res.type)}
                        </div>
                        <div>
                            <p className="font-bold text-slate-900 text-sm">{res.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase">{res.type}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* My Bookings Section */}
            {myBookings.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-lg font-bold text-slate-900 mb-4">Rezervasyonlarım</h2>
                    <div className="space-y-3">
                        {myBookings.map(booking => (
                            <div key={booking.id} className={`bg-white p-4 rounded-xl border-l-4 shadow-sm ${booking.status === 'CANCELLED' ? 'border-red-500 bg-red-50/50' : 'border-indigo-500'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className={`font-bold text-slate-800 ${booking.status === 'CANCELLED' ? 'line-through decoration-slate-400 opacity-60' : ''}`}>{booking.resource?.name}</p>
                                            {booking.status === 'CANCELLED' &&
                                                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">İPTAL</span>
                                            }
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">
                                            {format(new Date(booking.startTime), "d MMMM", { locale: tr })} •
                                            {format(new Date(booking.startTime), "HH:mm")} - {format(new Date(booking.endTime), "HH:mm")}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">{booking.purpose}</p>

                                        {booking.status === 'CANCELLED' && booking.cancellationReason && (
                                            <div className="mt-2 bg-red-100 p-2 rounded-lg text-xs text-red-700 font-medium flex items-start gap-1">
                                                <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                                {booking.cancellationReason}
                                            </div>
                                        )}
                                    </div>

                                    {booking.status !== 'CANCELLED' && (
                                        <button onClick={() => handleCancel(booking.id)} className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition">
                                            <XCircle className="h-5 w-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
                                    <select required className="w-full border rounded-lg p-2" value={formData.startTime} onChange={e => setFormData({ ...formData, startTime: e.target.value })}>
                                        {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bitiş</label>
                                    <select required className="w-full border rounded-lg p-2" value={formData.endTime} onChange={e => setFormData({ ...formData, endTime: e.target.value })}>
                                        {getEndTimes().map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
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
