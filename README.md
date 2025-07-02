# Shotgun-assignment

**Backend deployed link:** [https://shotgun-assignment.onrender.com](https://shotgun-assignment.onrender.com)  
**Frontend deployed link:** [https://shotgun-assignment-67dg.vercel.app](https://shotgun-assignment-67dg.vercel.app)

This is a real-time multiplayer application built with **Express.js** and **Socket.IO** that simulates a turn-based team selection room. Multiple users can join a room and take turns selecting players from a common pool in a randomized draft-style format.

---

## 🛠 Tech Stack

**Frontend:**
- React.js
- Socket.IO Client

**Backend:**
- Node.js
- Express.js
- Socket.IO
- Redis (Upstash for production)
- `roomManager.js` – Core game logic (room management, turns, auto-pick, etc.)

---

## How the project works

1. Open the **frontend link** in multiple tabs or devices (at least 2).
2. In one tab/device (the **host**), click **Create Room**.
   - The room ID will be shown on screen.
3. In the other tabs/devices (the **players**), use the room ID to **join the room**.
4. Once all players have joined, the **host** can start the selection process.
5. The selection order is randomly generated and shown to all players.
6. Players take turns picking from the player pool:
   - Each player has **10 seconds** to select.
   - If time runs out, a **random player** is auto-picked.
   - Chosen players are removed from the pool and displayed on all screens.
7. Each user builds a team of **5 players**.
8. Once all teams are complete, a final alert notifies everyone that the selection is finished.

---

## ✅ Features Implemented

- Room creation and joining
- Real-time state updates using Socket.IO
- Turn-based player selection logic
- Auto-pick on timeout
- Player pool updates across clients
- Redis for persistent room state
- Responsive UI (basic)

