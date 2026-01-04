"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Clock, QrCode, Share2, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { QRCodeSVG } from "qrcode.react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function StaffVisitorsPage() {
    const { data: visitors = [], mutate } = useSWR('/api/staff/visitors', fetcher);
    const [showModal, setShowModal] = useState(false);
    const [selectedVisitor, setSelectedVisitor] = useState<any>(null); // For QR view
    const [formData, setFormData] = useState({
        name: "",
        company: "",
        phone: "",
        visitReason: "TOPLANTI",
        visitDate: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch('/api/staff/visitors', {
                method: 'POST',
                body: JSON.stringify(formData),
                headers: { 'Content-Type': 'application/json' }
            });
            setShowModal(false);
            setFormData({
                name: "",
                company: "",
                phone: "",
                visitReason: "TOPLANTI",
                visitDate: new Date().toISOString().split('T')[0]
            });
            mutate();
        } catch (e) {
            alert("Davetiye oluşturulamadı");
        }
    };

    const shareInvite = (v: any) => {
        if (navigator.share) {
            navigator.share({
                title: 'Ziyaretçi Davetiyesi',
                text: `${v.name}, ${formData.visitDate} tarihinde ofisimize davetlisiniz.\nGiriş Kodunuz: ${v.qrCode} (Lütfen Danışmaya İletiniz)`,
            }).catch(console.error);
        } else {
            alert("Paylaşım özelliği bu tarayıcıda desteklenmiyor.");
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Ziyaretçilerim</h1>
                    <p className="text-slate-500 text-sm">Ofise gelecek misafirlerinizi davet edin</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition"
                >
                    <Plus className="h-6 w-6" />
                </button>
            </div>

            {/* Visitors List */}
            <div className="space-y-4">
                {visitors.length === 0 ? (
                    <div className="bg-white p-8 rounded-3xl text-center border border-slate-100">
                        <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-500">
                            <QrCode className="h-8 w-8" />
                        </div>
                        <h3 className="font-bold text-slate-900">Henüz Davetiye Yok</h3>
                        <p className="text-sm text-slate-400 mt-2">Misafirlerinizi QR kod ile hızlıca ofise davet edebilirsiniz.</p>
                    </div>
                ) : (
                    visitors.map((v: any) => (
                        <div key={v.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-orange-50 w-12 h-12 rounded-2xl flex items-center justify-center text-orange-600 font-bold text-lg">
                                    {v.name[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{v.name}</h3>
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(v.entryTime), 'd MMMM HH:mm', { locale: tr })}
                                    </p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${v.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                            v.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                        {v.status === 'PENDING' ? 'Bekleniyor' : v.status === 'ACTIVE' ? 'Ofiste' : 'Tamamlandı'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedVisitor(v)}
                                className="p-3 bg-slate-50 rounded-xl text-slate-600 active:scale-95"
                            >
                                <QrCode className="h-6 w-6" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* CREATE MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 animate-in slide-in-from-bottom-10 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">Yeni Davetiye</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 font-bold">Kapat</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 ml-1">Misafir Adı Soyadı</label>
                                <input required className="w-full bg-slate-50 border-0 rounded-xl p-3 font-medium focus:ring-2 ring-indigo-500" placeholder="Örn: Ahmet Yılmaz" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 ml-1">Firma (Opsiyonel)</label>
                                <input className="w-full bg-slate-50 border-0 rounded-xl p-3 font-medium focus:ring-2 ring-indigo-500" placeholder="Örn: X şirketi" value={formData.company} onChange={e => setFormData({ ...formData, company: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 ml-1">Telefon</label>
                                <input className="w-full bg-slate-50 border-0 rounded-xl p-3 font-medium focus:ring-2 ring-indigo-500" placeholder="05XX..." value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">Ziyaret Tarihi</label>
                                    <input type="date" required className="w-full bg-slate-50 border-0 rounded-xl p-3 font-medium" value={formData.visitDate} onChange={e => setFormData({ ...formData, visitDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 ml-1">Sebep</label>
                                    <select className="w-full bg-slate-50 border-0 rounded-xl p-3 font-medium" value={formData.visitReason} onChange={e => setFormData({ ...formData, visitReason: e.target.value })}>
                                        <option value="TOPLANTI">Toplantı</option>
                                        <option value="MULAKAT">Mülakat</option>
                                        <option value="ZIYARET">Ziyaret</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 active:scale-95 transition">
                                Davetiye Oluştur
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* QR DETAIL MODAL */}
            {selectedVisitor && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-6">
                    <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden relative animate-in zoom-in-95">
                        <div className="bg-indigo-600 p-6 text-center text-white">
                            <h3 className="font-bold text-lg mb-1">ZİYARETÇİ KARTI</h3>
                            <p className="text-indigo-200 text-xs">Ofis Giriş Yetkisi</p>
                        </div>
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="border-4 border-slate-900 rounded-xl p-2 mb-6">
                                <QRCodeSVG value={selectedVisitor.qrCode} size={180} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">{selectedVisitor.name}</h2>
                            <p className="text-slate-500 font-medium mb-6">{selectedVisitor.company || 'Şahsi Ziyaret'}</p>

                            <div className="flex gap-4 w-full">
                                <button onClick={() => setSelectedVisitor(null)} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl">Kapat</button>
                                <button onClick={() => shareInvite(selectedVisitor)} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                                    <Share2 className="h-4 w-4" /> Paylaş
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
