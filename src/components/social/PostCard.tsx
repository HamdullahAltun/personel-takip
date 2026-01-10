"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { Heart, MessageSquare, MoreHorizontal, Share2, Award, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Post {
    id: string;
    content: string;
    imageUrl?: string | null;
    createdAt: string;
    type: string; // STANDARD, KUDOS, ANNOUNCEMENT
    user: {
        id: string;
        name: string;
        profilePicture?: string | null;
        role: string;
    };
    likes: { userId: string }[];
    _count: {
        comments: number;
        likes: number;
    };
    kudosTarget?: {
        name: string;
        profilePicture?: string | null;
    } | null;
    kudosCategory?: string | null;
    isLiked: boolean; // Computed on backend or checked via current user
}

interface PostCardProps {
    post: Post;
    currentUserId: string;
}

export default function PostCard({ post, currentUserId }: PostCardProps) {
    const [isLiked, setIsLiked] = useState(post.isLiked);
    const [likeCount, setLikeCount] = useState(post._count.likes);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleLike = async () => {
        if (isAnimating) return;

        const newStatus = !isLiked;
        setIsLiked(newStatus);
        setLikeCount(prev => newStatus ? prev + 1 : prev - 1);
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 1000);

        try {
            await fetch(`/api/social/${post.id}/like`, { method: 'POST' });
        } catch (error) {
            // Revert on error
            setIsLiked(!newStatus);
            setLikeCount(prev => !newStatus ? prev + 1 : prev - 1);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 mb-6"
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                    <div className="relative">
                        {post.user.profilePicture ? (
                            <Image
                                src={post.user.profilePicture}
                                alt={post.user.name}
                                width={40}
                                height={40}
                                className="rounded-full object-cover border-2 border-white shadow-sm"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm text-slate-400">
                                <UserIcon className="h-5 w-5" />
                            </div>
                        )}
                        {post.type === 'KUDOS' && (
                            <div className="absolute -bottom-1 -right-1 bg-amber-100 p-1 rounded-full border-2 border-white">
                                <Award className="h-3 w-3 text-amber-500" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900">{post.user.name}</h3>
                            {post.type === 'ANNOUNCEMENT' && (
                                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase">Duyuru</span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: tr })}
                        </p>
                    </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600 transition-colors">
                    <MoreHorizontal className="h-5 w-5" />
                </button>
            </div>

            {/* Content */}
            <div className="mb-4">
                {post.type === 'KUDOS' && post.kudosTarget && (
                    <div className="mb-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                        <Award className="h-8 w-8 text-amber-500" />
                        <div>
                            <p className="text-amber-900 font-bold text-sm">
                                <span className="font-black">{post.kudosTarget.name}</span> kullanıcısını takdir etti!
                            </p>
                            <p className="text-amber-700/60 text-xs font-semibold uppercase tracking-wider mt-0.5">
                                #{post.kudosCategory || 'TEBRIKLER'}
                            </p>
                        </div>
                    </div>
                )}

                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {post.content}
                </p>

                {post.imageUrl && (
                    <div className="mt-4 rounded-2xl overflow-hidden border border-slate-100">
                        <Image
                            src={post.imageUrl}
                            alt="Post content"
                            width={600}
                            height={400}
                            className="w-full h-auto object-cover"
                        />
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6 border-t border-slate-50 pt-4">
                <button
                    onClick={handleLike}
                    className={cn(
                        "flex items-center gap-2 text-sm font-bold transition-all group",
                        isLiked ? "text-rose-500" : "text-slate-400 hover:text-rose-500"
                    )}
                >
                    <div className={cn(
                        "p-2 rounded-full transition-colors",
                        isLiked ? "bg-rose-50" : "group-hover:bg-rose-50"
                    )}>
                        <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
                    </div>
                    <span>{likeCount}</span>
                </button>

                <button className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors group">
                    <div className="p-2 rounded-full group-hover:bg-indigo-50 transition-colors">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <span>{post._count.comments}</span>
                </button>
            </div>
        </motion.div>
    );
}
