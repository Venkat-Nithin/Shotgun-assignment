const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const redisClient = require('./redisClient');
const { v4: uuidv4 } = require('uuid');
const { createRoom, joinRoom, startSelection } = require('./roomManager');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // change this in production
    methods: ["GET", "POST"]
  }
});

const PORT = 4000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


io.on('connection', (socket) => {
  console.log('🟢 Connected:', socket.id);

  socket.on('create-room', async (callback) => {
    const room = await createRoom(socket.id);
    socket.join(room.id);
    callback({ roomId: room.id, host: true });
  });

  socket.on('join-room', async ({ roomId }, callback) => {
    const room = await joinRoom(roomId, socket.id);
    if (!room) {
      callback({ error: 'Room not found or already started' });
      return;
    }
    socket.join(roomId);
    callback({ roomId, host: false });
  });

  socket.on('start-selection', async ({ roomId }) => {
    const result = await startSelection(roomId);
    if (!result) return;
    
    // Broadcast to everyone in the room
    io.to(roomId).emit('selection-started', {
      turnOrder: result.turnOrder,
      currentTurn: result.currentTurnSocketId
    });
  });
});