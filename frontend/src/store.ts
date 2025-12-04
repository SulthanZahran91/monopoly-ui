import { create } from 'zustand';
import type { GameState, Player, Card, TradeProposal } from './types/game';

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

    currentCard: { card: Card; is_chance: boolean } | null;
    setCurrentCard: (card: { card: Card; is_chance: boolean } | null) => void;

    activeTrades: TradeProposal[];
    setTrades: (trades: TradeProposal[]) => void;
    addTrade: (trade: TradeProposal) => void;
    removeTrade: (tradeId: string) => void;

    setRoomCode: (code: string) => void;
    setPlayerId: (id: string) => void;
    setPlayers: (players: Player[]) => void;
    addPlayer: (player: Player) => void;
    setGameState: (state: GameState) => void;
    setDice: (dice: [number, number]) => void;
    setError: (error: string | null) => void;
    updatePropertyHouses: (propertyId: number, houses: number) => void;
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
    currentCard: null,
    activeTrades: [],

    setRoomCode: (code) => set({ roomCode: code }),
    setPlayerId: (id) => set({ playerId: id }),
    setPlayers: (players) => set({ players }),
    addPlayer: (player) => set((state) => ({ players: [...state.players, player] })),
    setGameState: (state) => set({ gameState: state }),
    setDice: (dice) => set({ dice }),
    setError: (error) => set({ error }),
    setVoteState: (voteState) => set({ voteState }),
    setCurrentCard: (currentCard) => set({ currentCard }),
    addMoneyAnimation: (playerId, amount) => set((state) => ({
        moneyAnimations: [...state.moneyAnimations, { playerId, amount, id: Date.now() + Math.random() }]
    })),
    removeMoneyAnimation: (id) => set((state) => ({
        moneyAnimations: state.moneyAnimations.filter(a => a.id !== id)
    })),
    setTrades: (trades) => set({ activeTrades: trades }),
    addTrade: (trade) => set((state) => ({ activeTrades: [...state.activeTrades, trade] })),
    removeTrade: (tradeId) => set((state) => ({ activeTrades: state.activeTrades.filter((t) => t.id !== tradeId) })),
    updatePropertyHouses: (propertyId, houses) => set((state) => {
        if (!state.gameState) return {};
        const updatedProperties = state.gameState.properties.map(p =>
            p.id === propertyId ? { ...p, houses } : p
        );
        return { gameState: { ...state.gameState, properties: updatedProperties } };
    }),
    reset: () => set({ roomCode: null, playerId: null, players: [], gameState: null, dice: null, error: null, moneyAnimations: [], voteState: null, currentCard: null, activeTrades: [] }),
}));

