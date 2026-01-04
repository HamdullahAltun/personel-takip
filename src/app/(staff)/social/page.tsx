"use client";

import { useState, useEffect } from "react";
import { Heart, MessageCircle, Send, Image as ImageIcon, MoreHorizontal, Trash2, Trophy, Award, Star, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

type User = {
    id: string;
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
    type: 'STANDARD' | 'KUDOS';
    kudosTarget?: { name: string };
    kudosCategory?: string;
};

export default function StaffSocialPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState("");
    const [showImageInput, setShowImageInput] = useState(false);
    const [imageUrl, setImageUrl] = useState("");

    // Kudos State
    const [postType, setPostType] = useState<'STANDARD' | 'KUDOS'>('STANDARD');
    const [kudosTargetId, setKudosTargetId] = useState("");
    const [kudosCategory, setKudosCategory] = useState("TEAMWORK");

    useEffect(() => {
        fetchPosts();
        fetchUsers();
    }, []);

    const fetchPosts = async () => {
        const res = await fetch("/api/social");
        if (res.ok) setPosts(await res.json());
        setLoading(false);
    };

    const fetchUsers = async () => {
        const res = await fetch("/api/users");
        if (res.ok) setUsers(await res.json());
    };

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.trim() && postType === 'STANDARD') return;
        if (postType === 'KUDOS' && (!kudosTargetId || !newPost.trim())) return;

        const body = {
            content: newPost,
            imageUrl,
            type: postType,
            ...(postType === 'KUDOS' && { kudosTargetId, kudosCategory })
        };

        const res = await fetch("/api/social", {
            method: "POST",
            body: JSON.stringify(body),
            headers: { "Content-Type": "application/json" }
        });

        if (res.ok) {
            setNewPost("");
            setImageUrl("");
            setShowImageInput(false);
            setPostType('STANDARD');
            setKudosTargetId("");
            fetchPosts();
        }
    };

    const handleLike = async (id: string) => {
        setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: [...p.likes, { userId: 'me' }] } : p));
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
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 transaction-all duration-200">
                <div className="flex gap-4 mb-4 border-b border-slate-100 pb-2">
                    <button
                        onClick={() => setPostType('STANDARD')}
                        className={`text-sm font-bold pb-2 relative ${postType === 'STANDARD' ? 'text-blue-600' : 'text-slate-400'}`}
                    >
                        Gönderi
                        {postType === 'STANDARD' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />}
                    </button>
                    <button
                        onClick={() => setPostType('KUDOS')}
                        className={`text-sm font-bold pb-2 relative flex items-center gap-1 ${postType === 'KUDOS' ? 'text-yellow-600' : 'text-slate-400'}`}
                    >
                        <Trophy className="w-3.5 h-3.5" />
                        Teşekkür Et (Kudos)
                        {postType === 'KUDOS' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-600 rounded-full" />}
                    </button>
                </div>

                <form onSubmit={handlePost}>
                    {postType === 'KUDOS' && (
                        <div className="mb-3 space-y-3 bg-yellow-50 p-3 rounded-xl border border-yellow-100 animate-in fade-in">
                            <div>
                                <label className="block text-xs font-bold text-yellow-700 mb-1">Kime?</label>
                                <select
                                    className="w-full text-sm border-yellow-200 rounded-lg p-2 bg-white focus:ring-yellow-500"
                                    value={kudosTargetId}
                                    onChange={e => setKudosTargetId(e.target.value)}
                                >
                                    <option value="">Çalışma arkadaşını seç...</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-yellow-700 mb-1">Hangi Değer?</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'TEAMWORK', label: 'Takım Çalışması', icon: '🤝' },
                                        { id: 'LEADERSHIP', label: 'Liderlik', icon: '🦁' },
                                        { id: 'INNOVATION', label: 'İnovasyon', icon: '💡' },
                                        { id: 'SPEED', label: 'Hız', icon: '⚡' },
                                    ].map(cat => (
                                        <button
                                            key={cat.id}
                                            type="button"
                                            onClick={() => setKudosCategory(cat.id)}
                                            className={`text-xs text-left p-2 rounded-lg border flex items-center gap-2 transition-all ${kudosCategory === cat.id ? 'bg-yellow-200 border-yellow-400 font-bold' : 'bg-white border-yellow-100'}`}
                                        >
                                            <span>{cat.icon}</span> {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <textarea
                        className="w-full resize-none border-none focus:ring-0 text-slate-700 placeholder:text-slate-400 text-base"
                        placeholder={postType === 'KUDOS' ? "Neden teşekkür etmek istersin?" : "Neler oluyor?"}
                        rows={2}
                        value={newPost}
                        onChange={e => setNewPost(e.target.value)}
                    />

                    {postType === 'STANDARD' && showImageInput && (
                        <input
                            className="w-full border p-2 rounded mb-3 text-sm"
                            placeholder="Resim URL'si (Opsiyonel)"
                            value={imageUrl}
                            onChange={e => setImageUrl(e.target.value)}
                        />
                    )}

                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-2">
                        {postType === 'STANDARD' ? (
                            <button type="button" onClick={() => setShowImageInput(!showImageInput)} className="text-slate-400 hover:text-blue-500 p-2 rounded-full hover:bg-slate-50">
                                <ImageIcon className="w-5 h-5" />
                            </button>
                        ) : <div />}

                        <button
                            type="submit"
                            disabled={!newPost.trim() || (postType === 'KUDOS' && !kudosTargetId)}
                            className={`${postType === 'KUDOS' ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'} text-white px-5 py-1.5 rounded-full font-medium disabled:opacity-50 transition text-sm flex items-center gap-2`}
                        >
                            {postType === 'KUDOS' ? <Trophy className="w-4 h-4" /> : <Send className="w-4 h-4 ml-1" />}
                            {postType === 'KUDOS' ? 'Gönder' : 'Paylaş'}
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

    const isKudos = post.type === 'KUDOS';

    return (
        <div className={`bg-white rounded-xl shadow-sm border overflow-hidden ${isKudos ? 'border-yellow-200' : 'border-slate-200'}`}>
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden ${isKudos ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-200 text-slate-500'}`}>
                            {post.user.profilePicture ? <img src={post.user.profilePicture} className="w-full h-full object-cover" /> : post.user.name[0]}
                        </div>
                        <div>
                            {isKudos ? (
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <h3 className="font-bold text-slate-900 text-sm">{post.user.name}</h3>
                                        <span className="text-slate-400 text-xs">bir teşekkür gönderdi</span>
                                        <Trophy className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                        <span className="font-bold text-slate-900 text-sm">{post.kudosTarget?.name}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full w-fit mt-0.5 border border-yellow-100">
                                        {post.kudosCategory === 'TEAMWORK' ? '🤝 Takım Çalışması' :
                                            post.kudosCategory === 'LEADERSHIP' ? '🦁 Liderlik' :
                                                post.kudosCategory === 'INNOVATION' ? '💡 İnovasyon' : '⚡ Hız'}
                                    </span>
                                </div>
                            ) : (
                                <h3 className="font-bold text-slate-900 text-sm">{post.user.name}</h3>
                            )}
                            <p className="text-xs text-slate-500">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: tr })}</p>
                        </div>
                    </div>
                </div>

                <p className={`mt-2 whitespace-pre-wrap text-sm ${isKudos ? 'text-slate-700 italic border-l-2 border-yellow-300 pl-3 py-1' : 'text-slate-800'}`}>
                    {post.content}
                </p>

                {post.imageUrl && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-slate-100">
                        <img src={post.imageUrl} alt="Attachment" className="w-full h-auto max-h-80 object-cover" />
                    </div>
                )}
            </div>

            <div className="px-4 py-2 border-t border-slate-50 flex gap-6">
                <button onClick={onLike} className={`flex items-center gap-2 transition group p-2 rounded -ml-2 ${isKudos ? 'text-yellow-600 hover:bg-yellow-50' : 'text-slate-500 hover:text-red-500 hover:bg-red-50'}`}>
                    <Heart className={`w-5 h-5 group-hover:fill-current`} />
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
