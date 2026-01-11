"use client";

import { useState } from "react";
import { TrendingUp, Award, BookOpen, Target, ArrowRight, Star } from "lucide-react";

export default function CareerPage() {
    // Mock data based on schema structure
    const currentLevel = {
        title: "Kıdemli Satış Uzmanı",
        level: 3,
        nextLevel: "Satış Takım Lideri"
    };

    const nextSteps = [
        { id: 1, title: "Liderlik 101 Eğitimi", type: "LMS", status: "COMPLETED" },
        { id: 2, title: "Ekip Yönetimi Sertifikası", type: "LMS", status: "IN_PROGRESS", progress: 65 },
        { id: 3, title: "Mentörlük Programı", type: "TASK", status: "PENDING" },
    ];

    const skills = [
        { name: "Müzakere", score: 85, target: 90 },
        { name: "Takım Yönetimi", score: 60, target: 80 },
        { name: "Stratejik Planlama", score: 45, target: 70 },
    ];

    return (
        <div className="max-w-xl mx-auto pb-24 space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 p-3 rounded-2xl text-white shadow-lg shadow-violet-200">
                    <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Kariyer Yolculuğum</h1>
                    <p className="text-slate-500 text-xs">Hedeflerine ulaşmak için sana özel plan.</p>
                </div>
            </div>

            {/* Current Status Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 text-slate-100">
                    <Award className="h-24 w-24 opacity-20 -rotate-12" />
                </div>

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 px-3 py-1 rounded-full text-xs font-bold mb-3">
                        <Star className="h-3 w-3 fill-violet-700" />
                        Seviye {currentLevel.level}
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">{currentLevel.title}</h2>
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <span>Sonraki Hedef:</span>
                        <span className="font-bold text-indigo-600 flex items-center gap-1">
                            {currentLevel.nextLevel} <ArrowRight className="h-3 w-3" />
                        </span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                        <span>İlerleme</span>
                        <span>%72</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 w-[72%] rounded-full shadow-lg shadow-fuchsia-200" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 text-center">
                        Bir sonraki seviyeye geçmek için 2 yetkinlik daha geliştirmen gerekiyor.
                    </p>
                </div>
            </div>

            {/* AI Recommendations */}
            <div className="space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-500" />
                    Gelişim Hedefleri
                </h3>

                <div className="bg-white rounded-2xl border border-slate-100 p-1">
                    {skills.map((skill, i) => (
                        <div key={i} className="p-4 border-b border-slate-50 last:border-0">
                            <div className="flex justify-between mb-2">
                                <span className="font-bold text-slate-700 text-sm">{skill.name}</span>
                                <span className="text-xs font-bold text-slate-400">
                                    {skill.score} / <span className="text-indigo-600">{skill.target}</span>
                                </span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${skill.score >= skill.target ? 'bg-green-500' : 'bg-slate-300'}`}
                                    style={{ width: `${(skill.score / 100) * 100}%` }}
                                />
                                <div
                                    className="h-full bg-indigo-500/30 -mt-2"
                                    style={{ width: `${(skill.target / 100) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Plan */}
            <div className="space-y-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-indigo-500" />
                    Aksiyon Planı
                </h3>

                <div className="space-y-3">
                    {nextSteps.map(step => (
                        <div key={step.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center gap-4">
                            <div className={`p-3 rounded-full ${step.status === 'COMPLETED' ? 'bg-green-100 text-green-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                {step.status === 'COMPLETED' ? <CheckCircle className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-slate-800 text-sm">{step.title}</h4>
                                <p className="text-[10px] text-slate-400 font-medium bg-slate-50 inline-block px-2 py-0.5 rounded mt-1">
                                    {step.type === 'LMS' ? 'Eğitim' : 'Görev'}
                                </p>
                            </div>
                            {step.status === 'IN_PROGRESS' && (
                                <div className="text-xs font-bold text-indigo-600">
                                    %{step.progress}
                                </div>
                            )}
                            {step.status === 'PENDING' && (
                                <button className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold">
                                    Başla
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function CheckCircle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
        </svg>
    )
}
