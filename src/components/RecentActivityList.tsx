"use client";

import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

export default function RecentActivityList({ activities }: { activities: any[] }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Son Hareketler</h3>
                <button className="text-slate-400 hover:text-slate-600 text-xl font-bold leading-none">...</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activities.length === 0 ? (
                    <div className="text-center text-slate-400 text-sm py-4">Hareket yok.</div>
                ) : (
                    activities.map((record) => (
                        <div key={record.id} className="flex items-start gap-4">
                            <div className="relative mt-1">
                                <div className={`w-3 h-3 rounded-full ${record.type === 'CHECK_IN' ? 'bg-green-500' : 'bg-red-500'} ring-4 ring-slate-50 relative z-10`}></div>
                                <div className="absolute top-3 left-1.5 w-0.5 h-full bg-slate-100 -z-0"></div>
                            </div>
                            <div className="flex-1 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{record.user.name}</h4>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {record.type === 'CHECK_IN' ? 'Giriş yaptı' : 'Çıkış yaptı'} • {formatDistanceToNow(new Date(record.timestamp), { addSuffix: true, locale: tr })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-medium text-slate-400 block">
                                            {record.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {record.isLate && (
                                            <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded ml-auto block w-fit mt-1">
                                                (Geç)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
