use serde::{Deserialize, Serialize};
use crate::room::player::Player;
use crate::game::state::{GameState, PlayerState};
use crate::game::state::Card;
use crate::game::trade::{TradeProposal, TradeOffer};

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
    PayBail,
    UseJailCard,
    ProposeTrade { target_player_id: String, offer: TradeOffer, request: TradeOffer },
    AcceptTrade { trade_id: String },
    RejectTrade { trade_id: String },
    CancelTrade { trade_id: String },
    BuyBuilding { property_id: usize },
    SellBuilding { property_id: usize },
    MortgageProperty { property_id: usize },
    UnmortgageProperty { property_id: usize },
    DeclareBankruptcy { creditor_id: Option<String> },
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
    CardDrawn { card: Card, is_chance: bool },
    JailStateUpdated { player_id: String, is_in_jail: bool, jail_turns: u8 },
    TradeProposed { proposal: TradeProposal },
    TradeAccepted { trade_id: String },
    TradeRejected { trade_id: String },
    TradeCancelled { trade_id: String },
    BuildingBought { property_id: usize, houses: u8 },
    BuildingSold { property_id: usize, houses: u8 },
    PropertyMortgaged { property_id: usize, mortgage_value: i32 },
    PropertyUnmortgaged { property_id: usize, cost: i32 },
    PlayerBankrupt { player_id: String, player_name: String, creditor_id: Option<String> },
    GameOver { winner_id: String, winner_name: String },
    Error { message: String },
}
