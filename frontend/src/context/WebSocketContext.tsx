import { createContext, useRef, useEffect, useCallback, useState, type ReactNode } from 'react';
import { useGameStore } from '../store';
import type { ClientMessage, ServerMessage } from '../types/game';
import { logToServer } from '../utils/logger';



interface WebSocketContextType {
    sendMessage: (message: ClientMessage) => void;
    isConnected: boolean;
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider = ({ children }: { children: ReactNode }) => {
    const ws = useRef<WebSocket | null>(null);
    const {
        setRoomCode,
        setPlayerId,
        setPlayers,
        addPlayer,
        setGameState,
        setDice,
        setError,
        addMoneyAnimation,
        setVoteState
    } = useGameStore();

    // Helper to handle state updates and detect money changes
    const handleGameStateUpdate = (newState: any) => {
        // Access current state from store (we need the latest, so we might need to use useGameStore.getState() if we were outside component, 
        // but here we can use the store hook values if they updated? No, hooks update on render.
        // We need the *current* value in the store right now.
        // Since we are inside a component, `useGameStore` hook gives us values, but they might be stale in this closure if not in dependency array.
        // However, `useEffect` has `setGameState` in dependency.
        // To get the *previous* state reliably for comparison, we can use `useGameStore.getState()`.
        const currentState = useGameStore.getState().gameState;

        if (currentState) {
            newState.players.forEach((newPlayer: any) => {
                const oldPlayer = currentState.players.find((p: any) => p.id === newPlayer.id);
                if (oldPlayer && oldPlayer.money !== newPlayer.money) {
                    const diff = newPlayer.money - oldPlayer.money;
                    addMoneyAnimation(newPlayer.id, diff);
                }
            });
        }
        setGameState(newState);
    };

    // Use a ref to track if we've already set up the connection to avoid double-init in StrictMode
    const isConnecting = useRef(false);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (ws.current || isConnecting.current) return;

        isConnecting.current = true;

        // Dynamically determine the WebSocket URL based on the current page origin
        // const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // const host = window.location.host;
        // const wsUrl = `${protocol}//${host}/ws`;

        // Direct connection to backend to bypass Vite proxy issue
        const wsUrl = 'ws://127.0.0.1:3000/ws';

        logToServer('info', `Attempting WebSocket connection to ${wsUrl}`);

        const socket = new WebSocket(wsUrl);
        ws.current = socket;

        socket.onopen = () => {
            if (socket !== ws.current) return;
            console.log('Connected to WebSocket');
            logToServer('info', 'WebSocket connected successfully');
            setError(null);
            setIsConnected(true);
            isConnecting.current = false;
        };

        socket.onmessage = (event) => {
            if (socket !== ws.current) return;
            try {
                const message: ServerMessage = JSON.parse(event.data);
                console.log('Received:', message);

                switch (message.type) {
                    case 'RoomCreated':
                        setRoomCode(message.room_code);
                        setPlayerId(message.player_id);
                        setPlayers(message.players);
                        break;
                    case 'RoomJoined':
                        setRoomCode(message.room_code);
                        setPlayerId(message.player_id);
                        setPlayers(message.players);
                        break;
                    case 'PlayerJoined':
                        addPlayer(message.player);
                        break;
                    case 'GameStarted':
                        handleGameStateUpdate(message.state);
                        break;
                    case 'DiceRolled':
                        setDice(message.dice);
                        handleGameStateUpdate(message.state);
                        break;
                    case 'GameStateUpdate':
                        handleGameStateUpdate(message.state);
                        break;
                    case 'TurnEnded':
                        handleGameStateUpdate(message.state);
                        break;
                    case 'VoteStarted':
                        setVoteState({
                            initiator_id: message.initiator_id,
                            target_player_id: message.target_player_id,
                            end_time: message.end_time,
                            votes_for: 1,
                            votes_against: 0,
                            required: 0 // Will be updated by VoteUpdate immediately
                        });
                        break;
                    case 'VoteUpdate': {
                        const currentVoteState = useGameStore.getState().voteState;
                        if (currentVoteState) {
                            setVoteState({
                                ...currentVoteState,
                                votes_for: message.votes_for,
                                votes_against: message.votes_against,
                                required: message.required
                            });
                        }
                        break;
                    }
                    case 'PlayerKicked':
                        setVoteState(null);
                        // Also remove player from local list if not already handled by GameStateUpdate?
                        // Backend sends PlayerKicked, but logic.rs removes player from GameState.
                        // However, room.rs removes player from Room.
                        // Does backend send GameStateUpdate after kick?
                        // In handler.rs:
                        // game_state.remove_player(&target_id);
                        // room.remove_player(&target_id);
                        // room.tx.send(PlayerKicked)
                        // It does NOT send GameStateUpdate explicitly.
                        // So we should probably request update or manually remove.
                        // Or better, backend should send GameStateUpdate.
                        // But for now, let's just remove from local players list if we can, or rely on next update.
                        // Actually, let's just handle it by removing from players list in store if we had a setPlayers, 
                        // but we only have setPlayers for full list.
                        // We can fetch or just wait.
                        // Wait, if I am kicked, I should know.
                        if (message.player_id === useGameStore.getState().playerId) {
                            setError('You have been kicked from the room.');
                            setRoomCode(null as any); // Reset or redirect
                            setGameState(null as any);
                        } else {
                            // Remove from players list
                            const currentPlayers = useGameStore.getState().players;
                            setPlayers(currentPlayers.filter(p => p.id !== message.player_id));
                        }
                        break;
                    case 'VoteFailed':
                        setVoteState(null);
                        // Maybe show toast?
                        break;
                    case 'Error':
                        setError(message.message);
                        logToServer('warn', 'Received error message from server', { message: message.message });
                        break;
                }
            } catch (err) {
                console.error('Failed to parse message:', err);
                logToServer('error', 'Failed to parse WebSocket message', { error: String(err) });
            }
        };

        socket.onerror = (err) => {
            if (socket !== ws.current) return;
            console.error('WebSocket error:', err);
            logToServer('error', 'WebSocket error occurred', { error: String(err) });
            setError('Connection error');
            setIsConnected(false);
            isConnecting.current = false;
        };

        socket.onclose = (event) => {
            if (socket !== ws.current) return;
            console.log('Disconnected from WebSocket', event);
            logToServer('info', 'WebSocket disconnected', { code: event.code, reason: event.reason, wasClean: event.wasClean });
            ws.current = null;
            setIsConnected(false);
            isConnecting.current = false;
        };

        return () => {
            if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
                socket.close();
            }
            ws.current = null;
            setIsConnected(false);
            isConnecting.current = false;
        };
    }, [setRoomCode, setPlayerId, setPlayers, addPlayer, setGameState, setDice, setError, setIsConnected]);

    const sendMessage = useCallback((message: ClientMessage) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not connected');
            setError('Not connected to server');
        }
    }, [setError]);

    return (
        <WebSocketContext.Provider value={{ sendMessage, isConnected }}>
            {children}
        </WebSocketContext.Provider>
    );
};
