use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TradeStatus {
    Pending,
    Accepted,
    Rejected,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeOffer {
    pub money: i32,
    pub property_ids: Vec<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeProposal {
    pub id: String,
    pub initiator_id: String,
    pub target_player_id: String,
    pub offer: TradeOffer,   // What initiator gives
    pub request: TradeOffer, // What initiator wants
    pub status: TradeStatus,
}
