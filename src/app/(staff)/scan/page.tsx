"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import QRScanner from "@/components/QRScanner";
import { Loader2, CheckCircle2, XCircle, QrCode, ScanLine } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { generateUserToken } from "@/app/actions/qr";

export default function ScanPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'SCAN' | 'BADGE'>('SCAN');

    // Scan Status
    const [status, setStatus] = useState<"IDLE" | "PROCESSING" | "SUCCESS" | "ERROR">("IDLE");
    const [message, setMessage] = useState("");

    // Badge State
    const [qrValue, setQrValue] = useState("");
    const [timeLeft, setTimeLeft] = useState(30);

    // Badge Logic
    useEffect(() => {
        if (activeTab !== 'BADGE') return;

        let intervalId: NodeJS.Timeout;
        let timerId: NodeJS.Timeout;

        const updateQR = async () => {
            try {
                const token = await generateUserToken();
                setQrValue(token);
                setTimeLeft(30);
            } catch (err) {
                console.error(err);
            }
        };

        updateQR();
        intervalId = setInterval(updateQR, 30000);
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

        setStatus("PROCESSING");
        setMessage("Konum doğrulanıyor...");

        let location = null;
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 5000 // Reduced timeout
                });
            });
            location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
        } catch (locErr: any) {
            console.warn("Location error (proceeding without location):", locErr);
            // We proceed without location if error, API handles strictness
            // Do NOT throw here. 
        }

        setMessage("Giriş yapılıyor...");

        try {
            const res = await fetch("/api/attendance", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scannedContent: data, location }),
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.error);

            setStatus("SUCCESS");
            setMessage(result.message);

            setTimeout(() => {
                router.push("/dashboard");
            }, 2000);

        } catch (error: any) {
            setStatus("ERROR");
            setMessage(error.message || "Bir hata oluştu");
            setTimeout(() => setStatus("IDLE"), 4000);
        }
    };

    return (
        <div className="flex flex-col flex-1 w-full min-h-[60vh] bg-slate-900 text-white rounded-2xl overflow-hidden relative shadow-2xl">

            {/* Tab Switcher */}
            <div className="flex border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-md sticky top-0 z-20">
                <button
                    onClick={() => setActiveTab('SCAN')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'SCAN' ? 'text-blue-400 bg-slate-800 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <ScanLine className="h-4 w-4" />
                    OKUT
                </button>
                <div className="w-px bg-slate-700/50"></div>
                <button
                    onClick={() => setActiveTab('BADGE')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'BADGE' ? 'text-blue-400 bg-slate-800 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
                >
                    <QrCode className="h-4 w-4" />
                    KİMLİĞİM
                </button>
            </div>


            {/* Main Content Area - Updated to remove padding for full-screen scanner */}
            <div className="flex-1 flex flex-col items-center justify-center relative bg-black">

                {/* SCANNER VIEW */}
                {activeTab === 'SCAN' && (
                    <div className="absolute inset-0 w-full h-full">
                        <div className="absolute top-0 left-0 right-0 p-4 z-10 text-center pointer-events-none bg-gradient-to-b from-black/80 to-transparent">
                            <h2 className="text-sm text-slate-200 font-medium">Ofis QR kodunu okutun</h2>
                        </div>

                        <div className="w-full h-full relative">
                            {status === "SUCCESS" ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-green-600 animate-in zoom-in z-30 p-8 text-center text-white">
                                    <div>
                                        <CheckCircle2 className="h-20 w-20 mx-auto mb-4" />
                                        <p className="font-bold text-2xl">{message}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-full [&>section]:!h-full [&>section]:!w-full [&_video]:!object-cover">
                                    <QRScanner onScan={handleScan} />
                                </div>
                            )}

                            {status === "PROCESSING" && (
                                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 text-white gap-3">
                                    <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                                    <p className="font-medium">{message}</p>
                                </div>
                            )}

                            {status === "ERROR" && (
                                <div className="absolute bottom-20 left-4 right-4 bg-red-600/90 backdrop-blur p-4 rounded-xl text-center animate-in slide-in-from-bottom z-30 text-white shadow-lg border border-red-500/50">
                                    <XCircle className="h-6 w-6 mx-auto mb-1" />
                                    <p className="font-medium text-sm">{message}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* BADGE VIEW */}
                {activeTab === 'BADGE' && (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-300 p-6 bg-slate-900">
                        <div className="text-center space-y-1">
                            <h2 className="text-xl font-bold text-white">Personel Kimliği</h2>
                            <p className="text-slate-400 text-xs">Bu kodu yöneticiye gösterin</p>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-xl relative">
                            {qrValue ? (
                                <QRCodeSVG value={qrValue} size={220} level="H" />
                            ) : (
                                <div className="w-[220px] h-[220px] flex items-center justify-center bg-slate-50 rounded-xl">
                                    <Loader2 className="animate-spin text-slate-300 h-8 w-8" />
                                </div>
                            )}
                        </div>

                        <div className="text-center w-full max-w-[220px]">
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden relative mb-2">
                                <div
                                    className="h-full bg-blue-500 transition-all duration-1000 ease-linear rounded-full"
                                    style={{ width: `${(timeLeft / 30) * 100}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-blue-400 font-bold animate-pulse">
                                {timeLeft} saniye içinde yenilenecek
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
