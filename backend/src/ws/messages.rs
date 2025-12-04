use serde::{Deserialize, Serialize};
use crate::room::player::Player;
use crate::game::state::GameState;

#[derive(Debug, Deserialize)]
#[serde(tag = "type")]
pub enum ClientMessage {
    CreateRoom { player_name: String },
    JoinRoom { room_code: String, player_name: String },
    StartGame,
    RollDice,
    BuyProperty,
    PayRent,
    EndTurn,
    VoteKick { target_player_id: String },
    CastVote { vote: bool },
}

#[derive(Debug, Serialize, Clone)]
#[serde(tag = "type")]
pub enum ServerMessage {
    RoomCreated { room_code: String, player_id: String, players: Vec<Player> },
    PlayerJoined { player: Player },
    RoomJoined { room_code: String, player_id: String, players: Vec<Player> },
    GameStarted { state: GameState },
    DiceRolled { dice: (u8, u8), state: GameState },
    GameStateUpdate { state: GameState },
    TurnEnded { state: GameState },
    VoteStarted { initiator_id: String, target_player_id: String, end_time: u64 },
    VoteUpdate { votes_for: usize, votes_against: usize, required: usize },
    PlayerKicked { player_id: String },
    VoteFailed { reason: String },
    Error { message: String },
}
