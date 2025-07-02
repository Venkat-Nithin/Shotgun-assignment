import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_SOCKET_SERVER || 'http://localhost:4000');
window.socket = socket;

function App() {
  const [roomId, setRoomId] = useState('');
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [mySocketId, setMySocketId] = useState(null);
  const [turnSocket, setTurnSocket] = useState(null);
  const [playerList, setPlayerList] = useState([]);
  const [selected, setSelected] = useState([]); // all picked players
  const [mySelected, setMySelected] = useState([]); // your team
  const [selectionOver, setSelectionOver] = useState(false);

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

  const selectPlayer = (player) => {
    if (turnSocket !== mySocketId) {
      alert("It's not your turn yet!");
      return;
    }

    setTurnSocket(null); // prevent double-clicks
    socket.emit('select-player', { roomId: joinedRoom, playerName: player });
  };

  useEffect(() => {
    socket.on('you-are', (id) => {
      setMySocketId(id);
    });

    socket.on('selection-started', ({ turnOrder, currentTurn }) => {
      alert(
        `Selection Started!\n\nTurn Order:\n${turnOrder.join(
          '\n'
        )}\n\nCurrent Turn:\n${currentTurn}`
      );
      setTurnSocket(currentTurn);
      setSelectionOver(false);
      setSelected([]);
      setMySelected([]);
    });

    socket.on('turn-changed', (socketId) => {
      setTurnSocket(socketId);
    });

    socket.on('player-selected', ({ player, by }) => {
      setSelected((prev) => [...prev, player]);
      if (by === mySocketId) {
        setMySelected((prev) => [...prev, player]);
      }
    });

    socket.on('player-auto-selected', ({ player, by }) => {
      setSelected((prev) => [...prev, player]);
      if (by === mySocketId) {
        setMySelected((prev) => [...prev, player]);
      }
    });

    socket.on('selection-ended', (finalRoom) => {
      alert('🏁 Selection Completed!');
      setSelectionOver(true);
    });

    socket.on('error-msg', (msg) => {
      alert(`Error: ${msg}`);
    });

    setPlayerList(Array.from({ length: 50 }, (_, i) => `Player-${i + 1}`));

    return () => {
      socket.off('you-are');
      socket.off('selection-started');
      socket.off('turn-changed');
      socket.off('player-selected');
      socket.off('player-auto-selected');
      socket.off('selection-ended');
      socket.off('error-msg');
    };
  }, [mySocketId]);

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Fantasy Team Selection!</h1>

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
            You have joined: Room - <code>{joinedRoom}</code>
          </h3>
          <p>
            You are a <strong>{isHost ? 'Host' : 'Player'}</strong>
          </p>

          {isHost && !selectionOver && (
            <button
              onClick={() =>
                socket.emit('start-selection', { roomId: joinedRoom })
              }
              style={{ marginTop: '1rem' }}
            >
              🚀 Start Selection
            </button>
          )}

          {turnSocket === mySocketId && !selectionOver && (
            <div style={{ marginTop: '2rem' }}>
              <h4>Your Turn! Select a player:</h4>
              {playerList
                .filter((p) => !selected.includes(p))
                .map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectPlayer(p)}
                    style={{
                      margin: '0.5rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#eee'
                    }}
                  >
                    {p}
                  </button>
                ))}
            </div>
          )}

          {mySelected.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h4>📋 Your Selected Team:</h4>
              <ul>
                {mySelected.map((p, idx) => (
                  <li key={idx}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {selectionOver && <p>Selection has ended for all players.</p>}
        </>
      )}
    </div>
  );
}

export default App;
