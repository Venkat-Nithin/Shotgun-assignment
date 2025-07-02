const { v4: uuidv4 } = require('uuid');
const redisClient = require('./redisClient');

const ROOM_PREFIX = 'room:';

async function createRoom(hostSocketId) {
  const roomId = uuidv4();

  const roomData = {
    id: roomId,
    host: hostSocketId,
    players: [hostSocketId],
    playerData: {
      [hostSocketId]: {
        name: `User-${hostSocketId.slice(0, 5)}`,
        selectedPlayers: []
      }
    },
    availablePlayers: generatePlayerPool(),
    turnOrder: [],
    currentTurnIndex: 0,
    isSelectionStarted: false
  };

  await redisClient.set(`${ROOM_PREFIX}${roomId}`, JSON.stringify(roomData));
  return roomData;
}

async function joinRoom(roomId, socketId) {
  const key = `${ROOM_PREFIX}${roomId}`;
  const roomDataStr = await redisClient.get(key);
  if (!roomDataStr) return null;

  const roomData = JSON.parse(roomDataStr);
  if (roomData.isSelectionStarted) return null;

  if (!roomData.players.includes(socketId)) {
    roomData.players.push(socketId);
  }

  roomData.playerData[socketId] = {
    name: `User-${socketId.slice(0, 5)}`,
    selectedPlayers: []
  };

  await redisClient.set(key, JSON.stringify(roomData));
  return roomData;
}

async function startSelection(roomId) {
  const key = `${ROOM_PREFIX}${roomId}`;
  const roomDataStr = await redisClient.get(key);
  if (!roomDataStr) return null;

  const roomData = JSON.parse(roomDataStr);
  const players = [...roomData.players];

  for (let i = players.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [players[i], players[j]] = [players[j], players[i]];
  }

  roomData.turnOrder = players;
  roomData.currentTurnIndex = 0;
  roomData.isSelectionStarted = true;

  await redisClient.set(key, JSON.stringify(roomData));

  return {
    turnOrder: players,
    currentTurnSocketId: players[0]
  };
}

async function handlePlayerSelection(roomId, socketId, selectedPlayer = null) {
  const key = `room:${roomId}`;
  const roomStr = await redisClient.get(key);
  if (!roomStr) return { error: 'Room not found' };

  const room = JSON.parse(roomStr);

  const currentTurnSocket = room.turnOrder[room.currentTurnIndex];
  if (socketId !== currentTurnSocket) {
    return { error: 'Not your turn' };
  }

  if (!room.playerData[socketId]) {
    return { error: 'You are not in this room' };
  }

  const playerPool = room.availablePlayers;
  const player = selectedPlayer || playerPool[Math.floor(Math.random() * playerPool.length)];

  room.availablePlayers = playerPool.filter((p) => p !== player);
  room.playerData[socketId].selectedPlayers.push(player);

  // Rotate turn to next player who hasn't finished
  let totalTurns = room.turnOrder.length;
  let tries = 0;

  do {
    room.currentTurnIndex = (room.currentTurnIndex + 1) % totalTurns;
    tries++;
  } while (
    room.playerData[room.turnOrder[room.currentTurnIndex]]?.selectedPlayers.length >= 5 &&
    tries <= totalTurns
  );

  const selectionComplete = room.turnOrder.every(
    (sid) => room.playerData[sid]?.selectedPlayers.length >= 5
  );

  await redisClient.set(key, JSON.stringify(room));

  return {
    player,
    by: socketId,
    nextTurn: room.turnOrder[room.currentTurnIndex],
    selectionComplete,
    updatedRoom: room
  };
}

function generatePlayerPool() {
  const players = [];
  for (let i = 1; i <= 50; i++) {
    players.push(`Player-${i}`);
  }
  return players;
}

module.exports = {
  createRoom,
  joinRoom,
  startSelection,
  handlePlayerSelection
};
