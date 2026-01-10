"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Story {
    id: string;
    type: "IMAGE" | "TEXT";
    content?: string;
    mediaUrl?: string;
    createdAt: string;
    user: {
        name: string;
        profilePicture?: string;
    };
}

interface StoryViewerProps {
    stories: Story[];
    initialStoryIndex: number;
    isOpen: boolean;
    onClose: () => void;
}

export default function StoryViewer({ stories, initialStoryIndex, isOpen, onClose }: StoryViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialStoryIndex);
            setProgress(0);
        }
    }, [isOpen, initialStoryIndex]);

    useEffect(() => {
        if (!isOpen) return;

        const duration = 5000; // 5 seconds per story
        const interval = 50; // Update every 50ms
        const step = 100 / (duration / interval);

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    // Move to next story
                    if (currentIndex < stories.length - 1) {
                        setCurrentIndex(c => c + 1);
                        return 0; // Reset progress for next story
                    } else {
                        // End of stories
                        onClose();
                        return 100;
                    }
                }
                return prev + step;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [currentIndex, isOpen, stories.length, onClose]);

    const handleNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(c => c + 1);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const handleBack = () => {
        if (currentIndex > 0) {
            setCurrentIndex(c => c - 1);
            setProgress(0);
        }
    };

    if (!stories[currentIndex]) return null;

    const currentStory = stories[currentIndex];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md h-[80vh] sm:h-[600px] p-0 border-none bg-black overflow-hidden flex flex-col items-center justify-center">

                {/* Progress Bars */}
                <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
                    {stories.map((_, idx) => (
                        <div key={idx} className="h-1 bg-white/30 rounded-full flex-1 overflow-hidden">
                            <div
                                className={`h-full bg-white transition-all duration-100 ease-linear`}
                                style={{
                                    width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* User Info */}
                <div className="absolute top-8 left-4 z-20 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-white/20 overflow-hidden">
                        {currentStory.user.profilePicture ? (
                            <img src={currentStory.user.profilePicture} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                                {currentStory.user.name[0]}
                            </div>
                        )}
                    </div>
                    <span className="text-white font-bold text-sm shadow-black drop-shadow-md">{currentStory.user.name}</span>
                </div>

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-8 right-4 z-20 text-white/70 hover:text-white">
                    <X className="w-6 h-6" />
                </button>

                {/* Story Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStory.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex items-center justify-center relative"
                    >
                        {currentStory.type === "IMAGE" && currentStory.mediaUrl && (
                            <>
                                <img src={currentStory.mediaUrl} className="w-full h-full object-cover" alt="Story" />
                                {currentStory.content && (
                                    <div className="absolute bottom-10 left-0 right-0 p-6 text-center bg-gradient-to-t from-black/80 to-transparent pt-20">
                                        <p className="text-white text-lg font-medium">{currentStory.content}</p>
                                    </div>
                                )}
                            </>
                        )}
                        {currentStory.type === "TEXT" && (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-8 text-center">
                                <p className="text-white text-2xl sm:text-3xl font-bold leading-relaxed">
                                    {currentStory.content}
                                </p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Zones */}
                <div className="absolute inset-0 z-10 flex">
                    <div className="w-1/3 h-full" onClick={handleBack} />
                    <div className="w-2/3 h-full" onClick={handleNext} />
                </div>

            </DialogContent>
        </Dialog>
    );
}
