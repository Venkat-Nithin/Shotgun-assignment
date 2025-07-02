import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// connect to backend
const socket = io('http://localhost:4000'); // Make sure backend is running on port 4000

function App() {
  const [roomId, setRoomId] = useState('');
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [isHost, setIsHost] = useState(false);

  // Create Room
  const createRoom = () => {
    socket.emit('create-room', ({ roomId, host }) => {
      setRoomId(roomId);
      setIsHost(host);
      setJoinedRoom(roomId);
    });
  };

  // Join Room
  const joinRoom = () => {
    socket.emit('join-room', { roomId }, ({ error, host }) => {
      if (error) {
        alert(error);
      } else {
        setIsHost(host);
        setJoinedRoom(roomId);
      }
    });
  };

  // Listen for "selection-started" broadcast
  useEffect(() => {
    socket.on('selection-started', ({ turnOrder, currentTurn }) => {
      alert(
        `🎯 Selection Started!\n\nTurn Order:\n${turnOrder.join(
          '\n'
        )}\n\nCurrent Turn:\n${currentTurn}`
      );
    });

    // Clean up listener
    return () => socket.off('selection-started');
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>🏏 Shotgun Team Selection</h1>

      {!joinedRoom ? (
        <>
          <button onClick={createRoom}>Create Room</button>

          <div style={{ marginTop: '1rem' }}>
            <input
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              style={{ padding: '0.5rem' }}
            />
            <button onClick={joinRoom} style={{ marginLeft: '1rem' }}>
              Join Room
            </button>
          </div>
        </>
      ) : (
        <>
          <h3>
            ✅ Joined Room: <code>{joinedRoom}</code>
          </h3>
          <p>You are a <strong>{isHost ? 'Host' : 'Player'}</strong></p>

          {/* Host only: Start selection button */}
          {isHost && (
            <button
              onClick={() =>
                socket.emit('start-selection', { roomId: joinedRoom })
              }
              style={{ marginTop: '1rem' }}
            >
              🚀 Start Selection
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default App;
