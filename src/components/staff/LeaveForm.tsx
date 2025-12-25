"use client";

import { useState } from "react";
import { requestLeave } from "@/app/actions/leave";
import { Loader2, CalendarPlus } from "lucide-react";

export default function LeaveForm() {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const res = await requestLeave(null, formData);
        setLoading(false);

        if (res?.error) {
            setMessage("Hata: " + res.error);
        } else {
            setMessage("İzin talebi gönderildi.");
            (e.target as HTMLFormElement).reset();
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
                <CalendarPlus className="h-5 w-5 text-blue-600" />
                Yeni Talep
            </h2>

            {message && <p className="mb-4 text-sm text-blue-600 font-medium">{message}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Başlangıç</label>
                    <input name="startDate" type="date" required className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Bitiş</label>
                    <input name="endDate" type="date" required className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Sebep</label>
                    <textarea name="reason" required className="mt-1 block w-full rounded-md border border-slate-300 p-2 text-sm" rows={3} placeholder="Yıllık izin..." />
                </div>

                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700 flex justify-center">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Gönder"}
                </button>
            </form>
        </div>
    );
}
