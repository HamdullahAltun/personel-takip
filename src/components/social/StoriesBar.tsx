"use client";

import useSWR from 'swr';
import { Plus, Megaphone } from 'lucide-react';
import { useState } from 'react';
import StoryCreator from './StoryCreator';
import StoryViewer from './StoryViewer';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Story {
    id: string;
    type: "IMAGE" | "TEXT";
    content?: string;
    mediaUrl?: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        profilePicture?: string;
    };
}

interface UserStories {
    userId: string;
    user: {
        id: string;
        name: string;
        profilePicture?: string;
    };
    stories: Story[];
}

export default function StoriesBar() {
    const { data: storiesData = [], mutate } = useSWR<UserStories[]>('/api/social/stories', fetcher);
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
    const [viewerOpen, setViewerOpen] = useState(false);
    const [activeStoryGroup, setActiveStoryGroup] = useState<UserStories | null>(null);

    const handleStoryClick = (group: UserStories) => {
        setActiveStoryGroup(group);
        setViewerOpen(true);
    };

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 overflow-x-auto no-scrollbar">
                <div className="flex gap-4">
                    {/* Add Story Button */}
                    <div
                        className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer group"
                        onClick={() => setIsCreatorOpen(true)}
                    >
                        <div className="w-16 h-16 rounded-full border-2 border-slate-200 p-1 group-hover:border-blue-400 transition-colors">
                            <div className="w-full h-full bg-slate-50 rounded-full flex items-center justify-center">
                                <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 truncate w-full text-center">Hikayen</span>
                    </div>

                    {storiesData.map((group) => (
                        <div
                            key={group.userId}
                            className="flex flex-col items-center gap-1 min-w-[70px] cursor-pointer group"
                            onClick={() => handleStoryClick(group)}
                        >
                            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 to-fuchsia-600 p-[2px] group-hover:scale-105 transition-transform duration-300">
                                <div className="w-full h-full bg-white rounded-full p-0.5">
                                    <div className="w-full h-full rounded-full overflow-hidden">
                                        {group.user.profilePicture ? (
                                            <img src={group.user.profilePicture} className="w-full h-full object-cover" alt={group.user.name} />
                                        ) : (
                                            <div className="w-full h-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">
                                                {group.user.name[0]}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <span className="text-[10px] font-medium text-slate-700 truncate w-full text-center">{group.user.name.split(' ')[0]}</span>
                        </div>
                    ))}

                    {storiesData.length === 0 && (
                        <div className="flex items-center text-xs text-slate-400 italic px-4">
                            Henüz aktif hikaye yok...
                        </div>
                    )}
                </div>
            </div>

            <StoryCreator
                isOpen={isCreatorOpen}
                onClose={() => setIsCreatorOpen(false)}
                onCreated={() => mutate()}
            />

            {activeStoryGroup && (
                <StoryViewer
                    isOpen={viewerOpen}
                    onClose={() => setViewerOpen(false)}
                    stories={activeStoryGroup.stories}
                    initialStoryIndex={0}
                />
            )}
        </>
    );
}
