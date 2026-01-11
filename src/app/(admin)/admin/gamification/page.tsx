"use client";

import { useState } from "react";
import { Trophy, Medal, Crown, Star, Plus } from "lucide-react";

export default function GamificationAdminPage() {
    // Mock data for now as we don't have full backend logic for leaderboard editing yet
    // But we are creating the UI shell as requested.
    const [activeTab, setActiveTab] = useState('LEADERBOARD'); // LEADERBOARD, BADGES

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Oyunlaştırma Yönetimi</h1>
                    <p className="text-slate-500">Rozetler, puanlar ve liderlik tablosu ayarları.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('LEADERBOARD')}
                    className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'LEADERBOARD' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Liderlik Tablosu
                </button>
                <button
                    onClick={() => setActiveTab('BADGES')}
                    className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'BADGES' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Rozet Yönetimi
                </button>
            </div>

            {activeTab === 'LEADERBOARD' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Top 3 Preview */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Crown className="text-yellow-500 h-5 w-5" />
                            Güncel Sıralama (Ay)
                        </h3>

                        <div className="space-y-4">
                            {[1, 2, 3, 4, 5].map((rank) => (
                                <div key={rank} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl transition">
                                    <div className={`
                                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                        ${rank === 1 ? 'bg-yellow-100 text-yellow-600' :
                                            rank === 2 ? 'bg-slate-200 text-slate-600' :
                                                rank === 3 ? 'bg-orange-100 text-orange-600' : 'bg-white border text-slate-400'}
                                    `}>
                                        {rank}
                                    </div>
                                    <div className="h-10 w-10 bg-slate-200 rounded-full" />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-slate-700">Personel Adı {rank}</h4>
                                        <p className="text-xs text-slate-400">Satış Departmanı</p>
                                    </div>
                                    <div className="font-mono font-bold text-indigo-600">
                                        {1250 - (rank * 50)} Puan
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                        <h3 className="font-bold text-slate-800">Puan Ayarları</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Görev Tamamlama</label>
                                <div className="flex gap-2">
                                    <input type="number" defaultValue={50} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                    <span className="self-center text-sm text-slate-400">puan</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">Erken Gelme (Vardiya)</label>
                                <div className="flex gap-2">
                                    <input type="number" defaultValue={10} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                    <span className="self-center text-sm text-slate-400">puan</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1 block">LMS Eğitim Bitirme</label>
                                <div className="flex gap-2">
                                    <input type="number" defaultValue={100} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                                    <span className="self-center text-sm text-slate-400">puan</span>
                                </div>
                            </div>

                            <button className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition">
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'BADGES' && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="flex justify-between mb-6">
                        <h3 className="font-bold text-slate-800">Tanımlı Rozetler</h3>
                        <button className="text-indigo-600 text-sm font-bold hover:bg-indigo-50 px-3 py-1 rounded-lg transition flex items-center gap-1">
                            <Plus className="h-4 w-4" /> Yeni Rozet
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { name: 'Hız Canavarı', icon: '🚀', desc: 'Haftalık 10 görev tamamla' },
                            { name: 'Takım Oyuncusu', icon: '🤝', desc: '5 kişiden teşekkür al' },
                            { name: 'Kitap Kurdu', icon: '📚', desc: 'Tüm eğitimleri tamamla' },
                            { name: 'Erkenci Kuş', icon: '🌅', desc: '1 ay geç kalma' },
                        ].map((badge, i) => (
                            <div key={i} className="border border-slate-200 rounded-xl p-4 text-center hover:border-indigo-300 transition cursor-pointer group hover:bg-indigo-50/30">
                                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform block">{badge.icon}</div>
                                <h4 className="font-bold text-slate-800 text-sm">{badge.name}</h4>
                                <p className="text-xs text-slate-400 mt-1">{badge.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
