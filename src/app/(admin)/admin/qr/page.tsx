"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import QRScanner from "@/components/QRScanner";
import { Loader2, CheckCircle2, AlertTriangle, Printer } from "lucide-react";
import { generateOfficeToken } from "@/app/actions/qr";

export default function AdminQRPage() {
    const [activeTab, setActiveTab] = useState<"GENERATE" | "SCAN">("GENERATE");
    const [status, setStatus] = useState<"IDLE" | "PROCESSING" | "SUCCESS" | "ERROR">("IDLE");
    const [message, setMessage] = useState("");
    const [qrValue, setQrValue] = useState("");
    const [locationError, setLocationError] = useState("");

    // Rotating QR Logic - useEffect moved below

    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
        if (activeTab !== "GENERATE") return;

        let intervalId: NodeJS.Timeout;
        let timerId: NodeJS.Timeout;

        const updateQR = async () => {
            try {
                // Get Location
                let lat, lng;
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    });
                    lat = position.coords.latitude;
                    lng = position.coords.longitude;
                    setLocationError("");
                } catch (e: any) {
                    console.warn("Location error:", e);
                    setLocationError("Konum izni verilmedi");
                }

                const token = await generateOfficeToken(lat, lng);
                setQrValue(token);
                setTimeLeft(30); // Reset timer
            } catch (err) {
                console.error("QR Gen Error", err);
            }
        };

        updateQR();

        // Exact 30s interval for regeneration
        intervalId = setInterval(updateQR, 30000);

        // 1s interval for countdown UI
        timerId = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        return () => {
            clearInterval(intervalId);
            clearInterval(timerId);
        };
    }, [activeTab]);

    const handleScan = async (data: string) => {
        if (status === "PROCESSING" || status === "SUCCESS") return;

        // Check for Legacy USER: or Signed JWT
        // We will just let the API validation handle the specific error if it's not a valid employee QR
        if (!data) return;

        setStatus("PROCESSING");

        try {
            const res = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scannedContent: data }),
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.error);

            setStatus("SUCCESS");
            setMessage(`İşlem Başarılı: ${result.message}`);

            setTimeout(() => {
                setStatus("IDLE");
            }, 3000); // Reset for next scan

        } catch (error: any) {
            setStatus("ERROR");
            setMessage(error.message);
            setTimeout(() => setStatus("IDLE"), 3000);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">QR İşlemleri</h1>
                    <p className="text-slate-500">Ofis QR kodu oluşturun veya personel kartı okutun</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab("GENERATE")}
                        className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === "GENERATE" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                        Ofis Giriş Kodu
                    </button>
                    <button
                        onClick={() => setActiveTab("SCAN")}
                        className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === "SCAN" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-slate-500 hover:bg-slate-50"}`}
                    >
                        Personel Tara
                    </button>
                </div>

                <div className="p-8">
                    {activeTab === "GENERATE" ? (
                        <div className="flex flex-col items-center space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white p-4 border border-slate-200 rounded-3xl shadow-lg relative group">
                                {qrValue ? (
                                    <QRCodeSVG value={qrValue} size={280} level="H" className="drop-shadow-sm" />
                                ) : (
                                    <div className="w-[280px] h-[280px] flex items-center justify-center bg-slate-50 rounded-xl">
                                        <Loader2 className="animate-spin text-slate-300 h-10 w-10" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4">
                                    <span className="relative flex h-3 w-3">
                                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${locationError ? 'bg-red-400' : 'bg-green-400'}`}></span>
                                        <span className={`relative inline-flex rounded-full h-3 w-3 ${locationError ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                    </span>
                                </div>
                            </div>

                            <div className="text-center max-w-sm w-full space-y-2">
                                <h3 className="text-lg font-bold text-slate-900">Ofis Giriş Noktası</h3>
                                <p className="text-sm text-slate-500">
                                    Bu kodu tablet veya ekranda açık tutun. Personel giriş/çıkış için okutmalıdır.
                                </p>

                                {/* Animated Countdown */}
                                <div className="pt-4">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                                        <span>Yenilenme</span>
                                        <span className={timeLeft < 6 ? "text-red-500" : "text-blue-500"}>{timeLeft}sn</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ease-linear rounded-full ${timeLeft < 6 ? "bg-red-500" : "bg-blue-500"}`}
                                            style={{ width: `${(timeLeft / 30) * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {locationError && (
                                    <div className="flex items-center gap-2 justify-center text-xs text-red-500 bg-red-50 p-3 rounded-xl mt-2 border border-red-100">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span>Konum alınamadı: {locationError || "GPS Kapalı"}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center animate-in fade-in duration-300">
                            {/* Scanner Container - Fixed Size for Stability */}
                            <div className="relative w-full max-w-[400px] h-[400px] bg-black rounded-3xl overflow-hidden shadow-2xl ring-4 ring-slate-100">

                                {/* Overlay Interface */}
                                <div className="absolute inset-0 z-20 pointer-events-none">
                                    {/* Corners */}
                                    <div className="absolute top-6 left-6 w-12 h-12 border-l-4 border-t-4 border-white/80 rounded-tl-2xl"></div>
                                    <div className="absolute top-6 right-6 w-12 h-12 border-r-4 border-t-4 border-white/80 rounded-tr-2xl"></div>
                                    <div className="absolute bottom-6 left-6 w-12 h-12 border-l-4 border-b-4 border-white/80 rounded-bl-2xl"></div>
                                    <div className="absolute bottom-6 right-6 w-12 h-12 border-r-4 border-b-4 border-white/80 rounded-br-2xl"></div>

                                    {/* Scanning Line Animation */}
                                    {status === "IDLE" && (
                                        <div className="absolute inset-0 animate-scan-line bg-gradient-to-b from-transparent via-blue-500/20 to-transparent h-1/2" />
                                    )}
                                </div>

                                {/* Content */}
                                {status === "IDLE" && (
                                    <QRScanner onScan={handleScan} />
                                )}

                                {status === "PROCESSING" && (
                                    <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                                        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                                        <p className="font-bold text-lg">Doğrulanıyor...</p>
                                    </div>
                                )}

                                {status === "SUCCESS" && (
                                    <div className="absolute inset-0 z-30 bg-emerald-600 flex flex-col items-center justify-center text-white animate-in zoom-in duration-300">
                                        <div className="bg-white/20 p-4 rounded-full mb-4">
                                            <CheckCircle2 className="h-16 w-16 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">Başarılı!</h3>
                                        <p className="text-white/90 px-8 text-center">{message.replace("İşlem Başarılı: ", "")}</p>
                                    </div>
                                )}

                                {status === "ERROR" && (
                                    <div className="absolute inset-0 z-30 bg-rose-600 flex flex-col items-center justify-center text-white animate-in zoom-in duration-300">
                                        <div className="bg-white/20 p-4 rounded-full mb-4">
                                            <AlertTriangle className="h-16 w-16 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2">Hata!</h3>
                                        <p className="text-white/90 px-8 text-center">{message}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 text-center space-y-1">
                                <p className="font-bold text-slate-900">Personel Kimlik Tarama</p>
                                <p className="text-sm text-slate-500">Personelin mobil uygulamasındaki QR kodunu okutun</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
