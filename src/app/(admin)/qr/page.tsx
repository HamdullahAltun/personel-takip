"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ScanLine, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";

export default function AdminQRPage() {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState(15);
    const [error, setError] = useState<string | null>(null);

    const fetchToken = async () => {
        try {
            // setLoading(true); // Don't block UI on refresh, only initial
            const res = await fetch('/api/admin/qr-token');
            if (res.ok) {
                const data = await res.json();
                setToken(data.token);
                setTimeLeft(15);
                setError(null);
            } else {
                setError("Token alınamadı");
            }
        } catch (err) {
            setError("Bağlantı hatası");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchToken();
        const interval = setInterval(fetchToken, 15000); // Fetch new token every 15s

        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => {
            clearInterval(interval);
            clearInterval(timer);
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8 p-4">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-3">
                    <ScanLine className="h-10 w-10 text-blue-600" />
                    Personel Giriş/Çıkış
                </h1>
                <p className="text-slate-500">Personelin okutması için dinamik QR kod</p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-200 flex flex-col items-center relative overflow-hidden">
                {/* Security Badge */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    GÜVENLİ BAĞLANTI
                </div>

                {loading ? (
                    <div className="h-64 w-64 flex items-center justify-center bg-slate-50 rounded-2xl">
                        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                    </div>
                ) : token ? (
                    <div className="relative group">
                        <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-inner">
                            <QRCodeSVG
                                value={token}
                                size={280}
                                level={'H'}
                                includeMargin={true}
                                fgColor="#1e293b"
                            />
                        </div>
                        {/* Blur effect when expired (optional visual) */}
                        {timeLeft <= 2 && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                <span className="text-slate-400 font-bold text-sm">Yenileniyor...</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="h-64 w-64 flex items-center justify-center bg-red-50 text-red-500 rounded-2xl border border-red-100">
                        <div className="text-center p-4">
                            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                            <p>{error || "Servis Hatası"}</p>
                        </div>
                    </div>
                )}

                {/* Secure Counter */}
                <div className="mt-8 w-full max-w-[200px]">
                    <div className="flex justify-between text-xs text-slate-400 font-medium mb-2">
                        <span>Güvenlik Yenileme</span>
                        <span>{timeLeft}sn</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden w-full">
                        <div
                            className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                            style={{ width: `${(timeLeft / 15) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 text-blue-800 px-6 py-4 rounded-xl text-sm max-w-md text-center border border-blue-100">
                <p>Bu QR kod her 15 saniyede bir değişir. Ekran görüntüsü ile yapılan girişler geçersiz sayılacaktır.</p>
            </div>
        </div>
    );
}
