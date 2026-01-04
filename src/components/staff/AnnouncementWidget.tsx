"use client";

import { useState, useEffect } from 'react';
import { Megaphone, X } from 'lucide-react';

type Announcement = {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
};

export default function AnnouncementWidget({ announcement }: { announcement: Announcement | null }) {
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        if (announcement) {
            const readKey = `read_announcement_${announcement.id}`;
            const isRead = localStorage.getItem(readKey);
            if (!isRead) {
                // Use a non-blocking update pattern
                requestAnimationFrame(() => setShowPopup(true));
            }
        }
    }, [announcement]);

    const handleClose = () => {
        if (announcement) {
            localStorage.setItem(`read_announcement_${announcement.id}`, 'true');
        }
        setShowPopup(false);
    };

    if (!announcement) return null;

    return (
        <>
            {/* Widget on Dashboard */}
            <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Megaphone className="h-24 w-24" rotate={-15} />
                </div>
                <div className="flex items-center gap-2 mb-2 opacity-90">
                    <Megaphone className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Son Duyuru</span>
                </div>
                <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-1">{announcement.title}</h3>
                <p className="text-indigo-100 text-sm line-clamp-2">{announcement.content}</p>
            </div>

            {/* Popup Modal */}
            {showPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-indigo-600 p-6 text-white relative">
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 text-indigo-200 hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
                                <Megaphone className="h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-bold">Yeni Duyuru!</h2>
                            <p className="text-indigo-200 text-sm mt-1">
                                {new Date(announcement.createdAt).toLocaleDateString('tr-TR')}
                            </p>
                        </div>
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{announcement.title}</h3>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto custom-scrollbar">
                                {announcement.content}
                            </p>
                            <button
                                onClick={handleClose}
                                className="w-full mt-6 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                            >
                                Okudum, Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
