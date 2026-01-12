"use client";

import { useState, useEffect } from "react";
import { Folder, FileText, Upload, Trash, Download, Search, File, Image as ImageIcon, AlertCircle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

import SignatureModal from "@/components/admin/SignatureModal";

export default function AdminDocumentsPage() {
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ title: "", type: "CONTRACT", fileUrl: "" });

    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [signingDoc, setSigningDoc] = useState<any>(null);

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        const res = await fetch('/api/documents');
        if (res.ok) setDocs(await res.json());
        setLoading(false);
    }

    const handleSign = async (signatureDataUrl: string) => {
        if (!signingDoc) return;

        await fetch('/api/documents', {
            method: 'PUT',
            body: JSON.stringify({ id: signingDoc.id, isSigned: true, signature: signatureDataUrl }),
            headers: { 'Content-Type': 'application/json' }
        });

        fetchDocs();
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch('/api/documents', {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: { 'Content-Type': 'application/json' }
        });
        setShowModal(false);
        setFormData({ title: "", type: "CONTRACT", fileUrl: "" });
        fetchDocs();
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Silmek istediğinize emin misiniz?')) return;
        await fetch('/api/documents', {
            method: 'DELETE',
            body: JSON.stringify({ id }),
            headers: { 'Content-Type': 'application/json' }
        });
        fetchDocs();
    }

    const getIcon = (type: string) => {
        if (type.includes('IMAGE')) return <ImageIcon className="h-6 w-6 text-purple-600" />;
        if (type === 'PDF') return <FileText className="h-6 w-6 text-red-600" />;
        return <File className="h-6 w-6 text-blue-600" />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Belge Kasası</h1>
                    <p className="text-slate-500">Şirket dökümanları ve sözleşmeler</p>
                </div>
                <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Yükle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {docs.map(doc => (
                    <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-200 hover:shadow-md transition group relative">
                        <div className="h-32 bg-slate-50 rounded-lg flex items-center justify-center mb-3 text-slate-300 relative overflow-hidden">
                            {/* Mock Preview */}
                            <div className="scale-150">{getIcon(doc.type)}</div>
                            {doc.title.toLowerCase().includes('sözleşme') && !doc.isSigned && (
                                <div className="absolute inset-x-0 bottom-0 bg-amber-100 py-1 text-center text-[9px] font-bold text-amber-700">
                                    İMZA BEKLİYOR
                                </div>
                            )}
                            {doc.isSigned && (
                                <div className="absolute inset-x-0 bottom-0 bg-emerald-100 py-1 text-center text-[9px] font-bold text-emerald-700 flex items-center justify-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> İMZALANDI
                                </div>
                            )}
                        </div>
                        <h3 className="font-bold text-slate-900 truncate">{doc.title}</h3>
                        <p className="text-xs text-slate-500">{format(new Date(doc.uploadedAt), 'd MMM yyyy', { locale: tr })}</p>

                        <div className="flex justify-between items-center mt-2">
                            <span className="text-[10px] uppercase bg-slate-100 px-1.5 py-0.5 rounded inline-block text-slate-600 font-bold">{doc.type}</span>
                            {doc.title.toLowerCase().includes('sözleşme') && !doc.isSigned && (
                                <button
                                    onClick={() => {
                                        setSigningDoc(doc);
                                        setIsSignatureModalOpen(true);
                                    }}
                                    className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded font-bold hover:bg-indigo-700"
                                >
                                    İmzala
                                </button>
                            )}
                        </div>

                        {doc.expiryDate && (
                            <div className={cn(
                                "text-[10px] font-bold px-2 py-1 rounded-full mt-2 flex items-center gap-1 w-fit",
                                new Date(doc.expiryDate) < new Date()
                                    ? "bg-rose-100 text-rose-600 border border-rose-200"
                                    : "bg-amber-100 text-amber-700 border border-amber-200"
                            )}>
                                <AlertCircle className="w-3 h-3" />
                                {new Date(doc.expiryDate) < new Date() ? "Süresi Doldu" : `${format(new Date(doc.expiryDate), 'd MMM yyyy')} tarihinde doluyor`}
                            </div>
                        )}

                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-1 rounded">
                            <a href={doc.fileUrl} target="_blank" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded shadow-sm"><Download className="h-4 w-4" /></a>
                            <button onClick={() => handleDelete(doc.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded shadow-sm"><Trash className="h-4 w-4" /></button>
                        </div>
                    </div>
                ))}
            </div>

            <SignatureModal
                isOpen={isSignatureModalOpen}
                title={signingDoc?.title}
                onClose={() => {
                    setIsSignatureModalOpen(false);
                    setSigningDoc(null);
                }}
                onSave={handleSign}
            />

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 animate-in zoom-in-95 shadow-2xl">
                        <h2 className="text-xl font-black mb-6 flex items-center gap-2">
                            <FileText className="text-indigo-600" />
                            Yeni Belge Yükle
                        </h2>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Belge Adı</label>
                                <input required className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Örn: İş Sözleşmesi" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tür</label>
                                    <select className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                        <option value="CONTRACT">Sözleşme</option>
                                        <option value="REPORT">Rapor</option>
                                        <option value="POLICY">Politika</option>
                                        <option value="ID_CARD">Kimlik/Pasaport</option>
                                        <option value="HEALTH">Sağlık Belgesi</option>
                                        <option value="OTHER">Diğer</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Son Kullanma</label>
                                    <input type="date" className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" value={(formData as any).expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value } as any)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dosya Linki (S3/Cloud)</label>
                                <input required className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition" value={formData.fileUrl} onChange={e => setFormData({ ...formData, fileUrl: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition">İptal</button>
                                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition">Belgeyi Ekle</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
