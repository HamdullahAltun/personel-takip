"use client";

import { useEffect, useState } from "react";
import { Quote, Sparkles } from "lucide-react";

interface QuoteData {
    text: string;
    author: string;
}

export default function DailyMotivation() {
    const [quote, setQuote] = useState<QuoteData>({
        text: "Başarı, hazırlık ve fırsatın buluştuğu yerdir.",
        author: "Bobby Unser"
    });

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                const res = await fetch('/api/quotes');
                if (res.ok) {
                    const data = await res.json();
                    if (data.quote) {
                        setQuote(data.quote);
                    }
                }
            } catch (error) {
                // Keep default
            }
        };

        fetchQuote();
    }, []);

    return (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white relative overflow-hidden flex flex-col justify-center min-h-[160px]">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
            <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-32 h-32 bg-purple-500 rounded-full blur-3xl opacity-20"></div>

            <Quote className="h-8 w-8 text-indigo-400 mb-4 opacity-50 absolute top-6 right-6" />

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-200">Günün Sözü</span>
                </div>
                <p className="font-serif italic text-lg text-indigo-50 leading-relaxed mb-4">
                    &quot;{quote.text}&quot;
                </p>
                <p className="text-xs font-bold text-indigo-400 text-right">
                    — {quote.author}
                </p>
            </div>
        </div>
    );
}
