import { createContext, useRef, useEffect, useCallback, useState, type ReactNode } from 'react';
import { useGameStore } from '../store';
import type { ClientMessage, ServerMessage } from '../types/game';
import { logToServer } from '../utils/logger';

interface WebSocketContextType {
    sendMessage: (message: ClientMessage) => void;
    isConnected: boolean;
    proposeTrade: (targetPlayerId: string, offer: { money: number, propertyIds: number[] }, request: { money: number, propertyIds: number[] }) => void;
    acceptTrade: (tradeId: string) => void;
    rejectTrade: (tradeId: string) => void;
    cancelTrade: (tradeId: string) => void;
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
        setVoteState,
        setCurrentCard,
        removeTrade,
        updatePropertyHouses,
        setIsRolling
    } = useGameStore();

    const [isConnected, setIsConnected] = useState(false);
    const isConnecting = useRef(false);
    const hasReconnected = useRef(false);

    // Helper to handle state updates and detect money changes
    const handleGameStateUpdate = useCallback((newState: any) => {
        console.log('--- Game State Update ---');
        console.log('Phase:', newState.phase);
        console.log('Turn:', newState.current_turn);
        console.log('Active Trades Count:', newState.active_trades ? Object.keys(newState.active_trades).length : 0);

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

        // Synchronize active trades
        if (newState.active_trades) {
            const trades = Object.values(newState.active_trades);
            console.log('Syncing active trades:', trades.length);
            useGameStore.getState().setTrades(trades as any);
        } else {
            useGameStore.getState().setTrades([]);
        }
    }, [addMoneyAnimation, setGameState]);

    const sendMessage = useCallback((message: ClientMessage) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not connected');
            setError('Not connected to server');
        }
    }, [setError]);

    // Connection logic
    useEffect(() => {
        if (ws.current || isConnecting.current) return;

        isConnecting.current = true;
        const wsUrl = window.location.hostname === 'localhost'
            ? 'ws://localhost:3000/ws'
            : (window.location.protocol === 'https:' ? `wss://${window.location.host}/ws` : `ws://${window.location.host}/ws`);

        logToServer('info', `Attempting WebSocket connection to ${wsUrl}`);
        const socket = new WebSocket(wsUrl);
        ws.current = socket;

        socket.onopen = () => {
            if (socket !== ws.current) return;
            console.log('Connected to WebSocket');
            setError(null);
            setIsConnected(true);
            isConnecting.current = false;
        };

        socket.onmessage = (event) => {
            if (socket !== ws.current) return;
            try {
                const message: ServerMessage = JSON.parse(event.data);
                console.log('WS Received:', message.type, message);

                switch (message.type) {
                    case 'RoomCreated':
                        setRoomCode(message.room_code);
                        setPlayerId(message.player_id);
                        setPlayers(message.players);
                        break;
                    case 'RoomJoined':
                        console.log('Handling RoomJoined:', message.room_code, 'Players:', message.players.length);
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
                        setIsRolling(false);
                        break;
                    case 'GameStateUpdate':
                        console.log('Handling GameStateUpdate. Phase:', message.state.phase);
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
                            required: 0
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
                        if (message.player_id === useGameStore.getState().playerId) {
                            setError('You have been kicked from the room.');
                            setRoomCode(null as any);
                            setGameState(null as any);
                        } else {
                            const currentPlayers = useGameStore.getState().players;
                            setPlayers(currentPlayers.filter(p => p.id !== message.player_id));
                        }
                        break;
                    case 'VoteFailed':
                        setVoteState(null);
                        break;
                    case 'TradeProposed':
                        useGameStore.getState().addTrade(message.proposal);
                        break;
                    case 'TradeAccepted':
                        removeTrade(message.trade_id);
                        break;
                    case 'TradeRejected':
                        removeTrade(message.trade_id);
                        break;
                    case 'TradeCancelled':
                        removeTrade(message.trade_id);
                        break;
                    case 'BuildingBought':
                    case 'BuildingSold':
                        updatePropertyHouses(message.property_id, message.houses);
                        break;
                    case 'Error':
                        setError(message.message);
                        setIsRolling(false);
                        break;
                    case 'CardDrawn':
                        setCurrentCard({ card: message.card, is_chance: message.is_chance });
                        break;
                    case 'JailStateUpdated':
                        console.log(`Player ${message.player_id} jail state updated: ${message.is_in_jail}`);
                        break;
                    case 'PropertyMortgaged':
                    case 'PropertyUnmortgaged':
                        console.log(`Property ${message.property_id} mortgage state changed`);
                        break;
                    case 'PlayerBankrupt':
                        console.log(`Player ${message.player_name} went bankrupt!`);
                        break;
                    case 'GameOver':
                        console.log(`Game Over! Winner: ${message.winner_name}`);
                        break;
                }
            } catch (err) {
                console.error('Failed to parse message:', err);
            }
        };

        socket.onerror = (err) => {
            if (socket !== ws.current) return;
            console.error('WebSocket error:', err);
            setError('Connection error');
            setIsConnected(false);
            isConnecting.current = false;
        };

        socket.onclose = (event) => {
            if (socket !== ws.current) return;
            console.log('Disconnected from WebSocket', event);
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
    }, [setRoomCode, setPlayerId, setPlayers, addPlayer, setGameState, setDice, setError, setIsConnected, handleGameStateUpdate, setIsRolling, setVoteState, setCurrentCard, removeTrade, updatePropertyHouses]);

    // Reconnection useEffect - moved after connection logic and sendMessage
    useEffect(() => {
        const { roomCode, playerId } = useGameStore.getState();
        if (!isConnected || !roomCode || !playerId || ws.current?.readyState !== WebSocket.OPEN) {
            if (!isConnected) hasReconnected.current = false;
            return;
        }

        if (!hasReconnected.current) {
            console.log("WebSocket opened, attempting reconnection for room:", roomCode, "player:", playerId);
            sendMessage({ type: 'Reconnect', room_code: roomCode, player_id: playerId });
            hasReconnected.current = true;
        }
    }, [isConnected, sendMessage]);

    const proposeTrade = useCallback((targetPlayerId: string, offer: { money: number, propertyIds: number[] }, request: { money: number, propertyIds: number[] }) => {
        sendMessage({
            type: 'ProposeTrade',
            target_player_id: targetPlayerId,
            offer: { money: offer.money, property_ids: offer.propertyIds },
            request: { money: request.money, property_ids: request.propertyIds }
        });
    }, [sendMessage]);

    const acceptTrade = useCallback((tradeId: string) => {
        sendMessage({ type: 'AcceptTrade', trade_id: tradeId });
    }, [sendMessage]);

    const rejectTrade = useCallback((tradeId: string) => {
        sendMessage({ type: 'RejectTrade', trade_id: tradeId });
    }, [sendMessage]);

    const cancelTrade = useCallback((tradeId: string) => {
        sendMessage({ type: 'CancelTrade', trade_id: tradeId });
    }, [sendMessage]);

    return (
        <WebSocketContext.Provider value={{ sendMessage, isConnected, proposeTrade, acceptTrade, rejectTrade, cancelTrade }}>
            {children}
        </WebSocketContext.Provider>
    );
};
