"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { toast } from "sonner";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StatusData {
    unreadMessages: number;
    pendingTasks: number;
    pendingLeaves: number; // If manager
}

interface StatusPollerProps {
    onUnreadChange: (count: number) => void;
}

export default function StatusPoller({ onUnreadChange }: StatusPollerProps) {
    // Poll for unread messages and tasks every 10 seconds
    const { data, error } = useSWR<StatusData>('/api/staff/live-status', fetcher, {
        refreshInterval: 10000,
        revalidateOnFocus: true,
    });

    useEffect(() => {
        if (data) {
            onUnreadChange(data.unreadMessages || 0);

            // Logic to show toast if something new arrived (requires tracking previous state, keeping it simple for now)
            // Ideally we'd compare previous data ref with current data
        }
    }, [data, onUnreadChange]);

    return null; // Headless component
}
