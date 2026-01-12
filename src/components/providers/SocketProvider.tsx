"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { socket } from "@/lib/socket";

type SocketContextType = {
    isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({
    isConnected: false,
});

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({
    children,
    userId,
}: {
    children: React.ReactNode;
    userId?: string;
}) => {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!userId) return;

        if (socket.connected) {
            onConnect();
        }

        function onConnect() {
            setIsConnected(true);
            if (userId) {
                socket.emit("join_room", userId);
            }
        }

        function onDisconnect() {
            setIsConnected(false);
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        socket.connect();

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.disconnect();
        };
    }, [userId]);

    return (
        <SocketContext.Provider value={{ isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
