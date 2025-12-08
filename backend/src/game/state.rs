use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum GamePhase {
    Waiting,
    Rolling,
    Moving,
    EndTurn,
    GameOver,
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
    pub is_mortgaged: bool,
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
    pub winner: Option<String>,
}

impl GameState {
    pub fn new() -> Self {
        let properties = crate::game::board::PROPERTIES.iter().map(|p| PropertyState {
            id: p.id,
            name: p.name.to_string(),
            owner_id: None,
            houses: 0,
            is_mortgaged: false,
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
            winner: None,
        }
    }
    
    pub fn check_turn(&self, player_id: &str) -> Result<(), String> {
        let current_player = self.players.get(self.current_turn);
        let current_player_name = current_player.map(|p| p.name.clone()).unwrap_or_else(|| "Unknown".to_string());
        
        // Log player status for debugging
        let player_status = current_player.map(|p| {
            format!("pos={}, money={}, jail={}", p.position, p.money, p.is_in_jail)
        }).unwrap_or_else(|| "N/A".to_string());
        
        if let Some(player) = current_player {
            if player.id == player_id {
                tracing::debug!(
                    "[FSM] check_turn: PASS - player_id={}, current_turn={}, player={}, status=[{}]",
                    player_id, self.current_turn, current_player_name, player_status
                );
                Ok(())
            } else {
                tracing::warn!(
                    "[FSM] check_turn: FAIL - player_id={} is not current player, current_turn={}, expected={}, status=[{}]",
                    player_id, self.current_turn, current_player_name, player_status
                );
                Err("Not your turn".to_string())
            }
        } else {
            tracing::error!(
                "[FSM] check_turn: FAIL - current player not found, current_turn={}, total_players={}",
                self.current_turn, self.players.len()
            );
            Err("Current player not found".to_string())
        }
    }

    pub fn check_phase(&self, expected: GamePhase) -> Result<(), String> {
        // Get current player status for context
        let player_status = self.players.get(self.current_turn).map(|p| {
            format!("player={}, pos={}, money={}, jail={}", p.name, p.position, p.money, p.is_in_jail)
        }).unwrap_or_else(|| "no_player".to_string());
        
        if self.phase == expected {
            tracing::debug!(
                "[FSM] check_phase: PASS - expected={:?}, actual={:?}, turn={}, [{}]",
                expected, self.phase, self.current_turn, player_status
            );
            Ok(())
        } else {
            tracing::warn!(
                "[FSM] check_phase: FAIL - expected={:?}, actual={:?}, turn={}, [{}]",
                expected, self.phase, self.current_turn, player_status
            );
            Err(format!("Invalid phase. Expected {:?}, got {:?}", expected, self.phase))
        }
    }
}
