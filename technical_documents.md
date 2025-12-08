# Technical Documentation & Codebase Guide

> **For AI Agents:** This document is your primary source of truth for the codebase structure, implementation details, and architecture. Read this first to understand how the system works.

## 1. Architecture Overview

The application is a real-time multiplayer board game (Monopoly clone) using a **Rust backend** and a **React frontend**.

- **Communication:** WebSocket (Native API) for real-time game state updates.
- **State Authority:** The Backend is the single source of truth. The Frontend is a view layer that sends intents (`ClientMessage`) and renders the received state (`ServerMessage`).
- **Data Persistence:** In-memory (`DashMap`) for active rooms. No database is currently used.

### High-Level Diagram
```mermaid
graph TD
    Client[React Client] <-->|WebSocket JSON| Server[Rust Axum Server]
    Server -->|Manage| Rooms[Room Manager (DashMap)]
    Rooms -->|Contains| Game[Game Logic & State]
```

---

## 2. Codebase Map

### Backend (`/backend/src`)

| File/Directory | Purpose | Key Symbols |
|----------------|---------|-------------|
| `main.rs` | Entry point. Sets up Axum router, WebSocket route `/ws`, and logging. | `main`, `app`, `logs_handler` |
| `ws/` | WebSocket handling logic. | |
| `ws/handler.rs` | Manages the WebSocket connection lifecycle (connect, loop, disconnect). | `ws_handler` |
| `ws/messages.rs` | Defines the JSON protocol between client and server. | `ClientMessage`, `ServerMessage` |
| `game/` | Core game logic. | |
| `game/state.rs` | Data structures for the game state. | `GameState`, `PlayerState`, `PropertyState`, `GamePhase` |
| `game/logic.rs` | Rules engine (rent, movement, etc.). | *Implementation details* |
| `game/board.rs` | Static board data (properties, prices). | `PROPERTIES` |
| `room/` | Room management. | |
| `room/manager.rs` | Thread-safe collection of active rooms. | `RoomManager` |
| `room/room.rs` | Individual room logic (broadcasting messages). | `Room` |

### Frontend (`/frontend/src`)

| File/Directory | Purpose | Key Symbols |
|----------------|---------|-------------|
| `App.tsx` | Main component, handles routing/view switching. | `App` |
| `store.ts` | Global state management using Zustand. | `useGameStore` |
| `types/game.ts` | TypeScript definitions matching backend structs. | `GameState`, `ClientMessage`, `ServerMessage` |
| `hooks/useWebSocket.ts` | Custom hook for WebSocket connection. | `useWebSocket` |
| `components/` | UI Components. | |
| `components/Game/` | Game-specific components (Board, PlayerList). | |

---

## 3. Core Data Structures

### Game State (`backend/src/game/state.rs` & `frontend/src/types/game.ts`)

The `GameState` is the central object synchronized to all clients.

```rust
// Backend (Rust)
pub struct GameState {
    pub players: Vec<PlayerState>,
    pub properties: Vec<PropertyState>,
    pub current_turn: usize, // Index of the player whose turn it is
    pub phase: GamePhase,    // Waiting, Rolling, Moving, EndTurn
}

pub struct PlayerState {
    pub id: String,
    pub name: String,
    pub money: i32,
    pub position: usize,
    pub color: String,
    pub is_in_jail: bool,
}

pub enum GamePhase {
    Waiting,
    Rolling,
    Moving,
    EndTurn,
}
```

---

## 4. Message Protocol

### Client -> Server (`ClientMessage`)

Sent by the frontend to trigger actions.

```json
// Examples
{ "type": "CreateRoom", "player_name": "Alice" }
{ "type": "JoinRoom", "room_code": "ABCD", "player_name": "Bob" }
{ "type": "RollDice" }
{ "type": "BuyProperty" }
{ "type": "EndTurn" }
{ "type": "VoteKick", "target_player_id": "uuid" }
```

### Server -> Client (`ServerMessage`)

Broadcasted by the server to update clients.

