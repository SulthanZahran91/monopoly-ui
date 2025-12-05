export interface Player {
    id: string;
    name: string;
}

export type GamePhase = 'Waiting' | 'Rolling' | 'Moving' | 'EndTurn';

export interface PlayerState {
    id: string;
    name: string;
    money: number;
    position: number;
    color: string;
    is_in_jail: boolean;
    jail_turns: number;
    doubles_count: number;
    held_cards: Card[];
}

export interface PropertyState {
    id: number;
    name: string;
    owner_id: string | null;
    houses: number;
}

export interface Card {
    id: number;
    title: string;
    description: string;
    effect_type: string;
    value: number | null;
    target_id: number | null;
}

export interface GameState {
    players: PlayerState[];
    properties: PropertyState[];
    current_turn: number;
    phase: GamePhase;
    rent_paid: boolean;
    chance_deck: Card[];
    community_chest_deck: Card[];
    active_trades: Record<string, TradeProposal>; // Using Record for HashMap
    total_houses: number;
    total_hotels: number;
}

export type TradeStatus = "Pending" | "Accepted" | "Rejected" | "Cancelled";

export interface TradeOffer {
    money: number;
    property_ids: number[];
}

export interface TradeProposal {
    id: string;
    initiator_id: string;
    target_player_id: string;
    offer: TradeOffer;
    request: TradeOffer;
    status: TradeStatus;
}

export type ClientMessage =
    | { type: 'CreateRoom'; player_name: string }
    | { type: 'JoinRoom'; room_code: string; player_name: string }
    | { type: 'StartGame' }
    | { type: 'RollDice' }
    | { type: 'BuyProperty' }
    | { type: 'PayRent' }
    | { type: 'EndTurn' }
    | { type: 'VoteKick'; target_player_id: string }
    | { type: 'CastVote'; vote: boolean }
    | { type: 'PayBail' }
    | { type: 'UseJailCard' }
    | { type: "ProposeTrade"; target_player_id: string; offer: TradeOffer; request: TradeOffer }
    | { type: "AcceptTrade"; trade_id: string }
    | { type: "RejectTrade"; trade_id: string }
    | { type: "CancelTrade"; trade_id: string }
    | { type: "BuyBuilding"; property_id: number }
    | { type: "SellBuilding"; property_id: number };

export type ServerMessage =
    | { type: 'RoomCreated'; room_code: string; player_id: string; players: Player[] }
    | { type: 'PlayerJoined'; player: Player }
    | { type: 'RoomJoined'; room_code: string; player_id: string; players: Player[] }
    | { type: 'GameStarted'; state: GameState }
    | { type: 'DiceRolled'; dice: [number, number]; state: GameState }
    | { type: 'GameStateUpdate'; state: GameState }
    | { type: 'TurnEnded'; state: GameState }
    | { type: 'VoteStarted'; initiator_id: string; target_player_id: string; end_time: number }
    | { type: 'VoteUpdate'; votes_for: number; votes_against: number; required: number }
    | { type: 'PlayerKicked'; player_id: string }
    | { type: 'VoteFailed'; reason: string }
    | { type: 'CardDrawn'; card: Card; is_chance: boolean }
    | { type: 'JailStateUpdated'; player_id: string; is_in_jail: boolean; jail_turns: number }
    | { type: "TradeProposed"; proposal: TradeProposal }
    | { type: "TradeAccepted"; trade_id: string }
    | { type: "TradeRejected"; trade_id: string }
    | { type: "TradeCancelled"; trade_id: string }
    | { type: "BuildingBought"; property_id: number; houses: number }
    | { type: "BuildingSold"; property_id: number; houses: number }
    | { type: 'Error'; message: string };
