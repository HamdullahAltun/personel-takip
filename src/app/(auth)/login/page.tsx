"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, Lock, Mail, CheckCircle } from "lucide-react";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, ConfirmationResult, Auth } from "firebase/auth";

export default function LoginPage() {
    const router = useRouter();

    // Auth Method State
    const [loginMethod, setLoginMethod] = useState<"PHONE" | "EMAIL">("PHONE");

    // Phone Auth State
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    // Email Auth State
    const [email, setEmail] = useState("");
    const [emailSent, setEmailSent] = useState(false);

    // Common State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [configError, setConfigError] = useState("");

    // Initialize Firebase
    useEffect(() => {
        if (!auth) {
            setConfigError("Firebase yapılandırması eksik.");
            return;
        }

        // Check if this is an Email Link redirect
        if (isSignInWithEmailLink(auth, window.location.href)) {
            let emailForSignIn = window.localStorage.getItem('emailForSignIn');
            if (!emailForSignIn) {
                emailForSignIn = window.prompt('Lütfen doğrulama için e-posta adresinizi tekrar giriniz:');
            }
            if (emailForSignIn) {
                setLoading(true);
                signInWithEmailLink(auth, emailForSignIn, window.location.href)
                    .then(async (result) => {
                        window.localStorage.removeItem('emailForSignIn');
                        const idToken = await result.user.getIdToken();
                        await establishSession(idToken);
                    })
                    .catch((error) => {
                        console.error(error);
                        setError("E-posta linki geçersiz veya süresi dolmuş.");
                        setLoading(false);
                    });
            }
        }

        // Initialize Recaptcha
        const initRecaptcha = async () => {
            // ... existing recaptcha logic ...
            try {
                if (window.recaptchaVerifier) {
                    try { await window.recaptchaVerifier.clear(); } catch { }
                    window.recaptchaVerifier = null;
                }
                const container = document.getElementById('recaptcha-container');
                if (container) {
                    window.recaptchaVerifier = new RecaptchaVerifier(auth as Auth, 'recaptcha-container', {
                        'size': 'invisible'
                    });
                }
            } catch (e) { console.error(e); }
        };

        if (loginMethod === 'PHONE' && !emailSent) {
            initRecaptcha();
        }

        return () => {
            if (window.recaptchaVerifier) {
                try { window.recaptchaVerifier.clear(); } catch { }
                window.recaptchaVerifier = null;
            }
        };
    }, [loginMethod]);

    const establishSession = async (idToken: string) => {
        try {
            const res = await fetch("/api/auth/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Giriş başarısız");

            if (data.user.role === "ADMIN") router.push("/admin/dashboard");
            else if (data.user.role === "EXECUTIVE") router.push("/executive/dashboard");
            else router.push("/dashboard");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Giriş yapılamadı.");
            setLoading(false);
        }
    };

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            let formattedPhone = phone.replace(/\s/g, '');
            if (formattedPhone.startsWith('0')) formattedPhone = formattedPhone.substring(1);
            if (!formattedPhone.startsWith('+')) formattedPhone = '+90' + formattedPhone;

            const appVerifier = window.recaptchaVerifier;
            if (!appVerifier) throw new Error("Recaptcha hatası. Sayfayı yenileyin.");

            const result = await signInWithPhoneNumber(auth!, formattedPhone, appVerifier);
            setConfirmationResult(result);
            setStep("OTP");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "SMS gönderilemedi.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            if (!confirmationResult) throw new Error("Oturum hatası.");
            const credential = await confirmationResult.confirm(otp);
            const idToken = await credential.user.getIdToken();
            await establishSession(idToken);
        } catch (err: any) {
            setError("Hatalı kod veya süre doldu.");
            setLoading(false);
        }
    };

    const handleSendEmailLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const actionCodeSettings = {
                url: window.location.href, // Redirect back to this page
                handleCodeInApp: true,
            };
            await sendSignInLinkToEmail(auth!, email, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', email);
            setEmailSent(true);
        } catch (err: any) {
            console.error(err);
            setError(`E-posta gönderilemedi: ${err.message}. Lütfen Firebase Console'da "Authorized Domains" ayarlarını kontrol edin.`);
        } finally {
            setLoading(false);
        }
    };

    if (configError) return <div className="text-white bg-slate-900 min-h-screen flex items-center justify-center">{configError}</div>;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
            <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-xl w-full max-w-md text-white">
                <h1 className="text-3xl font-bold text-center mb-6">
                    Personel Girişi
                </h1>

                {/* Tabs */}
                <div className="flex bg-slate-900/50 p-1 rounded-xl mb-6">
                    <button
                        onClick={() => { setLoginMethod("PHONE"); setStep("PHONE"); setError(""); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${loginMethod === 'PHONE' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Phone className="h-4 w-4" />
                        Telefon
                    </button>
                    <button
                        onClick={() => { setLoginMethod("EMAIL"); setEmailSent(false); setError(""); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${loginMethod === 'EMAIL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Mail className="h-4 w-4" />
                        E-Posta
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* EMAIL AUTH FLOW */}
                {loginMethod === 'EMAIL' && (
                    !emailSent ? (
                        <form onSubmit={handleSendEmailLink} className="space-y-6 animate-in fade-in">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 ml-1">E-Posta Adresi</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="isim@sirket.com" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all" />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center">
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Giriş Linki Gönder"}
                            </button>
                        </form>
                    ) : (
                        <div className="text-center space-y-4 animate-in fade-in">
                            <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-green-400">
                                <CheckCircle className="h-8 w-8" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl">E-Posta Gönderildi!</h3>
                                <p className="text-slate-300 text-sm mt-2">Lütfen <b>{email}</b> adresine gönderilen linke tıklayarak giriş işlemini tamamlayın.</p>
                            </div>
                            <button onClick={() => setEmailSent(false)} className="text-slate-400 hover:text-white text-sm">Farklı bir e-posta dene</button>
                        </div>
                    )
                )}

                {/* PHONE AUTH FLOW */}
                {loginMethod === 'PHONE' && (
                    step === "PHONE" ? (
                        <form onSubmit={handleSendOtp} className="space-y-6 animate-in fade-in">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 ml-1">Telefon Numarası</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="0555 555 55 55" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all" />
                                </div>
                            </div>
                            <div id="recaptcha-container"></div>
                            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center">
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Kod Gönder"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300 ml-1">Doğrulama Kodu</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <input type="text" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} required placeholder="123456" className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all tracking-widest text-lg" />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-green-600/30 flex items-center justify-center">
                                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Giriş Yap"}
                            </button>
                            <button type="button" onClick={() => setStep("PHONE")} className="w-full text-slate-400 text-sm hover:text-white transition-colors">Numarayı Değiştir</button>
                        </form>
                    )
                )}
            </div>

            <script dangerouslySetInnerHTML={{ __html: `window.recaptchaVerifier = null;` }} />
        </div>
    );
}

declare global {
    interface Window {
        recaptchaVerifier: any;
    }
}
