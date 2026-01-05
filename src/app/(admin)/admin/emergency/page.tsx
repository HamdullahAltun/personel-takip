"use client";

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { ShieldAlert, ShieldCheck, RefreshCw, Phone, MapPin } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function EmergencyDashboard() {
    const { data: users = [], isLoading, mutate } = useSWR('/api/users', fetcher, { refreshInterval: 5000 });

    const [broadcastModal, setBroadcastModal] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [broadcasting, setBroadcasting] = useState(false);

    useEffect(() => {
        let timer: any;
        if (broadcastModal && countdown > 0) {
            timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [broadcastModal, countdown]);

    const handleBroadcast = async () => {
        setBroadcasting(true);
        try {
            await fetch('/api/admin/emergency/broadcast', { method: 'POST' });
            mutate(); // Refresh data
            setBroadcastModal(false);
            setCountdown(5);
            alert("Acil durum ilanı gönderildi.");
        } catch (e) {
            alert("Hata oluştu.");
        } finally {
            setBroadcasting(false);
        }
    };

    const dangerUsers = users.filter((u: any) => u.safetyStatus === 'DANGER');
    const safeUsers = users.filter((u: any) => u.safetyStatus === 'SAFE');
    const unknownUsers = users.filter((u: any) => u.safetyStatus !== 'SAFE' && u.safetyStatus !== 'DANGER');

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-red-50/50 p-6 rounded-3xl border border-red-100 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
                        <ShieldAlert className="h-8 w-8 text-red-600" />
                        Acil Durum Panosu
                    </h1>
                    <p className="text-slate-500 font-medium">Personel güvenlik durumu ve acil müdahale takibi</p>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                    <button
                        onClick={() => setBroadcastModal(true)}
                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-black shadow-lg shadow-red-200 animate-pulse flex items-center gap-2"
                    >
                        <ShieldAlert className="h-5 w-5" />
                        ACİL DURUM BAŞLAT
                    </button>
                    <button onClick={() => mutate()} className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition">
                        <RefreshCw className="h-5 w-5 text-slate-600" />
                    </button>
                </div>
            </div>

            {/* BROADCAST MODAL */}
            {broadcastModal && (
                <div className="fixed inset-0 z-50 bg-red-900/90 flex items-center justify-center backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full text-center space-y-6 shadow-2xl border-4 border-red-500 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-red-500 animate-[width_5s_linear_forwards]" style={{ animationDuration: '5s' }}></div>

                        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto animate-bounce">
                            <ShieldAlert className="h-12 w-12 text-red-600" />
                        </div>

                        <div>
                            <h2 className="text-3xl font-black text-slate-900 uppercase">Acil Durum İlanı</h2>
                            <p className="text-slate-500 mt-2 font-medium">Tüm personele "Tehlikedeyim/Güvendeyim" bildirimi gönderilecek. Bu işlem geri alınamaz.</p>
                        </div>

                        {countdown > 0 ? (
                            <div className="py-4">
                                <span className="text-6xl font-black text-red-600 tabular-nums">{countdown}</span>
                                <p className="text-xs font-bold text-red-400 uppercase tracking-widest mt-1">Saniye Sonra Aktif</p>
                            </div>
                        ) : (
                            <div className="py-4 font-black text-2xl text-red-600 animate-pulse">
                                HAZIR!
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => { setBroadcastModal(false); setCountdown(5); }}
                                className="bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200"
                            >
                                İPTAL ET
                            </button>
                            <button
                                onClick={handleBroadcast}
                                disabled={countdown > 0 || broadcasting}
                                className="bg-red-600 text-white py-3 rounded-xl font-black hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-red-200"
                            >
                                {broadcasting ? 'Gönderiliyor...' : 'BAŞLAT!'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-red-500 text-white p-6 rounded-[32px] shadow-xl shadow-red-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <ShieldAlert className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-4xl font-black">{dangerUsers.length}</span>
                    </div>
                    <h3 className="font-bold text-lg opacity-90">Tehlikede / Yardım Bekleyen</h3>
                    <p className="text-xs opacity-70 mt-1">Anında müdahale gerektirir</p>
                </div>

                <div className="bg-green-500 text-white p-6 rounded-[32px] shadow-xl shadow-green-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <ShieldCheck className="h-8 w-8 text-white" />
                        </div>
                        <span className="text-4xl font-black">{safeUsers.length}</span>
                    </div>
                    <h3 className="font-bold text-lg opacity-90">Güvende</h3>
                    <p className="text-xs opacity-70 mt-1">Durum bildirimi yapanlar</p>
                </div>

                <div className="bg-slate-100 text-slate-600 p-6 rounded-[32px] border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-white rounded-2xl">
                            <div className="h-8 w-8 font-black flex items-center justify-center text-slate-400 text-xl">?</div>
                        </div>
                        <span className="text-4xl font-black text-slate-900">{unknownUsers.length}</span>
                    </div>
                    <h3 className="font-bold text-lg text-slate-800">Durum Bilinmiyor</h3>
                    <p className="text-xs text-slate-500 mt-1">Henüz bildirim yapmayanlar</p>
                </div>
            </div>

            {/* DANGER LIST */}
            {dangerUsers.length > 0 && (
                <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-6 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                    <h2 className="text-xl font-black text-red-700 mb-4 flex items-center gap-2">
                        <ShieldAlert className="h-6 w-6" />
                        ACİL DURUM BİLDİRİMLERİ
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dangerUsers.map((u: any) => (
                            <div key={u.id} className="bg-white p-4 rounded-2xl shadow-sm border border-red-200 flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center font-bold text-red-600 text-lg">
                                    {u.name[0]}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{u.name}</h4>
                                    <p className="text-xs text-slate-500 mb-2">{u.phone}</p>
                                    <div className="flex gap-2">
                                        <a href={`tel:${u.phone}`} className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600">
                                            <Phone className="h-4 w-4" />
                                        </a>
                                        {/* Assuming location exists */}
                                        {u.lastLat && (
                                            <a
                                                href={`https://www.google.com/maps?q=${u.lastLat},${u.lastLng}`}
                                                target="_blank"
                                                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600"
                                            >
                                                <MapPin className="h-4 w-4" />
                                            </a>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-red-500 font-bold mt-2">
                                        Son Güncelleme: {new Date(u.lastSafetyUpdate).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* USER LIST (SAFE/UNKNOWN) */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-sm text-slate-500">Tüm Personel Durumu</div>
                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                    {users.map((u: any) => (
                        <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full 
                                    ${u.safetyStatus === 'SAFE' ? 'bg-green-500' :
                                        u.safetyStatus === 'DANGER' ? 'bg-red-500' : 'bg-slate-300'}`}
                                />
                                <span className="font-medium text-slate-900">{u.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-xs font-bold px-3 py-1 rounded-full
                                    ${u.safetyStatus === 'SAFE' ? 'bg-green-100 text-green-700' :
                                        u.safetyStatus === 'DANGER' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`}
                                >
                                    {u.safetyStatus === 'SAFE' ? 'GÜVENDE' :
                                        u.safetyStatus === 'DANGER' ? 'TEHLİKEDE' : 'BİLİNMİYOR'}
                                </span>
                                {u.lastSafetyUpdate && (
                                    <span className="text-xs text-slate-400">
                                        {new Date(u.lastSafetyUpdate).toLocaleTimeString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
