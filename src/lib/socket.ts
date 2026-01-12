"use client";

import { io } from "socket.io-client";

// URL should be environment variable in production
const SOCKET_URL = "http://localhost:3001";

export const socket = io(SOCKET_URL, {
    autoConnect: false,
});
