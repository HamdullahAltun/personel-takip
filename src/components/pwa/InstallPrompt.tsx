"use client";

import { useState, useEffect } from "react";
import { Download, Share, PlusSquare, X } from "lucide-react";

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showIOS, setShowIOS] = useState(false);
    const [showAndroid, setShowAndroid] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(iOS);

        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        if (isStandalone) return;

        // Android/Desktop Prompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowAndroid(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Show iOS prompt after delay if not installed
        if (iOS) {
            const timer = setTimeout(() => setShowIOS(true), 10000); // 10s delay
            return () => clearTimeout(timer);
        }

        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setShowAndroid(false);
        }
    };

    if (!showIOS && !showAndroid) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5 duration-500">
            <div className="bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-slate-700 max-w-md mx-auto relative overflow-hidden">
                {/* Shine effect */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-indigo-500/30 rounded-full blur-3xl animate-pulse"></div>

                <button
                    onClick={() => { setShowIOS(false); setShowAndroid(false); }}
                    className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white transition"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="flex gap-4 pr-6">
                    <div className="bg-indigo-600 rounded-xl p-3 flex items-center justify-center shrink-0">
                        <Download className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-bold text-base">Uygulamayı Yükle</h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            Daha hızlı erişim ve bildirimler için ana ekrana ekleyin.
                        </p>

                        {showAndroid && (
                            <button
                                onClick={handleInstallClick}
                                className="mt-3 bg-white text-indigo-900 px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-50 transition w-full md:w-auto"
                            >
                                Yükle / Ana Ekrana Ekle
                            </button>
                        )}

                        {showIOS && (
                            <div className="mt-2 text-xs text-slate-400 flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className="bg-slate-800 p-1 rounded"><Share className="h-3 w-3" /></span>
                                    <span>ikonuna tıkla</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="bg-slate-800 p-1 rounded"><PlusSquare className="h-3 w-3" /></span>
                                    <span>"Ana Ekrana Ekle"yi seç</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
