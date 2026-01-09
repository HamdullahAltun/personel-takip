"use client";

import { useState, useEffect } from "react";
import { UserPlus, QrCode, LogOut, Clock, Building, Users, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { QRCodeSVG } from "qrcode.react";

export default function VisitorsPage() {
    const [visitors, setVisitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [createdVisitor, setCreatedVisitor] = useState<any>(null); // To show QR

    // Form
    const [formData, setFormData] = useState({ name: "", phone: "", company: "", visitReason: "", hostName: "" });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/visitors');
            const data = await res.json();
            setVisitors(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/visitors', {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        setCreatedVisitor(data);
        setShowModal(false);
        setFormData({ name: "", phone: "", company: "", visitReason: "", hostName: "" });
        fetchData();
    };

    const handleExit = async (id: string) => {
        if (!confirm("Ziyaretçi çıkışı yapılsın mı?")) return;
        await fetch('/api/visitors', {
            method: 'PATCH',
            body: JSON.stringify({ id, action: 'EXIT' }),
            headers: { 'Content-Type': 'application/json' }
        });
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Ziyaretçi Takip</h1>
                    <p className="text-slate-500">Ofis ziyaretçi kaydı ve giriş kartları</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
                >
                    <UserPlus className="h-4 w-4" />
                    Ziyaretçi Ekle
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                        <tr>
                            <th className="p-4 font-medium">Ziyaretçi Adı</th>
                            <th className="p-4 font-medium">Firma / Kurum</th>
                            <th className="p-4 font-medium">Ziyaret Sebebi</th>
                            <th className="p-4 font-medium">Ziyaret Edilen</th>
                            <th className="p-4 font-medium">Giriş Saati</th>
                            <th className="p-4 font-medium">Çıkış Saati</th>
                            <th className="p-4 font-medium text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {visitors.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-slate-400">Kayıt yok.</td></tr>
                        ) : (
                            visitors.map(visitor => (
                                <tr key={visitor.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-bold text-slate-900">{visitor.name}</td>
                                    <td className="p-4 text-slate-600">{visitor.company || '-'}</td>
                                    <td className="p-4 text-slate-600">{visitor.visitReason}</td>
                                    <td className="p-4 text-slate-600">{visitor.hostName}</td>
                                    <td className="p-4 font-mono text-xs">{format(new Date(visitor.entryTime), 'HH:mm')}</td>
                                    <td className="p-4 font-mono text-xs">
                                        {visitor.exitTime ? format(new Date(visitor.exitTime), 'HH:mm') : <span className="text-green-600 animate-pulse">İçeride</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        {!visitor.exitTime && (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setCreatedVisitor(visitor)}
                                                    className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                                                    title="QR Göster"
                                                >
                                                    <QrCode className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleExit(visitor.id)}
                                                    className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100"
                                                    title="Çıkış Yap"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* CREATE MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in zoom-in-95">
                        <h2 className="text-xl font-bold mb-4">Yeni Ziyaretçi Kaydı</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Ad Soyad</label>
                                <input required className="w-full border rounded-lg p-2" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                                <input className="w-full border rounded-lg p-2" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Firma (Opsiyonel)</label>
                                <input className="w-full border rounded-lg p-2" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Ziyaret Sebebi</label>
                                    <select className="w-full border rounded-lg p-2" value={formData.visitReason} onChange={e => setFormData({ ...formData, visitReason: e.target.value })}>
                                        <option value="">Seçiniz...</option>
                                        <option value="TOPLANTI">Toplantı</option>
                                        <option value="MULAKAT">İş Görüşmesi</option>
                                        <option value="TESLIMAT">Kargo/Teslimat</option>
                                        <option value="ZIYARET">Ziyaret</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Ev Sahibi (Personel)</label>
                                    <input required className="w-full border rounded-lg p-2" value={formData.hostName} onChange={e => setFormData({ ...formData, hostName: e.target.value })} placeholder="Kimi ziyarete geldi?" />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">İptal</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* QR PRINT MODAL */}
            {createdVisitor && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-8 animate-in zoom-in-95 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>

                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-slate-900">Ziyaretçi Kartı</h2>
                            <p className="text-slate-500 text-sm mt-1">{format(new Date(), 'd MMMM yyyy', { locale: tr })}</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl border-2 border-slate-100 inline-block mb-6 shadow-sm">
                            <QRCodeSVG value={createdVisitor.qrCode} size={200} />
                        </div>

                        <div className="space-y-1 mb-8">
                            <h3 className="font-bold text-xl text-slate-900 uppercase tracking-wide">{createdVisitor.name}</h3>
                            <p className="text-slate-500 font-medium">{createdVisitor.company}</p>
                            <div className="inline-block bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600 mt-2">
                                {createdVisitor.visitReason}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => window.print()} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">
                                Yazdır
                            </button>
                            <button
                                onClick={() => {
                                    const phone = createdVisitor.phone.replace(/\D/g, '');
                                    const cleanPhone = phone.startsWith('0') ? '9' + phone : phone.length === 10 ? '90' + phone : phone;
                                    const text = encodeURIComponent(`Sayın ${createdVisitor.name}, Şirketimize hoş geldiniz! Ziyaretçi kartınız oluşturulmuştur. Giriş için bu QR kodu kullanabilirsiniz.\n\nİyi günler dileriz.`);
                                    // ideally we would include a public link to the QR image here if we had storage
                                    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
                                }}
                                className="flex-1 bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition flex items-center justify-center gap-2"
                            >
                                <MessageCircle className="w-5 h-5" /> WhatsApp
                            </button>
                            <button onClick={() => setCreatedVisitor(null)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition">
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
