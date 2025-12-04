use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum GamePhase {
    Waiting,
    Rolling,
    Moving,
    EndTurn,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerState {
    pub id: String,
    pub name: String,
    pub money: i32,
    pub position: usize,
    pub color: String,
    pub is_in_jail: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyState {
    pub id: usize,
    pub owner_id: Option<String>,
    // For future milestones:
    // pub houses: u8,
    // pub is_mortgaged: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameState {
    pub players: Vec<PlayerState>,
    pub properties: Vec<PropertyState>,
    pub current_turn: usize,
    pub phase: GamePhase,
    pub rent_paid: bool,
}

impl GameState {
    pub fn new() -> Self {
        let properties = crate::game::board::PROPERTIES.iter().map(|p| PropertyState {
            id: p.id,
            owner_id: None,
        }).collect();

        Self {
            players: Vec::new(),
            properties,
            current_turn: 0,
            phase: GamePhase::Waiting,
            rent_paid: false,
        }
    }
}
