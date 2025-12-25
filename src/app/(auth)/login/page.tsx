"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, Lock } from "lucide-react";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, Auth } from "firebase/auth";

export default function LoginPage() {
    const router = useRouter();
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [configError, setConfigError] = useState("");

    useEffect(() => {
        // Check if auth is initialized
        if (!auth) {
            setConfigError("Firebase yapılandırması eksik. Lütfen yönetici ile iletişime geçin.");
            return;
        }

        // Initialize Recaptcha with proper cleanup
        const initRecaptcha = async () => {
            try {
                if (window.recaptchaVerifier) {
                    try {
                        await window.recaptchaVerifier.clear();
                    } catch (e) {
                        console.warn("Old recaptcha clear error", e);
                    }
                    window.recaptchaVerifier = null;
                }

                // Ensure the element exists
                const container = document.getElementById('recaptcha-container');
                if (container) {
                    window.recaptchaVerifier = new RecaptchaVerifier(auth as Auth, 'recaptcha-container', {
                        'size': 'invisible',
                        'callback': () => {
                            // reCAPTCHA solved
                        },
                        'expired-callback': () => {
                            // Response expired
                            if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
                            window.recaptchaVerifier = null;
                        }
                    });
                }
            } catch (e: any) {
                console.error("Recaptcha Init Error", e);
            }
        };

        initRecaptcha();

        return () => {
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch (e) {
                    console.warn("Cleanup clear error", e);
                }
                window.recaptchaVerifier = null;
            }
        };
    }, []);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!auth) {
            setError("Sistem yapılandırma hatası.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            let formattedPhone = phone.replace(/\s/g, '');
            if (formattedPhone.startsWith('0')) formattedPhone = formattedPhone.substring(1);
            if (!formattedPhone.startsWith('+')) formattedPhone = '+90' + formattedPhone;

            const appVerifier = window.recaptchaVerifier;
            if (!appVerifier) {
                setError("Recaptcha doğrulama sistemi yüklenemedi. Lütfen sayfayı yenileyiniz.");
                setLoading(false);
                return;
            }

            const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(result);
            setStep("OTP");
        } catch (err: any) {
            console.error(err);
            if (err.code === 'auth/error-code:-39') {
                setError(`Doğrulama hatası (-39). Lütfen "${window.location.hostname}" adresini Firebase Authorized Domains listesine ekleyiniz.`);
            } else if (err.code === 'auth/invalid-app-credential') {
                setError(`Uygulama kimlik hatası. Domain yetkisi yok: ${window.location.hostname}`);
            } else {
                setError(err.code === 'auth/invalid-api-key' ? "API Anahtarı hatası" : (err.message || "SMS gönderilemedi."));
            }
            // Only clear if it exists
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                } catch { /* ignore */ }
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (!confirmationResult) throw new Error("Oturum hatası. Sayfayı yenileyin.");

            const credential = await confirmationResult.confirm(otp);
            const idToken = await credential.user.getIdToken();

            // Establish Session with Backend
            const res = await fetch("/api/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Giriş başarısız");

            // Redirect based on role
            if (data.user.role === "ADMIN") {
                router.push("/admin/dashboard");
            } else {
                router.push("/dashboard");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Hatalı kod");
        } finally {
            setLoading(false);
        }
    };

    if (configError) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 text-white">
                <div className="bg-red-500/10 border border-red-500/50 p-6 rounded-xl max-w-md text-center">
                    <h1 className="text-xl font-bold mb-2">Yapılandırma Hatası</h1>
                    <p>{configError}</p>
                    <p className="text-xs text-slate-400 mt-4">.env dosyasını kontrol edin.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-xl w-full max-w-md text-white">
                <h1 className="text-3xl font-bold text-center mb-8">
                    {step === "PHONE" ? "Personel Girişi" : "Doğrulama"}
                </h1>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                {step === "PHONE" ? (
                    <form onSubmit={handleSendOtp} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">
                                Telefon Numarası
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <input
                                    type="tel"
                                    placeholder="0555 555 55 55"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div id="recaptcha-container"></div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Kod Gönder"
                            )}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 ml-1">
                                Doğrulama Kodu
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="123456"
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all tracking-widest text-lg"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                    required
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-green-600/30 flex items-center justify-center"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Giriş Yap"
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep("PHONE")}
                            className="w-full text-slate-400 text-sm hover:text-white transition-colors"
                        >
                            Telefonu Değiştir
                        </button>
                    </form>
                )}
            </div>

            {/* Type definition for Window */}
            <script dangerouslySetInnerHTML={{
                __html: `
              window.recaptchaVerifier = null;
            `}} />
        </div>
    );
}

declare global {
    interface Window {
        recaptchaVerifier: any;
    }
}
