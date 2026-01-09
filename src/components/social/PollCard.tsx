"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PollOption = {
    id: string;
    text: string;
    votes: { userId: string }[];
};

type PollCardProps = {
    postId: string;
    options: PollOption[];
    currentUserId: string; // To know if I voted
    onVote: (updatedOptions: PollOption[]) => void; // Trigger refresh with new data
};

export default function PollCard({ postId, options, currentUserId, onVote }: PollCardProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    // Calculate total votes
    const totalVotes = options.reduce((acc, opt) => acc + opt.votes.length, 0);

    // Find my vote
    const myVoteOptionId = options.find(opt => opt.votes.some(v => v.userId === currentUserId))?.id;

    const handleVote = async (optionId: string) => {
        if (loadingId) return;
        setLoadingId(optionId);

        try {
            const res = await fetch("/api/social/vote", {
                method: "POST",
                body: JSON.stringify({ pollOptionId: optionId, postId }),
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                const updatedOptions = await res.json();
                onVote(updatedOptions);
            }
        } catch (error) {
            console.error("Vote failed", error);
        } finally {
            setLoadingId(null);
        }
    };

    return (
        <div className="mt-3 space-y-2">
            {options.map((option) => {
                const voteCount = option.votes.length;
                const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                const isSelected = myVoteOptionId === option.id;
                const isWinning = totalVotes > 0 && voteCount === Math.max(...options.map(o => o.votes.length));

                return (
                    <button
                        key={option.id}
                        onClick={() => handleVote(option.id)}
                        disabled={!!loadingId}
                        className={cn(
                            "relative w-full text-left p-3 rounded-xl border transition-all overflow-hidden group hover:border-blue-300",
                            isSelected ? "border-blue-500 bg-blue-50/50" : "border-slate-200 bg-white"
                        )}
                    >
                        {/* Progress Bar Background */}
                        <div
                            className={cn(
                                "absolute top-0 left-0 bottom-0 bg-blue-100/50 transition-all duration-500",
                                isSelected ? "bg-blue-200/50" : ""
                            )}
                            style={{ width: `${percentage}%` }}
                        />

                        <div className="relative flex justify-between items-center z-10">
                            <span className={cn(
                                "font-medium text-sm",
                                isSelected ? "text-blue-700" : "text-slate-700"
                            )}>
                                {option.text}
                            </span>

                            <div className="flex items-center gap-2">
                                {loadingId === option.id && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                                {isSelected && !loadingId && <Check className="w-4 h-4 text-blue-600" />}
                                <span className="text-xs font-bold text-slate-500">{percentage}%</span>
                            </div>
                        </div>

                        {/* Hover info for vote count */}
                        <div className="relative z-10 text-[10px] text-slate-400 mt-0.5 pl-0.5">
                            {voteCount} oy
                        </div>
                    </button>
                );
            })}

            <div className="text-right text-xs text-slate-400 mt-1">
                Toplam {totalVotes} oy kullanıldı
            </div>
        </div>
    );
}
