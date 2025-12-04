use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::sync::broadcast;
use crate::game::state::{GameState, PlayerState, GamePhase};
use crate::room::player::Player;
use crate::ws::messages::ServerMessage;

#[derive(Debug, Clone, Serialize)]
pub struct Room {
    pub id: String,
    pub players: HashMap<String, Player>,
    pub game_state: Option<GameState>,
    #[serde(skip)]
    pub tx: broadcast::Sender<ServerMessage>,
    pub vote_state: Option<VoteState>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoteState {
    pub initiator_id: String,
    pub target_player_id: String,
    pub votes_for: std::collections::HashSet<String>,
    pub votes_against: std::collections::HashSet<String>,
    pub end_time: u64, // Unix timestamp in seconds
}

impl Room {
    pub fn new(id: String) -> Self {
        let (tx, _rx) = broadcast::channel(100);
        Self {
            id,
            players: HashMap::new(),
            game_state: None,
            tx,
            vote_state: None,
        }
    }

    pub fn add_player(&mut self, player: Player) {
        self.players.insert(player.id.clone(), player);
    }

    pub fn remove_player(&mut self, player_id: &str) {
        self.players.remove(player_id);
    }

    pub fn start_game(&mut self) {
        let mut game_state = GameState::new();
        // Convert room players to game players
        // We need a deterministic order, so let's sort by ID or something, or just take values
        // For now, just values is fine but random order. Let's sort keys to be stable.
        let mut player_ids: Vec<&String> = self.players.keys().collect();
        player_ids.sort();

        for (i, id) in player_ids.iter().enumerate() {
            if let Some(p) = self.players.get(*id) {
                game_state.players.push(PlayerState {
                    id: p.id.clone(),
                    name: p.name.clone(),
                    money: 1_500_000,
                    position: 0,
                    color: match i % 4 {
                        0 => "red".to_string(),
                        1 => "blue".to_string(),
                        2 => "green".to_string(),
                        _ => "yellow".to_string(),
                    },
                    is_in_jail: false,
                });
            }
        }
        
        game_state.phase = GamePhase::Rolling;
        self.game_state = Some(game_state);
    }
}
