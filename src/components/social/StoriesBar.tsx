"use client";

import useSWR from 'swr';
import { Plus, Megaphone, X } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function StoriesBar() {
    const { data: announcements = [] } = useSWR('/api/announcements', fetcher);
    const [selectedStory, setSelectedStory] = useState<any>(null);

    // Mock stories if empty to show the UI
    const stories = announcements.length > 0 ? announcements : [
        { id: 'welcome', title: 'Hoşgeldin!', content: 'Yeni sosyal duvarımıza hoşgeldin. Buradan paylaşımlar yapabilirsin.', isMock: true },
        { id: 'tips', title: 'İpuçları', content: 'Kudos özelliğini kullanarak arkadaşlarına teşekkür etmeyi unutma!', isMock: true }
    ];

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 overflow-x-auto no-scrollbar">
                <div className="flex gap-4">
                    {/* My Story (Placeholder for future) */}
                    <div className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer opacity-50 hover:opacity-100 transition">
                        <div className="w-16 h-16 rounded-full border-2 border-slate-200 p-1">
                            <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center">
                                <Plus className="w-6 h-6 text-slate-400" />
                            </div>
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 truncate w-full text-center">Hikayen</span>
                    </div>

                    {stories.map((story: any) => (
                        <div
                            key={story.id}
                            className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer group"
                            onClick={() => setSelectedStory(story)}
                        >
                            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600 p-[2px] group-hover:scale-105 transition-transform duration-300">
                                <div className="w-full h-full bg-white rounded-full p-0.5">
                                    <div className="w-full h-full bg-indigo-50 rounded-full flex items-center justify-center overflow-hidden">
                                        <Megaphone className="w-6 h-6 text-indigo-600" />
                                    </div>
                                </div>
                            </div>
                            <span className="text-[10px] font-medium text-slate-700 truncate w-full text-center">{story.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Story Viewer */}
            <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
                <DialogContent className="sm:max-w-md h-[400px] flex flex-col bg-gradient-to-br from-indigo-900 to-purple-900 text-white border-0 p-0 overflow-hidden">
                    {selectedStory && (
                        <div className="flex-1 flex flex-col justify-center items-center p-8 text-center relative">
                            {/* Progress bar mock */}
                            <div className="absolute top-4 left-4 right-4 h-1 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white animate-[width_5s_linear_forwards]" />
                            </div>

                            <div className="bg-white/20 p-6 rounded-full mb-6 backdrop-blur-md">
                                <Megaphone className="w-12 h-12 text-white" />
                            </div>

                            <h2 className="text-2xl font-black mb-4">{selectedStory.title}</h2>
                            <p className="text-indigo-100 text-lg leading-relaxed">{selectedStory.content}</p>

                            <button
                                onClick={() => setSelectedStory(null)}
                                className="absolute top-6 right-4 text-white/50 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
