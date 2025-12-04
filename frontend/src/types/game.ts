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
}

export interface PropertyState {
    id: number;
    owner_id: string | null;
}

export interface GameState {
    players: PlayerState[];
    properties: PropertyState[];
    current_turn: number;
    phase: GamePhase;
    rent_paid: boolean;
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
    | { type: 'CastVote'; vote: boolean };

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
    | { type: 'Error'; message: string };
