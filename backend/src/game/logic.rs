use rand::Rng;
use crate::game::state::{GameState, GamePhase};

pub fn roll_dice() -> (u8, u8) {
    let mut rng = rand::rng();
    (rng.random_range(1..=6), rng.random_range(1..=6))
}

impl GameState {
    pub fn next_turn(&mut self) {
        self.current_turn = (self.current_turn + 1) % self.players.len();
        self.phase = GamePhase::Rolling;
        self.rent_paid = false;
    }

    pub fn move_player(&mut self, player_index: usize, steps: u8) {
        if let Some(player) = self.players.get_mut(player_index) {
            let old_pos = player.position;
            player.position = (player.position + steps as usize) % 40;
            
            // Pass GO logic
            if player.position < old_pos {
                player.money += 200_000;
            }
        }
    }

    pub fn remove_player(&mut self, player_id: &str) {
        // Return properties to bank (Rektorat)
        for property in self.properties.iter_mut() {
            if let Some(owner) = &property.owner_id {
                if owner == player_id {
                    property.owner_id = None;
                }
            }
        }

        // Remove player from list
        if let Some(idx) = self.players.iter().position(|p| p.id == player_id) {
            self.players.remove(idx);
            
            // Adjust current turn if necessary
            if self.players.is_empty() {
                self.current_turn = 0;
            } else {
                self.current_turn = self.current_turn % self.players.len();
            }
        }
    }
}
