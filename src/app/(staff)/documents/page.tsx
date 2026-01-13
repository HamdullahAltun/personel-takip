"use client";

import { useState, useEffect } from "react";
import { FileText, Download, Clock, CheckCircle2, AlertCircle, Search, Filter, PenTool } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import SignatureModal from "@/components/admin/SignatureModal";
import { toast } from "sonner";

export default function StaffDocumentsPage() {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL"); // ALL, SIGNED, PENDING

    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [signingDoc, setSigningDoc] = useState<any>(null);

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        try {
            const res = await fetch('/api/documents');
            if (res.ok) setDocs(await res.json());
        } catch (error) {
            toast.error("Belgeler yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }

    const handleSign = async (signatureDataUrl: string) => {
        if (!signingDoc) return;

        try {
            const res = await fetch('/api/documents', {
                method: 'PUT',
                body: JSON.stringify({ id: signingDoc.id, isSigned: true, signature: signatureDataUrl }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                toast.success("Belge başarıyla imzalandı.");
                fetchDocs();
            } else {
                toast.error("İmzalama işlemi başarısız oldu.");
            }
        } catch (error) {
            toast.error("Bir hata oluştu.");
        }
    }

    const filteredDocs = docs.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = 
            filter === "ALL" || 
            (filter === "SIGNED" && doc.isSigned) || 
            (filter === "PENDING" && !doc.isSigned && doc.requiresSigning);
        return matchesSearch && matchesFilter;
    });

    const getStatusInfo = (doc: any) => {
        if (doc.isSigned) {
            return {
                label: "İmzalandı",
                icon: <CheckCircle2 className="w-4 h-4" />,
                className: "bg-emerald-50 text-emerald-600 border-emerald-100"
            };
        }
        if (doc.requiresSigning) {
            return {
                label: "İmza Bekliyor",
                icon: <PenTool className="w-4 h-4" />,
                className: "bg-amber-50 text-amber-600 border-amber-100"
            };
        }
        return {
            label: "Görüntüleme",
            icon: <FileText className="w-4 h-4" />,
            className: "bg-slate-50 text-slate-600 border-slate-100"
        };
    };

    return (
        <div className="pb-24 max-w-4xl mx-auto px-4">
            <div className="flex items-center gap-4 mb-8 pt-4">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-3 rounded-2xl text-white shadow-xl shadow-indigo-100">
                    <FileText className="h-8 w-8" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Belgelerim</h1>
                    <p className="text-slate-500 font-medium">Size özel dökümanlar ve sözleşmeler</p>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm sticky top-4 z-10 backdrop-blur-md bg-white/90">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        className="w-full bg-slate-50 border-none rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400"
                        placeholder="Belgelerde ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                    {[
                        { id: "ALL", label: "Tümü" },
                        { id: "PENDING", label: "Bekleyenler" },
                        { id: "SIGNED", label: "İmzalananlar" }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setFilter(item.id)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                                filter === item.id 
                                    ? "bg-white text-indigo-600 shadow-sm" 
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-48 bg-white border border-slate-100 rounded-3xl animate-pulse" />
                    ))}
                </div>
            ) : filteredDocs.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Belge bulunamadı</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mt-2">Aradığınız kriterlere uygun herhangi bir belge bulunmamaktadır.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredDocs.map((doc) => {
                        const status = getStatusInfo(doc);
                        return (
                            <motion.div
                                layout
                                key={doc.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all perspective-1000"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border", status.className)}>
                                        {status.icon}
                                        {status.label}
                                    </div>
                                    <div className="text-slate-300 group-hover:text-indigo-200 transition-colors">
                                        <FileText className="w-8 h-8" />
                                    </div>
                                </div>

                                <h3 className="text-lg font-black text-slate-900 mb-2 truncate leading-tight">{doc.title}</h3>
                                
                                <div className="flex flex-col gap-2 mb-6">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <Clock className="w-3.5 h-3.5" />
                                        Yükleme: {format(new Date(doc.uploadedAt), 'd MMMM yyyy', { locale: tr })}
                                    </div>
                                    {doc.expiryDate && (
                                        <div className={cn(
                                            "flex items-center gap-2 text-[10px] font-bold px-3 py-1 rounded-lg w-fit",
                                            new Date(doc.expiryDate) < new Date() ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                                        )}>
                                            <AlertCircle className="w-3 h-3" />
                                            Son Geçerlilik: {format(new Date(doc.expiryDate), 'd MMM yyyy')}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <a
                                        href={doc.fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all border border-slate-100"
                                    >
                                        <Download className="w-4 h-4" /> İndir
                                    </a>
                                    {!doc.isSigned && doc.requiresSigning && (
                                        <button
                                            onClick={() => {
                                                setSigningDoc(doc);
                                                setIsSignatureModalOpen(true);
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                                        >
                                            <PenTool className="w-4 h-4" /> İmzala
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <SignatureModal
                isOpen={isSignatureModalOpen}
                title={signingDoc?.title}
                onClose={() => {
                    setIsSignatureModalOpen(false);
                    setSigningDoc(null);
                }}
                onSave={handleSign}
            />
        </div>
    );
}
