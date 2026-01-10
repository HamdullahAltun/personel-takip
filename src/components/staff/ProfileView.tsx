"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, User, Phone, Shield, Calendar, Trophy, Star, FileClock, Laptop, History, LayoutGrid, FileText } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import ScheduleWidget from "@/components/staff/ScheduleWidget";
import ProfileAvatar from "@/components/ProfileAvatar";
import ThemeEditor from "@/components/ThemeEditor";
import LevelCard from "@/components/staff/LevelCard";
import { motion, AnimatePresence } from "framer-motion";

interface ProfileViewProps {
    user: any;
}

export default function ProfileView({ user }: ProfileViewProps) {
    const [activeTab, setActiveTab] = useState<"general" | "assets" | "documents" | "history">("general");

    const tabs = [
        { id: "general", label: "Genel", icon: LayoutGrid },
        { id: "assets", label: "Varlık", icon: Laptop },
        { id: "documents", label: "Belge", icon: FileText },
        { id: "history", label: "Geçmiş", icon: History },
    ];

    return (
        <div className="space-y-6 max-w-md mx-auto pb-24">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Profilim</h1>
                <p className="text-slate-500">Kişisel bilgileriniz</p>
            </div>

            {/* Profile Header Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                <div className="px-6 pb-6 mt-[-40px]">
                    <div className="flex justify-between items-end">
                        <ProfileAvatar currentImage={user.profilePicture} userName={user.name} />
                        <div className="mb-2 hidden sm:block">
                            <a href={`/card/${user.id}`} target="_blank" className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors">
                                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                Kartvizit
                            </a>
                        </div>
                    </div>

                    <div className="mt-4">
                        <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                        <p className="text-slate-500">{user.role === 'ADMIN' ? 'Yönetici' : user.role === 'EXECUTIVE' ? 'Üst Yönetici' : 'Personel'}</p>

                        <a href={`/card/${user.id}`} target="_blank" className="sm:hidden inline-flex items-center gap-2 mt-3 px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            Kartvizit
                        </a>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex p-1 bg-slate-100 rounded-xl overflow-x-auto no-scrollbar relative">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap relative z-10 ${isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white rounded-lg shadow-sm"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <Icon className="h-4 w-4 relative z-10" />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === "general" && (
                        <div className="space-y-6">
                            {/* Gamification Level Card */}
                            <LevelCard points={user.points || 0} />

                            {/* Achievements */}
                            <div className="space-y-3">
                                <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm px-1">
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                    Başarımlarım
                                </h3>
                                {user.achievements.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {user.achievements.map((ach: any) => (
                                            <div key={ach.id} className="bg-white p-4 rounded-xl flex items-center gap-4 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-yellow-50 to-transparent rounded-bl-full opacity-50" />
                                                <div className="bg-gradient-to-br from-yellow-100 to-amber-100 p-3 rounded-full text-yellow-600 shadow-inner">
                                                    <Star className="h-5 w-5 fill-current" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">{ach.title}</h4>
                                                    {ach.description && <p className="text-slate-500 text-xs mt-0.5">{ach.description}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 rounded-xl p-6 text-center border border-dashed border-slate-200">
                                        <p className="text-xs text-slate-500 italic">Henüz bir başarım kazanılmadı.</p>
                                    </div>
                                )}
                            </div>

                            {/* Contact Info */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
                                <div className="flex items-center gap-4 p-4">
                                    <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Phone className="h-5 w-5" /></div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">Telefon</p>
                                        <p className="text-sm font-semibold text-slate-900">{user.phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4">
                                    <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Shield className="h-5 w-5" /></div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">Rol</p>
                                        <p className="text-sm font-semibold text-slate-900">{user.role}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-4">
                                    <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Calendar className="h-5 w-5" /></div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium">Kayıt Tarihi</p>
                                        <p className="text-sm font-semibold text-slate-900">{format(user.createdAt, "d MMMM yyyy", { locale: tr })}</p>
                                    </div>
                                </div>
                            </div>

                            <ScheduleWidget schedules={user.workSchedules} />
                            <ThemeEditor />

                            <button
                                onClick={async () => {
                                    await fetch("/api/auth/logout", { method: "POST" });
                                    window.location.href = "/login";
                                }}
                                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <LogOut className="h-5 w-5" />
                                Çıkış Yap
                            </button>
                        </div>
                    )}

                    {activeTab === "assets" && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 min-h-[300px]">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900">Zimmetli Varlıklar</h3>
                                    <p className="text-xs text-slate-500">Üzerinize kayıtlı demirbaşlar</p>
                                </div>
                                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><Laptop className="h-5 w-5" /></div>
                            </div>

                            {user.assets && user.assets.length > 0 ? (
                                <div className="space-y-3">
                                    {user.assets.map((asset: any) => (
                                        <div key={asset.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div>
                                                <p className="font-semibold text-sm text-slate-900">{asset.name}</p>
                                                <p className="text-xs text-slate-500">{asset.type} • {asset.serialNumber || 'S/N Yok'}</p>
                                            </div>
                                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                Aktif
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                        <Laptop className="h-8 w-8" />
                                    </div>
                                    <p className="text-sm text-slate-500 italic">Üzerinize zimmetli demirbaş bulunmuyor.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "documents" && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 min-h-[300px]">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="font-bold text-slate-900">Belgeler</h3>
                                    <p className="text-xs text-slate-500">Yüklü sözleşme ve evraklar</p>
                                </div>
                                <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><FileText className="h-5 w-5" /></div>
                            </div>

                            {user.documents && user.documents.length > 0 ? (
                                <div className="space-y-3">
                                    {user.documents.map((doc: any) => (
                                        <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded border border-slate-200 text-slate-500 group-hover:border-blue-200 group-hover:text-blue-500 transition-colors">
                                                    <FileClock className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-slate-900">{doc.title}</p>
                                                    <p className="text-xs text-slate-500">{format(doc.uploadedAt, 'd MMM yyyy')}</p>
                                                </div>
                                            </div>
                                            <Link href={doc.fileUrl} target="_blank" className="text-xs font-bold text-blue-600 hover:underline">
                                                Görüntüle
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                                    <p className="text-sm text-slate-500">Henüz belge yüklenmemiş.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "history" && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden p-4 space-y-4">
                            <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <History className="h-4 w-4 text-slate-500" />
                                Çalışma Geçmişi
                            </h3>
                            <AttendanceCalendar records={user.attendance} />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
