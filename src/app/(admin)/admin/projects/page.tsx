"use client";

import { useState, useEffect } from "react";
import { Plus, MoreHorizontal, Calendar, Users as UsersIcon } from "lucide-react";

export default function ProjectsPage() {
    const [projects, setProjects] = useState([]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Projeler</h1>
                    <p className="text-slate-500">Takım projelerini ve görevlerini yönetin.</p>
                </div>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Yeni Proje
                </button>
            </div>

            {/* Project List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-orange-100 text-orange-600 p-2 rounded-lg">
                                <UsersIcon className="h-5 w-5" />
                            </div>
                            <button className="text-slate-400 hover:text-slate-600">
                                <MoreHorizontal className="h-5 w-5" />
                            </button>
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-indigo-600 transition">Mobil Uygulama Yenileme</h3>
                        <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                            Flutter altyapısına geçiş ve UI/UX iyileştirmeleri projesi.
                        </p>

                        <div className="mb-4">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>İlerleme</span>
                                <span>%65</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2">
                                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(j => (
                                    <div key={j} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">
                                        UA
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-1 text-slate-400 text-xs">
                                <Calendar className="h-3 w-3" />
                                <span>12 Haz</span>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Add New Placeholder */}
                <button className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50">
                        <Plus className="h-6 w-6" />
                    </div>
                    <span className="font-medium">Yeni Proje Oluştur</span>
                </button>
            </div>
        </div>
    );
}
