import { create } from 'zustand';
import type { Player, GameState } from './types/game';

interface GameStore {
    roomCode: string | null;
    playerId: string | null;
    players: Player[];
    gameState: GameState | null;
    dice: [number, number] | null;
    error: string | null;

    moneyAnimations: { playerId: string; amount: number; id: number }[];
    addMoneyAnimation: (playerId: string, amount: number) => void;
    removeMoneyAnimation: (id: number) => void;

    voteState: {
        initiator_id: string;
        target_player_id: string;
        end_time: number;
        votes_for: number;
        votes_against: number;
        required: number;
    } | null;
    setVoteState: (state: GameStore['voteState']) => void;

    setRoomCode: (code: string) => void;
    setPlayerId: (id: string) => void;
    setPlayers: (players: Player[]) => void;
    addPlayer: (player: Player) => void;
    setGameState: (state: GameState) => void;
    setDice: (dice: [number, number]) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
    roomCode: null,
    playerId: null,
    players: [],
    gameState: null,
    dice: null,
    error: null,
    voteState: null,
    moneyAnimations: [],

    setRoomCode: (code) => set({ roomCode: code }),
    setPlayerId: (id) => set({ playerId: id }),
    setPlayers: (players) => set({ players }),
    addPlayer: (player) => set((state) => ({ players: [...state.players, player] })),
    setGameState: (state) => set({ gameState: state }),
    setDice: (dice) => set({ dice }),
    setError: (error) => set({ error }),
    setVoteState: (voteState) => set({ voteState }),
    addMoneyAnimation: (playerId, amount) => set((state) => ({
        moneyAnimations: [...state.moneyAnimations, { playerId, amount, id: Date.now() + Math.random() }]
    })),
    removeMoneyAnimation: (id) => set((state) => ({
        moneyAnimations: state.moneyAnimations.filter(a => a.id !== id)
    })),
    reset: () => set({ roomCode: null, playerId: null, players: [], gameState: null, dice: null, error: null, moneyAnimations: [], voteState: null }),
}));
