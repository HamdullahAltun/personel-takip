"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";

interface Announcement {
    id: string;
    title: string;
    content: string;
}

export default function Announcements() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);

    useEffect(() => {
        fetch('/api/announcements')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setAnnouncements(data);
            })
            .catch(err => console.error(err));
    }, []);

    if (announcements.length === 0) return null;

    return (
        <div className="mb-6 space-y-3">
            {announcements.map((ann) => (
                <div key={ann.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 relative shadow-sm">
                    <div className="bg-white p-2 rounded-full shadow-sm text-blue-600">
                        <Megaphone className="h-5 w-5" />
                    </div>
                    <div className="flex-1 pr-6">
                        <h3 className="font-bold text-blue-900 text-sm">{ann.title}</h3>
                        <p className="text-blue-800/80 text-xs mt-1 leading-relaxed">{ann.content}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
