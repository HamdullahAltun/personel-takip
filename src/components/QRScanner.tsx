"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScannerState } from "html5-qrcode";
import { Loader2, AlertTriangle, RefreshCw, Camera } from "lucide-react";

export default function QRScanner({
    onScan,
    onError,
}: {
    onScan: (decodedText: string) => void,
    onError?: (error: Error) => void
}) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [permissionGranted, setPermissionGranted] = useState(false);

    // Use a unique ID for this instance to avoid DOM conflicts
    const scannerId = "qr-reader-container";

    const cleanupScanner = useCallback(async () => {
        if (!scannerRef.current) return;

        try {
            const state = scannerRef.current.getState();
            if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
                await scannerRef.current.stop();
            }
            scannerRef.current.clear();
        } catch (err) {
            console.warn("Cleanup warning:", err);
        }
        scannerRef.current = null;
    }, []);

    const startScanner = useCallback(async () => {
        setError("");
        setLoading(true);

        try {
            // Cleanup existing instance first
            await cleanupScanner();

            // Check if element exists
            const element = document.getElementById(scannerId);
            if (!element) {
                throw new Error("Scanner container not found in DOM");
            }

            const html5QrCode = new Html5Qrcode(scannerId, {
                verbose: false,
                formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
            });

            scannerRef.current = html5QrCode;

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                disableFlip: false
            };

            await html5QrCode.start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                    onScan(decodedText);
                },
                (errorMessage) => {
                    // Ignore parse errors as they are frequent while scanning
                }
            );

            setPermissionGranted(true);
            setLoading(false);

        } catch (err: any) {
            console.error("Scanner Start Error:", err);
            setLoading(false);

            let errorMessage = "Kamera başlatılamadı.";

            if (err?.name === 'NotAllowedError' || err?.message?.includes("Permission")) {
                errorMessage = "Kamera izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.";
            } else if (err?.name === 'NotFoundError') {
                errorMessage = "Kamera bulunamadı.";
            } else if (err?.name === 'NotReadableError') {
                errorMessage = "Kamera erişilemiyor. Başka bir uygulama kullanıyor olabilir.";
            }

            setError(errorMessage);
            if (onError) onError(err);
        }
    }, [onScan, onError, cleanupScanner]);

    useEffect(() => {
        let mounted = true;

        // Small delay to ensure DOM is ready and animations are done
        const timer = setTimeout(() => {
            if (mounted) {
                startScanner();
            }
        }, 500);

        return () => {
            mounted = false;
            clearTimeout(timer);
            cleanupScanner();
        };
    }, [startScanner, cleanupScanner]);

    const handleRetry = () => {
        startScanner();
    };

    return (
        <div className="relative w-full h-full min-h-[300px] bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center">

            {/* The Scanner Element */}
            <div id={scannerId} className="w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full bg-slate-900 z-10" />

            {/* Guide Overlay - Only show when scanning effectively */}
            {!loading && !error && permissionGranted && (
                <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
                    <div className="w-64 h-64 border-2 border-blue-500/50 rounded-3xl relative">
                        <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-blue-500 rounded-tl-xl -translate-x-1 -translate-y-1"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-blue-500 rounded-tr-xl translate-x-1 -translate-y-1"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-blue-500 rounded-bl-xl -translate-x-1 translate-y-1"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-blue-500 rounded-br-xl translate-x-1 translate-y-1"></div>

                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-blue-500/50 animate-scan"></div>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-30 text-white">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
                    <p className="text-sm text-slate-400">Kamera başlatılıyor...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center z-40 text-white p-6 text-center">
                    <div className="bg-red-500/10 p-4 rounded-full mb-4">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Kamera Hatası</h3>
                    <p className="text-slate-400 mb-6 text-sm max-w-[250px]">{error}</p>

                    <button
                        onClick={handleRetry}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Tekrar Dene
                    </button>
                </div>
            )}
        </div>
    );
}
