"use client";

import { useState, useEffect } from "react";
import { Heart, MessageCircle, Send, Image as ImageIcon, MoreHorizontal, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

type User = {
    name: string;
    profilePicture?: string;
};

type Comment = {
    id: string;
    content: string;
    user: User;
    createdAt: string;
};

type Like = {
    userId: string;
};

type Post = {
    id: string;
    content: string;
    imageUrl?: string;
    user: User;
    createdAt: string;
    likes: Like[];
    comments: Comment[];
};

export default function StaffSocialPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState("");
    const [showImageInput, setShowImageInput] = useState(false);
    const [imageUrl, setImageUrl] = useState("");

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        const res = await fetch("/api/social");
        if (res.ok) setPosts(await res.json());
        setLoading(false);
    };

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.trim()) return;

        const res = await fetch("/api/social", {
            method: "POST",
            body: JSON.stringify({ content: newPost, imageUrl }),
            headers: { "Content-Type": "application/json" }
        });

        if (res.ok) {
            setNewPost("");
            setImageUrl("");
            setShowImageInput(false);
            fetchPosts();
        }
    };

    const handleLike = async (id: string) => {
        // Optimistic update
        setPosts(prev => prev.map(p => {
            // Logic simplified for optimistic UI without knowing exact user presence in like array
            return p;
        }));
        await fetch(`/api/social/${id}/like`, { method: "POST" });
        fetchPosts();
    };

    const handleComment = async (id: string, content: string) => {
        await fetch(`/api/social/${id}/comment`, {
            method: "POST",
            body: JSON.stringify({ content }),
            headers: { "Content-Type": "application/json" }
        });
        fetchPosts();
    };

    return (
        <div className="max-w-xl mx-auto space-y-6 pb-24">
            <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900">Sosyal Akış</h1>
            </div>

            {/* Create Post */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <form onSubmit={handlePost}>
                    <textarea
                        className="w-full resize-none border-none focus:ring-0 text-slate-700 placeholder:text-slate-400 text-base"
                        placeholder="Neler oluyor?"
                        rows={2}
                        value={newPost}
                        onChange={e => setNewPost(e.target.value)}
                    />
                    {showImageInput && (
                        <input
                            className="w-full border p-2 rounded mb-3 text-sm"
                            placeholder="Resim URL'si (Opsiyonel)"
                            value={imageUrl}
                            onChange={e => setImageUrl(e.target.value)}
                        />
                    )}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-2">
                        <button type="button" onClick={() => setShowImageInput(!showImageInput)} className="text-slate-400 hover:text-blue-500 p-2 rounded-full hover:bg-slate-50">
                            <ImageIcon className="w-5 h-5" />
                        </button>
                        <button
                            type="submit"
                            disabled={!newPost.trim()}
                            className="bg-blue-600 text-white px-5 py-1.5 rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 transition text-sm"
                        >
                            Paylaş
                        </button>
                    </div>
                </form>
            </div>

            {/* Feed */}
            <div className="space-y-4">
                {posts.map(post => (
                    <PostCard key={post.id} post={post} onLike={() => handleLike(post.id)} onComment={(c) => handleComment(post.id, c)} />
                ))}
                {posts.length === 0 && !loading && (
                    <div className="text-center py-10 text-slate-400 italic">Henüz paylaşım yok.</div>
                )}
            </div>
        </div>
    );
}

function PostCard({ post, onLike, onComment }: { post: Post, onLike: () => void, onComment: (c: string) => void }) {
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState("");

    const handleSubmitComment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        onComment(commentText);
        setCommentText("");
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                            {post.user.profilePicture ? <img src={post.user.profilePicture} className="w-full h-full object-cover" /> : post.user.name[0]}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm">{post.user.name}</h3>
                            <p className="text-xs text-slate-500">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: tr })}</p>
                        </div>
                    </div>
                </div>

                <p className="mt-1 text-slate-800 whitespace-pre-wrap text-sm">{post.content}</p>

                {post.imageUrl && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-slate-100">
                        <img src={post.imageUrl} alt="Attachment" className="w-full h-auto max-h-80 object-cover" />
                    </div>
                )}
            </div>

            <div className="px-4 py-2 border-t border-slate-50 flex gap-6">
                <button onClick={onLike} className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition group p-2 rounded -ml-2 hover:bg-red-50">
                    <Heart className={`w-5 h-5 group-hover:fill-red-500`} />
                    <span className="text-sm font-medium">{post.likes.length || ""}</span>
                </button>
                <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 text-slate-500 hover:text-blue-500 transition group p-2 rounded hover:bg-blue-50">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.comments.length || ""}</span>
                </button>
            </div>

            {showComments && (
                <div className="bg-slate-50 p-4 border-t border-slate-100">
                    <div className="space-y-4 mb-4">
                        {post.comments.map(comment => (
                            <div key={comment.id} className="flex gap-2">
                                <div className="w-6 h-6 bg-slate-200 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold overflow-hidden">
                                    {comment.user.profilePicture ? <img src={comment.user.profilePicture} className="w-full h-full object-cover" /> : comment.user.name[0]}
                                </div>
                                <div className="bg-white p-2 rounded-lg rounded-tl-none border border-slate-200 shadow-sm flex-1">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <span className="text-xs font-bold text-slate-900">{comment.user.name}</span>
                                        <span className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(comment.createdAt), { locale: tr })}</span>
                                    </div>
                                    <p className="text-xs text-slate-700">{comment.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={handleSubmitComment} className="flex gap-2">
                        <input
                            className="flex-1 border-slate-200 rounded-full px-4 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Yorum yaz..."
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                        />
                        <button type="submit" disabled={!commentText.trim()} className="text-blue-600 hover:bg-blue-50 p-2 rounded-full disabled:opacity-50">
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
