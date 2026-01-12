"use client";

import { useState, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { X, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface SignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (signatureDataUrl: string) => void;
    title: string;
}

export default function SignatureModal({ isOpen, onClose, onSave, title }: SignatureModalProps) {
    const sigPad = useRef<SignatureCanvas>(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const clear = () => {
        sigPad.current?.clear();
    };

    const save = () => {
        if (sigPad.current?.isEmpty()) {
            toast.error("Lütfen önce imzanızı atın.");
            return;
        }

        const dataUrl = sigPad.current?.getTrimmedCanvas().toDataURL('image/png');
        if (dataUrl) {
            onSave(dataUrl);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="font-bold text-slate-900">Dijital İmza</h3>
                        <p className="text-xs text-slate-500 truncate max-w-[300px]">{title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 bg-slate-100">
                    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 overflow-hidden touch-none h-64">
                        <SignatureCanvas
                            ref={sigPad}
                            canvasProps={{
                                className: "w-full h-full",
                                width: 500,
                                height: 250
                            }}
                            penColor="black"
                        />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 text-center uppercase tracking-widest font-bold">Buraya imzalayınız</p>
                </div>

                <div className="p-6 flex gap-3">
                    <button
                        onClick={clear}
                        className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition"
                    >
                        <RotateCcw className="w-4 h-4" /> Temizle
                    </button>
                    <button
                        onClick={save}
                        className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition"
                    >
                        <Check className="w-4 h-4" /> İmzayı Onayla
                    </button>
                </div>
            </div>
        </div>
    );
}
