"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, FileText, ChevronDown, ChevronUp } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SignatureReportPage() {
    const { data: reports = [], isLoading } = useSWR('/api/admin/reports/signatures', fetcher);
    const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">İmza Durum Raporu</h1>
                <p className="text-slate-500">Zorunlu belgelerin onaylanma durumu</p>
            </div>

            {isLoading && <p>Yükleniyor...</p>}

            {!isLoading && reports.length === 0 && (
                <div className="p-8 text-center border rounded-xl bg-slate-50">
                    <p>İmza gerektiren belge bulunamadı.</p>
                </div>
            )}

            <div className="space-y-4">
                {reports.map((doc: any) => {
                    const percentage = Math.round((doc.signedCount / doc.totalUsers) * 100) || 0;

                    return (
                        <div key={doc.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <div
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50"
                                onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{doc.title}</h3>
                                        <p className="text-xs text-slate-500">Yüklenme: {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-900">{doc.signedCount} / {doc.totalUsers}</p>
                                        <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1">
                                            <div
                                                className={`h-full rounded-full ${percentage === 100 ? 'bg-green-500' : 'bg-amber-500'}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                    {expandedDoc === doc.id ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                                </div>
                            </div>

                            {expandedDoc === doc.id && (
                                <div className="bg-slate-50 p-4 border-t border-slate-100">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">İmzalayan Personeller</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {doc.signedUsers.length > 0 ? doc.signedUsers.map((u: any) => (
                                            <div key={u.userId} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                <span className="text-sm font-medium text-slate-700">{u.name}</span>
                                                <span className="text-xs text-slate-400 ml-auto">{new Date(u.signedAt).toLocaleDateString()}</span>
                                            </div>
                                        )) : (
                                            <p className="text-sm text-slate-400 italic">Henüz kimse imzalamadı.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
