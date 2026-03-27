const { Server } = require("socket.io");
const config = require('./config');

let io;

module.exports = {
    init: (httpServer) => {
        io = new Server(httpServer, {
            cors: {
                origin: config.frontendUrl || 'http://localhost:5173',
                credentials: true
            }
        });

        io.on('connection', (socket) => {
            console.log(`🔌 New client connected: ${socket.id}`);

            // User joins their own personal room to receive private notifications
            socket.on('join_user_room', (userId) => {
                if (userId) {
                    socket.join(userId);
                    console.log(`👤 User ${userId} joined their personal room`);
                }
            });

            socket.on('disconnect', () => {
                console.log(`🔌 Client disconnected: ${socket.id}`);
            });
        });

        return io;
    },
    getIo: () => {
        if (!io) {
            throw new Error("Socket.io not initialized!");
        }
        return io;
    }
};
