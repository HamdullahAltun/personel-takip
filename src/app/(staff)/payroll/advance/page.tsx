"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Wallet, Plus, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function StaffAdvancePage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ amount: "", reason: "" });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const res = await fetch('/api/finance/advance');
        const data = await res.json();
        if (Array.isArray(data)) setRequests(data);
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/finance/advance', {
                method: 'POST',
                body: JSON.stringify({
                    amount: parseFloat(formData.amount),
                    reason: formData.reason
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (!res.ok) {
                const err = await res.json();
                alert(err.error || "Hata oluştu");
                return;
            }

            setShowModal(false);
            setFormData({ amount: "", reason: "" });
            fetchData();
        } catch (e) {
            alert("İşlem başarısız");
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center bg-indigo-600 p-6 rounded-2xl text-white shadow-lg overflow-hidden relative">
                <div className="relative z-10">
                    <p className="text-indigo-200 text-sm font-medium mb-1">Maaş & Finans</p>
                    <h1 className="text-2xl font-bold">Avans Talepleri</h1>
                    <p className="text-indigo-100/80 text-sm max-w-md mt-2">Acil nakit ihtiyaçlarınız için avans talebinde bulunabilirsiniz.</p>
                </div>
                <Wallet className="absolute right-[-20px] bottom-[-20px] h-32 w-32 text-indigo-500/30 rotate-12" />
                <button
                    onClick={() => setShowModal(true)}
                    className="relative z-10 bg-white text-indigo-600 px-4 py-2 rounded-xl font-bold hover:bg-indigo-50 transition shadow-lg flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Yeni Talep
                </button>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center p-8 text-slate-400">Yükleniyor...</div>
                ) : requests.length === 0 ? (
                    <div className="text-center p-12 bg-slate-50 rounded-xl border border-dashed text-slate-400">
                        <Wallet className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Henüz bir avans talebiniz yok.</p>
                    </div>
                ) : (
                    requests.map(req => (
                        <div key={req.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${req.status === 'APPROVED' ? 'bg-green-100 text-green-600' :
                                        req.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                                            'bg-amber-100 text-amber-600'
                                    }`}>
                                    {req.status === 'APPROVED' ? <CheckCircle className="h-5 w-5" /> :
                                        req.status === 'REJECTED' ? <XCircle className="h-5 w-5" /> :
                                            <Clock className="h-5 w-5" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg">₺{req.amount.toLocaleString('tr-TR')}</h3>
                                    <p className="text-slate-500 text-sm">{req.reason}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{format(new Date(req.requestedAt), 'd MMMM yyyy HH:mm', { locale: tr })}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                        req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                    }`}>
                                    {req.status === 'APPROVED' ? 'Onaylandı' :
                                        req.status === 'REJECTED' ? 'Reddedildi' :
                                            'İnceleniyor'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-md animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-slate-900">Avans Talep Et</h2>
                            <button onClick={() => setShowModal(false)}><XCircle className="h-6 w-6 text-slate-400 hover:text-slate-600" /></button>
                        </div>

                        <div className="bg-amber-50 p-3 rounded-lg flex items-start gap-2 text-xs text-amber-800 mb-4 border border-amber-200">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <p>Talep edilen avans tutarı, onaylanması durumunda bir sonraki maaş hakedişinizden kesilecektir.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Tutar (TL)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₺</span>
                                    <input
                                        type="number"
                                        required
                                        min="100"
                                        className="w-full border rounded-xl p-2 pl-8 font-bold text-slate-900"
                                        placeholder="0.00"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Sebep</label>
                                <textarea
                                    required
                                    className="w-full border rounded-xl p-3 text-sm h-24"
                                    placeholder="Neden avans talep ediyorsunuz?"
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
                                Talep Gönder
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
