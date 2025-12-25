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
                        <div className="flex flex-col items-center space-y-6">
                            <div className="bg-white p-4 border rounded-xl shadow-sm relative">
                                {qrValue ? (
                                    <QRCodeSVG value={qrValue} size={256} />
                                ) : (
                                    <div className="w-64 h-64 flex items-center justify-center bg-slate-100 rounded">
                                        <Loader2 className="animate-spin text-slate-400" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    <div className={`w-3 h-3 rounded-full ${locationError ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}
                                        title={locationError || "Konum aktif, QR güncelleniyor"}
                                    />
                                </div>
                            </div>

                            <div className="text-center max-w-sm w-full">
                                <p className="font-bold text-slate-900">Dinamik Ofis Giriş Kodu</p>
                                <p className="text-sm text-slate-500 mt-1">
                                    QR Kodun her 30 saniyede bir otomatik yenilenir.
                                </p>

                                {/* Animated Countdown Bar */}
                                <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden relative">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-1000 ease-linear rounded-full"
                                        style={{ width: `${(timeLeft / 30) * 100}%` }}
                                    />
                                </div>
                                <p className="text-xs text-blue-500 font-bold mt-1 text-right animate-pulse">
                                    {timeLeft} saniye sonra değişecek
                                </p>

                                {locationError && (
                                    <p className="text-xs text-red-500 mt-2 font-medium bg-red-50 p-2 rounded">
                                        Konum alınamadı: {locationError}. Sabit modda çalışıyor.
                                    </p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-md mx-auto aspect-square bg-black rounded-2xl overflow-hidden relative">
                            {status === "SUCCESS" ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-500 text-white p-6 text-center animate-in zoom-in">
                                    <CheckCircle2 className="h-16 w-16 mb-4" />
                                    <p className="text-xl font-bold">{message}</p>
                                </div>
                            ) : status === "ERROR" ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600 text-white p-6 text-center animate-in zoom-in">
                                    <AlertTriangle className="h-16 w-16 mb-4" />
                                    <p className="text-xl font-bold">{message}</p>
                                </div>
                            ) : (
                                <QRScanner onScan={handleScan} />
                            )}

                            {status === "PROCESSING" && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
