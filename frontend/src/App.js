import React, { useState } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:4000'); // change this if backend is hosted

function App() {
  const [roomId, setRoomId] = useState('');
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [isHost, setIsHost] = useState(false);

  const createRoom = () => {
    socket.emit('create-room', ({ roomId, host }) => {
      setRoomId(roomId);
      setIsHost(host);
      setJoinedRoom(roomId);
    });
  };

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

  return (
    <div style={{ padding: '2rem' }}>
      <h1>🏏 Shotgun Team Selection</h1>

      {!joinedRoom ? (
        <>
          <button onClick={createRoom}>Create Room</button>

          <div style={{ marginTop: '1rem' }}>
            <input
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <button onClick={joinRoom} style={{ marginLeft: '1rem' }}>
              Join Room
            </button>
          </div>
        </>
      ) : (
        <>
          <h3>You joined room: <code>{joinedRoom}</code></h3>
          <p>You are a {isHost ? 'Host' : 'Player'}</p>
        </>
      )}
    </div>
  );
}

export default App;
