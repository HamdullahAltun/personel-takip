"use client";

import AIAssistantChat from "@/components/staff/AIAssistantChat";

export default function AIAssistantPage() {
    return (
        <div className="max-w-4xl mx-auto h-full space-y-4">
            <div className="mb-4">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Asistan & Destek</h1>
                <p className="text-slate-500 text-sm font-medium">7/24 Sorularınızı yanıtlamaya hazır.</p>
            </div>

            <AIAssistantChat />
        </div>
    );
}
