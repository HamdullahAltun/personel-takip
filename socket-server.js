const { Server } = require("socket.io");
const http = require("http");

const httpServer = http.createServer();
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for now, restrict in production
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_room", (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room: ${room}`);
    });

    socket.on("send_message", (data) => {
        // data: { receiverId, conent, ... }
        // Broadcast to the receiver's room (using their userId as room name)
        if (data.receiverId) {
            io.to(data.receiverId).emit("receive_message", data);
        }
    });

    socket.on("send_notification", (data) => {
        if (data.userId) {
            io.to(data.userId).emit("notification", data);
        }
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

const PORT = 3001; // Separate port from Next.js (usually 3000)
httpServer.listen(PORT, () => {
    console.log(`Socket.io server running on port ${PORT}`);
});
