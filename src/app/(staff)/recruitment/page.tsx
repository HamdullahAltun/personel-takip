"use client";

import { useState, useEffect } from "react";
import { Briefcase, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function StaffRecruitmentPage() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Using existing API, public/staff mode
            const res = await fetch('/api/recruitment?mode=jobs');
            const data = await res.json();
            // Filter only ACTIVE jobs for staff if API returns all
            if (Array.isArray(data)) {
                setJobs(data.filter((j: any) => j.status === 'ACTIVE'));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Açık Pozisyonlar</h1>
                <p className="text-slate-500">Şirket içi kariyer fırsatları</p>
            </div>

            {loading ? (
                <div className="text-center py-10 text-slate-400">Yükleniyor...</div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-10 text-slate-400">Şu an açık pozisyon bulunmamaktadır.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {jobs.map(job => (
                        <div key={job.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-slate-900">{job.title}</h3>
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-bold">{job.type === 'FULL_TIME' ? 'Tam Zamanlı' : job.type === 'PART_TIME' ? 'Yarı Zamanlı' : 'Remote'}</span>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">{job.department}</p>

                            <div className="space-y-3 mb-4">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 uppercase mb-1">Açıklama</h4>
                                    <p className="text-xs text-slate-600 line-clamp-3">{job.description}</p>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 uppercase mb-1">Gereklilikler</h4>
                                    <p className="text-xs text-slate-600 line-clamp-3">{job.requirements}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-xs text-slate-400">
                                    {format(new Date(job.createdAt), 'd MMM yyyy', { locale: tr })}
                                </span>
                                <button className="bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition">
                                    Başvur
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
