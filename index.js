import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { Server } from 'socket.io';

const app = express();
app.use(express.json());
dotenv.config();

// Cors Configuration
const whitelist = [process.env.FRONTEND_URL];
const corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Error - Cors'));
        }
    }
}
app.use(cors(corsOptions));
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Socket.io
const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: false
    }
});

io.on('connection', (socket) => {
    socket.on('join-game', (data) => {
        socket.join(data);
        socket.to(data).emit('join-game', 'Player2 connected');
    });
    socket.on('sending', (data) => {
        socket.to(data.id).emit('receiving', data);
    });
    socket.on('rematch', (gameId) => {
        socket.to(gameId).emit('sendingRematch', 'Opponent wants a rematch');
    });
    socket.on('acceptedrematch', (gameId) => {
        socket.to(gameId).emit('sendingAcceptedRematch', 'Opponent accepted a rematch');
    });
    socket.on('rejectedrematch', (gameId) => {
        socket.to(gameId).emit('sendingRejectedRematch', 'Opponent rejected a rematch');
    });

    socket.on('leaving', (gameId) => {
        socket.to(gameId).emit('sendingleaving', 'Opponent has left the game');
        socket.leave(gameId);
    });
});