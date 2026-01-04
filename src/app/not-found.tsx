
"use client";

import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 font-sans text-center">
            <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-100">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="h-10 w-10 text-red-500" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">Sayfa Bulunamadı</h1>
                <p className="text-slate-500 font-medium mb-8">
                    Aradığınız sayfa mevcut değil veya taşınmış olabilir.
                </p>
                <Link
                    href="/dashboard"
                    className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition active:scale-95 shadow-lg shadow-slate-200"
                >
                    <Home className="h-5 w-5" />
                    Ana Sayfaya Dön
                </Link>
            </div>
        </div>
    );
}
