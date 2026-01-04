"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";

export default function QRScanner({
    onScan,
    onError,
}: {
    onScan: (decodedText: string) => void,
    onError?: (error: Error) => void
}) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        let mounted = true;
        const scannerId = "qr-reader";

        const startScanner = async () => {
            try {
                // Check if element exists
                const element = document.getElementById(scannerId);
                if (!element) {
                    console.warn("Scanner element not found");
                    return;
                }

                // Cleanup previous instance if exists
                if (scannerRef.current) {
                    try {
                        if (scannerRef.current.isScanning) {
                            await scannerRef.current.stop();
                        }
                        await scannerRef.current.clear();
                    } catch (e) {
                        console.warn("Cleanup error:", e);
                    }
                }

                const formatsToSupport = [
                    Html5QrcodeSupportedFormats.QR_CODE,
                ];

                const html5QrCode = new Html5Qrcode(scannerId, {
                    verbose: false,
                    formatsToSupport: formatsToSupport
                });

                scannerRef.current = html5QrCode;

                const qrCodeSuccessCallback = (decodedText: string) => {
                    if (mounted) {
                        onScan(decodedText);
                    }
                };

                const qrCodeErrorCallback = (errorMessage: string) => {
                    // console.warn(errorMessage);
                };

                // Config without fixed aspect ratio for better compatibility
                const config = {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                };

                // Start scanning
                await html5QrCode.start(
                    { facingMode: "environment" },
                    config,
                    qrCodeSuccessCallback,
                    qrCodeErrorCallback
                );

                if (mounted) {
                    setLoading(false);
                }

            } catch (err: unknown) {
                console.error("Scanner Error:", err);
                const error = err as Error;
                if (mounted) {
                    setLoading(false);
                    if (error.name === 'NotAllowedError' || error.message?.includes("Permission")) {
                        setError("Kamera izni verilmedi. Lütfen tarayıcı ayarlarından izin verin.");
                    } else if (error.name === 'NotFoundError' || error.message?.includes("device")) {
                        setError("Kamera cihazı bulunamadı.");
                    } else {
                        setError("Kamera başlatılamadı. (" + (error.message || "Bilinmeyen Hata") + ")");
                    }
                    if (onError) onError(error);
                }
            }
        };

        // Small delay to ensure DOM is ready
        const timeoutId = setTimeout(() => {
            startScanner();
        }, 100);

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
            if (scannerRef.current) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear();
                }).catch(err => {
                    console.error("Failed to stop scanner", err);
                });
            }
        };
    }, [onScan, onError]);

    const handleRetry = () => {
        window.location.reload();
    };

    return (
        <div className="relative w-full h-full min-h-[300px] bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center">

            {/* The Scanner Element */}
            <div id="qr-reader" className="w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full bg-slate-900 z-10" />

            {/* UI Overlay */}
            <div className="absolute inset-0 pointer-events-none z-20">
                <div className="absolute inset-x-12 inset-y-24 border-2 border-white/50 rounded-2xl flex flex-col items-center justify-center box-border">
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-30 text-white">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
                    <p>Kamera başlatılıyor...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-40 text-white p-6 text-center">
                    <div className="bg-red-500/20 p-4 rounded-full mb-4">
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Hata Oluştu</h3>
                    <p className="text-red-200 mb-4 bg-red-900/20 p-2 rounded text-xs font-mono break-all">{error}</p>

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
