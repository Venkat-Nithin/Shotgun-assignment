const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const redisClient = require('./redisClient');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const {
  createRoom,
  joinRoom,
  startSelection,
  handlePlayerSelection
} = require('./roomManager');

const activeTimers = {};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000", 
      "https://shotgun-assignment-67dg.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = 4000;

app.get('/', (req, res) => {
  res.send('✅ Backend is up and running!');
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

io.on('connection', (socket) => {
  console.log('🟢 Connected:', socket.id);
  socket.emit('you-are', socket.id);

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

    io.to(roomId).emit('selection-started', {
      turnOrder: result.turnOrder,
      currentTurn: result.currentTurnSocketId
    });

    startTurnTimer(roomId, result.currentTurnSocketId);
  });

  socket.on('select-player', async ({ roomId, playerName }) => {
    console.log(`[SERVER] select-player from ${socket.id}, picking ${playerName} in ${roomId}`);

    const result = await handlePlayerSelection(roomId, socket.id, playerName);
    if (result.error) {
      console.log(`[SERVER] ❌ Error: ${result.error}`);
      socket.emit('error-msg', result.error);
      return;
    }

    clearTimeout(activeTimers[roomId]);

    io.to(roomId).emit('player-selected', {
      player: result.player,
      by: socket.id
    });

    if (result.selectionComplete || !result.nextTurn) {
      io.to(roomId).emit('selection-ended', result.updatedRoom);
      clearTimeout(activeTimers[roomId]);
      delete activeTimers[roomId];
    } else {
      const next = result.nextTurn;
      io.to(roomId).emit('turn-changed', next);
      startTurnTimer(roomId, next);
    }
  });

  function startTurnTimer(roomId, turnSocketId) {
    if (!turnSocketId) return;

    console.log(`[TIMER] Starting timer for ${turnSocketId} in ${roomId}`);
    activeTimers[roomId] = setTimeout(async () => {
      const autoResult = await handlePlayerSelection(roomId, turnSocketId);
      if (autoResult?.error) {
        console.log(`[AUTO] Error: ${autoResult.error}`);
        return;
      }

      io.to(roomId).emit('player-auto-selected', {
        player: autoResult.player,
        by: turnSocketId
      });

      if (autoResult.selectionComplete || !autoResult.nextTurn) {
        io.to(roomId).emit('selection-ended', autoResult.updatedRoom);
        clearTimeout(activeTimers[roomId]);
        delete activeTimers[roomId];
      } else {
        const next = autoResult.nextTurn;
        io.to(roomId).emit('turn-changed', next);
        startTurnTimer(roomId, next);
      }
    }, 10000);
  }
});
