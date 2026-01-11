"use client";

import { useState } from "react";
import useSWR from "swr";
import { Search, Book, FileText, Bookmark, X, ChevronRight, File, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import KnowledgeChat from "@/components/knowledge/KnowledgeChat";

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Doc {
    id: string;
    title: string;
    content: string;
    type: string;
    tags: string[];
    fileUrl?: string;
    updatedAt: string;
    requiresSigning?: boolean;
    isSigned?: boolean;
}

export default function KnowledgePage() {
    const [search, setSearch] = useState("");
    const [selectedType, setSelectedType] = useState("ALL");
    const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null);

    const { data: docs = [], isLoading } = useSWR<Doc[]>(
        `/api/knowledge?search=${search}&type=${selectedType}`,
        fetcher,
        { keepPreviousData: true }
    );

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'POLICY': return <Bookmark className="text-red-500" />;
            case 'MANUAL': return <Book className="text-blue-500" />;
            case 'GUIDELINE': return <FileText className="text-green-500" />;
            default: return <File className="text-slate-500" />;
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: any = { 'POLICY': 'Politika', 'MANUAL': 'Kılavuz', 'GUIDELINE': 'Yönerge' };
        return labels[type] || type;
    };

    return (
        <div className="pb-24 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6 px-4 pt-2">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
                    <Book className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Bilgi Bankası</h1>
                    <p className="text-slate-500 text-xs">Şirket prosedüleri ve dökümanları</p>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm px-4 pb-4 pt-2">
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                        placeholder="Döküman ara..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {['ALL', 'POLICY', 'MANUAL', 'GUIDELINE'].map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border
                                ${selectedType === type
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}
                            `}
                        >
                            {type === 'ALL' ? 'Tümü' : getTypeLabel(type)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content List */}
            <div className="px-4 space-y-3">
                {isLoading && (
                    <>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm animate-pulse h-24" />
                        ))}
                    </>
                )}

                {!isLoading && docs.length === 0 && (
                    <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                        <Book className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Döküman bulunamadı.</p>
                    </div>
                )}

                {docs.map((doc) => (
                    <motion.div
                        key={doc.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedDoc(doc)}
                        className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4 cursor-pointer active:bg-slate-50 transition-colors"
                    >
                        <div className="mt-1 bg-slate-50 p-2 rounded-lg">
                            {getTypeIcon(doc.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <span className="text-[10px] font-bold text-slate-400 mb-1 block">
                                    {getTypeLabel(doc.type)}
                                </span>
                                <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                                    {new Date(doc.updatedAt).toLocaleDateString('tr-TR')}
                                </span>
                            </div>
                            <h3 className="font-bold text-slate-800 line-clamp-2 leading-tight mb-1">{doc.title}</h3>
                            <p className="text-xs text-slate-500 line-clamp-2">{doc.content}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-300 self-center" />
                    </motion.div>
                ))}
            </div>

            {/* Reader Modal (Mobile Optimized) */}
            <AnimatePresence>
                {selectedDoc && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
                    >
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDoc(null)} />

                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="bg-white w-full h-[90vh] sm:h-[80vh] sm:max-w-2xl sm:rounded-2xl rounded-t-3xl shadow-2xl relative flex flex-col z-50"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="bg-indigo-50 p-2 rounded-lg shrink-0">
                                        {getTypeIcon(selectedDoc.type)}
                                    </div>
                                    <h2 className="font-bold text-slate-900 truncate pr-4">{selectedDoc.title}</h2>
                                </div>
                                <button
                                    onClick={() => setSelectedDoc(null)}
                                    className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                                >
                                    <X className="h-5 w-5 text-slate-600" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                                <div className="prose prose-sm prose-slate max-w-none">
                                    <div className="text-xs text-slate-400 mb-4 bg-slate-50 inline-block px-3 py-1 rounded-full">
                                        Son Güncelleme: {new Date(selectedDoc.updatedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>

                                    <div className="whitespace-pre-wrap leading-relaxed text-slate-700">
                                        {selectedDoc.content}
                                    </div>

                                    {selectedDoc.fileUrl && (
                                        <div className="mt-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <FileText className="text-indigo-600 h-6 w-6" />
                                                <div>
                                                    <p className="font-bold text-indigo-900 text-sm">Ekli Dosya</p>
                                                    <p className="text-xs text-indigo-700">Görüntülemek için tıklayın</p>
                                                </div>
                                            </div>
                                            <a
                                                href={selectedDoc.fileUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm"
                                            >
                                                Aç
                                            </a>
                                        </div>
                                    )}

                                    {/* Signing UI */}
                                    {selectedDoc.requiresSigning && (
                                        <div className={`mt-6 p-5 rounded-xl border-2 ${selectedDoc.isSigned ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
                                            <div className="flex items-start gap-4">
                                                <div className={`p-2 rounded-full ${selectedDoc.isSigned ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                                    <ShieldCheck className="h-6 w-6" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className={`font-bold ${selectedDoc.isSigned ? 'text-green-900' : 'text-amber-900'}`}>
                                                        {selectedDoc.isSigned ? 'Belge İmzalandı' : 'İmza Gerektiriyor'}
                                                    </h3>
                                                    <p className={`text-xs mt-1 ${selectedDoc.isSigned ? 'text-green-700' : 'text-amber-700'}`}>
                                                        {selectedDoc.isSigned
                                                            ? `Bu belgeyi dijital olarak onayladınız.`
                                                            : 'Bu belgeyi okuyup anladığınızı dijital olarak onaylamanız gerekmektedir.'}
                                                    </p>

                                                    {!selectedDoc.isSigned && (
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm("Bu belgeyi okuyup anladığınızı onaylıyor musunuz?")) return;

                                                                // Call API
                                                                try {
                                                                    const res = await fetch(`/api/knowledge/${selectedDoc.id}/sign`, {
                                                                        method: 'POST',
                                                                        body: JSON.stringify({ signature: 'DIGITAL_CONSENT' }), // Simple consent for now
                                                                        headers: { 'Content-Type': 'application/json' }
                                                                    });

                                                                    if (res.ok) {
                                                                        setSelectedDoc({ ...selectedDoc, isSigned: true });
                                                                        // Refresh list logic needed or SWR revalidate
                                                                    }
                                                                } catch (e) {
                                                                    alert("İmzalama başarısız.");
                                                                }
                                                            }}
                                                            className="mt-3 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-amber-200 hover:bg-amber-700 transition w-full sm:w-auto"
                                                        >
                                                            Okudum, Onaylıyorum
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <KnowledgeChat />
        </div>
    );
}
