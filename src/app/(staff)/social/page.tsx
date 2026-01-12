"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import StoriesBar from "@/components/social/StoriesBar";
import CreatePost from "@/components/social/CreatePost";
import PostCard from "@/components/social/PostCard";
import { Skeleton } from "@/components/ui/Skeleton";

export default function StaffSocialPage() {
    const [posts, setPosts] = useState<any[]>([]); // Using any for flexibility with backend response
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState("");
    const [userRole, setUserRole] = useState("");

    // Pagination
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchUsers();
        fetch('/api/auth/me').then(res => res.json()).then(d => {
            if (d.user) {
                setCurrentUserId(d.user.id);
                setUserRole(d.user.role);
            }
        });
        loadMorePosts(true);
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/users");
            if (res.ok) setUsers(await res.json());
        } catch (e) {
            console.error("Failed to fetch users", e);
        }
    };

    const loadMorePosts = async (reset = false) => {
        if (!hasMore && !reset) return;
        setLoading(true);

        const lastPostId = reset ? '' : posts[posts.length - 1]?.id;
        const url = `/api/social?cursor=${lastPostId || ''}`;

        try {
            const res = await fetch(url);
            if (res.ok) {
                const newPosts = await res.json();
                if (newPosts.length < 10) setHasMore(false);
                setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
            }
        } finally {
            setLoading(false);
        }
    };

    const refreshPosts = () => {
        setHasMore(true);
        loadMorePosts(true);
    };

    return (
        <div className="max-w-xl mx-auto space-y-6 pb-24 animate-in fade-in duration-500">
            <StoriesBar />

            <div className="flex items-center justify-between px-2">
                <h1 className="text-2xl font-bold text-slate-900">Sosyal Akış</h1>
                <button
                    onClick={refreshPosts}
                    className="p-2 text-slate-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            <CreatePost onPostCreated={refreshPosts} users={users} userRole={userRole} />

            <div className="space-y-4">
                {posts.map(post => (
                    <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={currentUserId}
                    />
                ))}

                {loading && (
                    <div className="space-y-4">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="w-10 h-10 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                </div>
                                <Skeleton className="h-16 w-full" />
                                <div className="flex gap-4">
                                    <Skeleton className="h-8 w-16" />
                                    <Skeleton className="h-8 w-16" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {posts.length === 0 && !loading && (
                    <div className="text-center py-10">
                        <p className="text-slate-400 italic">Henüz paylaşım yok.</p>
                        <p className="text-xs text-slate-300 mt-2">İlk paylaşımı sen yap!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
