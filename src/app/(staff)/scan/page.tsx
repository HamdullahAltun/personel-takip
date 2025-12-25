"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import QRScanner from "@/components/QRScanner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function ScanPage() {
    const router = useRouter();
    const [status, setStatus] = useState<"IDLE" | "PROCESSING" | "SUCCESS" | "ERROR">("IDLE");
    const [message, setMessage] = useState("");

    const handleScan = async (data: string) => {
        if (status === "PROCESSING" || status === "SUCCESS") return;

        setStatus("PROCESSING");
        setMessage("Konum doğrulanıyor...");

        try {
            // 1. Get Location
            let location = null;
            try {
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000
                    });
                });
                location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
            } catch (locErr: any) {
                console.error("Location error:", locErr);
                throw new Error("Konum alınamadı. Lütfen GPS izni verin ve tekrar deneyin.");
            }

            setMessage("Giriş yapılıyor...");

            // 2. Submit to API
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
        <div className="flex flex-col h-full bg-black text-white rounded-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 p-4 z-10 bg-gradient-to-b from-black/80 to-transparent">
                <h1 className="text-center font-bold text-lg">Giriş/Çıkış Yap</h1>
                <p className="text-center text-sm text-gray-300">Ofis QR kodunu okutun</p>
            </div>

            <div className="flex-1 flex items-center justify-center relative">
                {status === "SUCCESS" ? (
                    <div className="text-center p-8 bg-green-600 rounded-full animate-in zoom-in">
                        <CheckCircle2 className="h-16 w-16 mx-auto mb-2" />
                        <p className="font-bold text-xl">{message}</p>
                    </div>
                ) : (
                    <QRScanner onScan={handleScan} />
                )}

                {status === "PROCESSING" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                    </div>
                )}

                {status === "ERROR" && (
                    <div className="absolute bottom-10 left-4 right-4 bg-red-600 p-4 rounded-xl text-center animate-in slide-in-from-bottom">
                        <XCircle className="h-6 w-6 mx-auto mb-1" />
                        <p>{message}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
