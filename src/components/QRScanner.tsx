"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Loader2, Camera, RefreshCw, AlertTriangle } from "lucide-react";

export default function QRScanner({
    onScan,
}: {
    onScan: (decodedText: string) => void,
    onError?: (error: any) => void
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [debugInfo, setDebugInfo] = useState<string>("");
    const codeReader = useRef<BrowserMultiFormatReader | null>(null);

    useEffect(() => {
        let mounted = true;

        // Ensure browser environment
        if (typeof window === 'undefined') return;

        const reader = new BrowserMultiFormatReader();
        codeReader.current = reader;

        const startCamera = async () => {
            try {
                // Check Secure Context
                if (!window.isSecureContext) {
                    throw new Error(`Güvenli bağlantı (HTTPS) yok. Context: ${window.location.protocol}`);
                }

                // Check MediaDevices support
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    throw new Error("Tarayıcınız kamera erişimini desteklemiyor.");
                }

                // Debug: List devices
                try {
                    const devices = await navigator.mediaDevices.enumerateDevices();
                    const videoCtx = devices.filter(d => d.kind === 'videoinput');
                    setDebugInfo(`Bulunan Kamera Sayısı: ${videoCtx.length} (${videoCtx.map(d => d.label || 'İsimsiz').join(', ')})`);

                    if (videoCtx.length === 0) {
                        // Some browsers hide devices until permission usage.
                        console.warn("No devices found, but attempting decode anyway as permissions might be pending.");
                    }
                } catch (e) {
                    console.warn("Enumerate error:", e);
                }

                // Actually request stream to see if permission prompt happens
                // The library does this internaly, but doing it manually helps debug.

                await reader.decodeFromConstraints(
                    {
                        video: {
                            facingMode: "environment"
                        }
                    },
                    videoRef.current!,
                    (result, err) => {
                        if (result && mounted) {
                            onScan(result.getText());
                        }
                    }
                );

                if (mounted) setLoading(false);

            } catch (err: any) {
                console.error("Camera Start Error:", err);
                if (mounted) {
                    if (err.name === 'NotAllowedError') {
                        setError("Kamera izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.");
                    } else if (err.name === 'NotFoundError') {
                        setError("Kamera bulunamadı.");
                    } else {
                        setError(err.message || "Bilinmeyen kamera hatası");
                    }
                    setLoading(false);
                }
            }
        };

        // Delay slightly to ensure render
        setTimeout(startCamera, 500);

        return () => {
            mounted = false;
            reader.reset();
        };
    }, [onScan]);

    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="relative w-full h-[400px] bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center">

            {/* Camera View */}
            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline // Critical for iOS
            />

            {/* UI Overlay */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-x-12 inset-y-24 border-2 border-white/50 rounded-2xl flex flex-col items-center justify-center">
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-10 text-white">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
                    <p>Kamera başlatılıyor...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-20 text-white p-6 text-center">
                    <div className="bg-red-500/20 p-4 rounded-full mb-4">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Hata Oluştu</h3>
                    <p className="text-red-200 mb-4 bg-red-900/20 p-2 rounded text-xs font-mono break-all">{error}</p>

                    {debugInfo && <p className="text-xs text-slate-500 mb-4">{debugInfo}</p>}

                    <button
                        onClick={handleRetry}
                        className="bg-white text-black px-6 py-3 rounded-xl font-semibold flex items-center gap-2 pointer-events-auto"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Tekrar Dene
                    </button>
                </div>
            )}
        </div>
    );
}
