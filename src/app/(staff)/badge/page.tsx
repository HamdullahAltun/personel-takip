"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Loader2 } from "lucide-react";
import { generateUserToken } from "@/app/actions/qr";

export default function BadgePage() {
    const [qrValue, setQrValue] = useState("");
    const [timeLeft, setTimeLeft] = useState(30);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        let timerId: NodeJS.Timeout;

        const updateQR = async () => {
            try {
                const token = await generateUserToken();
                setQrValue(token);
                setTimeLeft(30);
            } catch (err) {
                console.error("QR Gen Error", err);
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
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-slate-900">Personel Kimliği</h1>
                <p className="text-slate-500">Bu kodu yöneticiye gösterin</p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 relative">
                {qrValue ? (
                    <QRCodeSVG value={qrValue} size={250} level="H" />
                ) : (
                    <div className="w-[250px] h-[250px] flex items-center justify-center bg-slate-50">
                        <Loader2 className="animate-spin text-slate-300" />
                    </div>
                )}
            </div>

            <div className="text-center w-full max-w-[250px]">
                {/* Animated Countdown Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden relative mb-2">
                    <div
                        className="h-full bg-blue-500 transition-all duration-1000 ease-linear rounded-full"
                        style={{ width: `${(timeLeft / 30) * 100}%` }}
                    />
                </div>
                <p className="text-xs text-blue-500 font-bold animate-pulse">
                    {timeLeft} saniye sonra değişecek
                </p>
            </div>
        </div>
    );
}