```json
// Examples
{ "type": "RoomCreated", "room_code": "ABCD", "player_id": "uuid", "players": [...] }
{ "type": "GameStateUpdate", "state": { ... } }
{ "type": "DiceRolled", "dice": [4, 2], "state": { ... } }
{ "type": "Error", "message": "Not enough money" }
```

---

## 5. State Management (Frontend)

The frontend uses **Zustand** (`store.ts`) to store the game state locally.

```typescript
interface GameStore {
    roomCode: string | null;
    playerId: string | null;
    players: Player[];
    gameState: GameState | null;
    dice: [number, number] | null;
    voteState: VoteState | null;
    
    // Actions
    setGameState: (state: GameState) => void;
    // ... other setters
}
```

## 6. Key Workflows

### Room Creation
1. Client sends `CreateRoom`.
2. Server generates `room_code`, creates `Room`, adds player.
3. Server sends `RoomCreated` to client.

### Game Loop
1. **Start:** Host sends `StartGame` -> Server initializes `GameState` -> Broadcasts `GameStarted`.
2. **Turn:**
   - Active player sends `RollDice`.
   - Server calculates move, updates `position`, handles events (Rent, Go to Jail).
   - Server broadcasts `DiceRolled` (with new state).
3. **Action:**
   - Player sends `BuyProperty` or `PayRent`.
   - Server validates, updates `money`/`owner`, broadcasts `GameStateUpdate`.
4. **End:**
   - Player sends `EndTurn`.
   - Server increments `current_turn`, broadcasts `TurnEnded`.

### Bankruptcy Flow
1. **Trigger:** When `PayRent` is sent and player has insufficient funds.
2. **Detection:** `handle_pay_rent` returns `PayRentResult::BankruptcyRequired { creditor_id, rent_owed }`.
3. **Execution:** Handler calls `handle_bankruptcy(player_id, Some(&creditor_id))`.
4. **Assets Transfer:** All properties transfer to creditor (mortgages remain).
5. **Player Removal:** Bankrupt player removed from game.
6. **Victory Check:** If only 1 player left, `check_victory()` sets `phase = GameOver`.
7. **Broadcast:** `PlayerBankrupt`, `GameOver` (if applicable), `GameStateUpdate` sent to all clients.

### Mortgage Flow
1. Player clicks "Cuti Akademik" in PropertyModal.
2. Frontend sends `MortgageProperty { property_id }`.
3. Backend validates ownership and no buildings, sets `is_mortgaged = true`.
4. Player receives 50% of property price.
5. Board shows "CUTI" overlay on tile.

---

## 7. Next Steps for Agents

If you are working on:
- **Game Logic:** Read `backend/src/game/logic.rs` and `backend/src/game/state.rs`.
- **New Features:** Add new variants to `ClientMessage` in `backend/src/ws/messages.rs` and `frontend/src/types/game.ts`.
- **UI:** Check `frontend/src/components/` and `frontend/src/store.ts`.

---

## 8. FSM Debugging

The game uses a Finite State Machine with phases: `Waiting`, `Rolling`, `Moving`, `EndTurn`.

### Logging
All FSM transitions are logged with `[FSM]` prefix. Logs include player status (position, money, jail state).

```bash
# View FSM logs only
RUST_LOG=backend=info cargo run 2>&1 | grep '\[FSM\]'
```

### Frontend State
The store tracks `isRolling` to prevent double-clicks and show loading state:
- `isRolling: boolean` - True while waiting for dice result
- `lastRollTime: number` - Timestamp for debouncing (1 second minimum between rolls)

### Key Files
| File | FSM Role |
|------|----------|
| `backend/src/game/state.rs` | `check_turn()`, `check_phase()` validation |
| `backend/src/game/logic.rs` | `next_turn()`, `handle_roll()`, `send_to_jail()` transitions |
| `backend/src/ws/handler.rs` | Phase transition after RollDice |
| `frontend/src/store.ts` | `isRolling`, `lastRollTime` state |
| `frontend/src/components/Game/Controls.tsx` | Debounced roll button with loading spinner |
