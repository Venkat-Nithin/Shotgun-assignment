const { v4: uuidv4 } = require('uuid');
const redisClient = require('./redisClient');

const ROOM_PREFIX = 'room:';

async function createRoom(hostSocketId) {
  const roomId = uuidv4();

  const roomData = {
    id: roomId,
    host: hostSocketId,
    players: [hostSocketId],
    playerData: {},  // socketId -> { name, selectedPlayers: [] }
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

  roomData.players.push(socketId);
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

  // Shuffle turn order
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


function generatePlayerPool() {
  // You can replace this with actual player names
  const players = [];
  for (let i = 1; i <= 50; i++) {
    players.push(`Player-${i}`);
  }
  return players;
}

module.exports = {
  createRoom,
  joinRoom,
  startSelection
};
