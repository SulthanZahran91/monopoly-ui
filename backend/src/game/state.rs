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
    pub jail_turns: u8,
    pub doubles_count: u8,
    pub held_cards: Vec<Card>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyState {
    pub id: usize,
    pub name: String,
    pub owner_id: Option<String>,
    pub houses: u8,
    // For future milestones:
    // pub is_mortgaged: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Card {
    pub id: u8,
    pub title: String,
    pub description: String,
    pub effect_type: String, // collect, pay, advance, etc.
    pub value: Option<i32>,
    pub target_id: Option<usize>, // For movement to specific tile
}

use std::collections::HashMap;
use crate::game::trade::TradeProposal;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameState {
    pub players: Vec<PlayerState>,
    pub properties: Vec<PropertyState>,
    pub current_turn: usize,
    pub phase: GamePhase,
    pub rent_paid: bool,
    pub chance_deck: Vec<Card>,
    pub community_chest_deck: Vec<Card>,
    pub active_trades: HashMap<String, TradeProposal>,
    pub total_houses: u8,
    pub total_hotels: u8,
    pub last_dice_roll: Option<(u8, u8)>,
}

impl GameState {
    pub fn new() -> Self {
        let properties = crate::game::board::PROPERTIES.iter().map(|p| PropertyState {
            id: p.id,
            name: p.name.to_string(),
            owner_id: None,
            houses: 0,
        }).collect();

        let (chance_deck, community_chest_deck) = crate::game::cards::initialize_decks();

        Self {
            players: Vec::new(),
            properties,
            current_turn: 0,
            phase: GamePhase::Waiting,
            rent_paid: false,
            chance_deck,
            community_chest_deck,
            active_trades: HashMap::new(),
            total_houses: 32,
            total_hotels: 12,
            last_dice_roll: None,
        }
    }
    
    pub fn check_turn(&self, player_id: &str) -> Result<(), String> {
        if let Some(player) = self.players.get(self.current_turn) {
            if player.id == player_id {
                Ok(())
            } else {
                Err("Not your turn".to_string())
            }
        } else {
            Err("Current player not found".to_string())
        }
    }

    pub fn check_phase(&self, expected: GamePhase) -> Result<(), String> {
        if self.phase == expected {
            Ok(())
        } else {
            Err(format!("Invalid phase. Expected {:?}, got {:?}", expected, self.phase))
        }
    }
}
