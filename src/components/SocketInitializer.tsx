"use client";

import { useEffect, useState } from "react";
import { SocketProvider } from "@/components/providers/SocketProvider";

export default function SocketInitializer({
    children,
}: {
    children: React.ReactNode;
}) {
    const [userId, setUserId] = useState<string | undefined>(undefined);

    useEffect(() => {
        fetch("/api/auth/me")
            .then((res) => {
                if (res.ok) return res.json();
                return null;
            })
            .then((data) => {
                if (data && data.user) {
                    setUserId(data.user.id);
                }
            })
            .catch(() => {
                // user not logged in or error
            });
    }, []);

    return <SocketProvider userId={userId}>{children}</SocketProvider>;
}
