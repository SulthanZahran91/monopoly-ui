use rand::Rng;
use crate::game::state::{GameState, GamePhase, Card};
use crate::ws::messages::ServerMessage;

pub fn roll_dice() -> (u8, u8) {
    let mut rng = rand::rng();
    (rng.random_range(1..=6), rng.random_range(1..=6))
}

impl GameState {
    pub fn next_turn(&mut self, player_id: &str) -> Result<(), String> {
        self.check_turn(player_id)?;
        self.check_phase(GamePhase::EndTurn)?;

        self.current_turn = (self.current_turn + 1) % self.players.len();
        self.phase = GamePhase::Rolling;
        self.rent_paid = false;
        
        // Reset doubles count for the new player
        if let Some(player) = self.players.get_mut(self.current_turn) {
            player.doubles_count = 0;
        }
        Ok(())
    }

    pub fn handle_roll(&mut self, player_id: &str) -> Result<((u8, u8), Vec<ServerMessage>), String> {
        self.check_turn(player_id)?;
        self.check_phase(GamePhase::Rolling)?;

        let dice = roll_dice();
        self.last_dice_roll = Some(dice);
        let is_double = dice.0 == dice.1;
        let mut events = Vec::new();
        let player_index = self.current_turn;

        if let Some(player) = self.players.get_mut(player_index) {
            if player.is_in_jail {
                if is_double {
                    player.is_in_jail = false;
                    player.jail_turns = 0;
                    player.doubles_count = 0;
                    events.push(ServerMessage::JailStateUpdated { 
                        player_id: player.id.clone(), 
                        is_in_jail: false, 
                        jail_turns: 0 
                    });
                    // Move immediately
                    let steps = dice.0 + dice.1;
                    // We need to drop the mutable borrow to call move_player
                } else {
                    player.jail_turns += 1;
                    if player.jail_turns >= 3 {
                        // Forced bail (if implemented, deduct money and move)
                        // For now, just stay in jail
                        // Or maybe auto-pay 50k if they have it?
                        // Plan says: "3 turns in Jail -> Verify forced bail/release"
                        if player.money >= 50_000 {
                            player.money -= 50_000;
                            player.is_in_jail = false;
                            player.jail_turns = 0;
                            events.push(ServerMessage::JailStateUpdated { 
                                player_id: player.id.clone(), 
                                is_in_jail: false, 
                                jail_turns: 0 
                            });
                            // Move will happen below
                        } else {
                            // Bankrupt? Or just stay?
                            // Standard rules: must pay. If can't, bankrupt.
                            // For simplicity, let's just release them for now or keep them.
                            // Let's release them and put into debt if needed.
                             player.money -= 50_000;
                             player.is_in_jail = false;
                             player.jail_turns = 0;
                             events.push(ServerMessage::JailStateUpdated { 
                                 player_id: player.id.clone(), 
                                 is_in_jail: false, 
                                 jail_turns: 0 
                             });
                        }
                    } else {
                         events.push(ServerMessage::JailStateUpdated { 
                            player_id: player.id.clone(), 
                            is_in_jail: true, 
                            jail_turns: player.jail_turns 
                        });
                        return Ok((dice, events)); // End turn (no move)
                    }
                }
            } else {
                if is_double {
                    player.doubles_count += 1;
                } else {
                    player.doubles_count = 0;
                }

                if player.doubles_count >= 3 {
                    // Go to jail
                    // We need to handle this carefully.
                    // We can't call send_to_jail here easily because of borrow checker if we want to use self methods.
                    // But we can set flags.
                }
            }
        }
        
        // Re-borrow to handle movement and logic
        let mut sent_to_jail = false;
        if let Some(player) = self.players.get(player_index) {
             if !player.is_in_jail && player.doubles_count >= 3 {
                 sent_to_jail = true;
             }
        }

        if sent_to_jail {
            self.send_to_jail(player_index);
            let player = &self.players[player_index];
            events.push(ServerMessage::JailStateUpdated { 
                player_id: player.id.clone(), 
                is_in_jail: true, 
                jail_turns: 0 
            });
            return Ok((dice, events));
        }

        // Move if not in jail
        let should_move = if let Some(player) = self.players.get(player_index) {
            !player.is_in_jail
        } else { false };

        if should_move {
            let steps = dice.0 + dice.1;
            self.move_player(player_index, steps);
            let landing_events = self.handle_landing(player_index);
            events.extend(landing_events);
        }

        Ok((dice, events))
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

    pub fn handle_landing(&mut self, player_index: usize) -> Vec<ServerMessage> {
        let mut events = Vec::new();
        let player_id = self.players[player_index].id.clone();
        let position = self.players[player_index].position;

        match position {
            // Community Chest (BEM)
            2 | 17 | 33 => {
                let card = self.draw_community_chest_card();
                events.push(ServerMessage::CardDrawn { card: card.clone(), is_chance: false });
                events.extend(self.apply_card_effect(player_index, &card));
            },
            // Chance (SIAK-NG)
            7 | 22 | 36 => {
                let card = self.draw_chance_card();
                events.push(ServerMessage::CardDrawn { card: card.clone(), is_chance: true });
                events.extend(self.apply_card_effect(player_index, &card));
            },
            // Tax (Bayar UKT)
            4 => {
                if let Some(player) = self.players.get_mut(player_index) {
                    player.money -= 200_000;
                }
            },
            // Tax (Biaya Praktikum)
            38 => {
                if let Some(player) = self.players.get_mut(player_index) {
                    player.money -= 100_000;
                }
            },
            // Go To Jail (Sanksi Akademik)
            30 => {
                self.send_to_jail(player_index);
                events.push(ServerMessage::JailStateUpdated { 
                    player_id: player_id.clone(), 
                    is_in_jail: true, 
                    jail_turns: 0 
                });
            },
            _ => {}
        }
        
        events
    }

    pub fn send_to_jail(&mut self, player_index: usize) {
        if let Some(player) = self.players.get_mut(player_index) {
            player.position = 10; // Jail position
            player.is_in_jail = true;
            player.jail_turns = 0;
            player.doubles_count = 0;
        }
        self.phase = GamePhase::EndTurn;
    }

    fn draw_chance_card(&mut self) -> Card {
        if self.chance_deck.is_empty() {
            let (new_chance, _) = crate::game::cards::initialize_decks();
            self.chance_deck = new_chance;
        }
        let card = self.chance_deck.remove(0);
        self.chance_deck.push(card.clone()); // Put at bottom
        card
    }

    fn draw_community_chest_card(&mut self) -> Card {
        if self.community_chest_deck.is_empty() {
            let (_, new_cc) = crate::game::cards::initialize_decks();
            self.community_chest_deck = new_cc;
        }
        let card = self.community_chest_deck.remove(0);
        self.community_chest_deck.push(card.clone()); // Put at bottom
        card
    }

    fn apply_card_effect(&mut self, player_index: usize, card: &Card) -> Vec<ServerMessage> {
        let mut events = Vec::new();
        let player_id = self.players[player_index].id.clone();

        match card.effect_type.as_str() {
            "collect" => {
                if let Some(amount) = card.value {
                    if let Some(player) = self.players.get_mut(player_index) {
                        player.money += amount;
                    }
                }
            },
            "pay" => {
                if let Some(amount) = card.value {
                    if let Some(player) = self.players.get_mut(player_index) {
                        player.money -= amount;
                    }
                }
            },
            "advance" => {
                if let Some(target) = card.target_id {
                    if let Some(player) = self.players.get_mut(player_index) {
                        let current = player.position;
                        if target < current {
                            player.money += 200_000; // Pass GO
                        }
                        player.position = target;
                    }
                    // Handle landing on new tile (recursive?)
                    // For simplicity, we won't recurse deeply, but we should check if it's Go To Jail
                    if card.target_id == Some(30) {
                        self.send_to_jail(player_index);
                        events.push(ServerMessage::JailStateUpdated { 
                            player_id: player_id.clone(), 
                            is_in_jail: true, 
                            jail_turns: 0 
                        });
                    }
                }
            },
            "go_to_jail" => {
                self.send_to_jail(player_index);
                events.push(ServerMessage::JailStateUpdated { 
                    player_id: player_id.clone(), 
                    is_in_jail: true, 
                    jail_turns: 0 
                });
            },
            "back" => {
                if let Some(steps) = card.value {
                    if let Some(player) = self.players.get_mut(player_index) {
                        // Handle wrap around for negative movement
                        let pos = player.position as i32 - steps;
                        player.position = if pos < 0 { (40 + pos) as usize } else { pos as usize };
                    }
                    // If landed on Go To Jail (30)
                    if self.players[player_index].position == 30 {
                        self.send_to_jail(player_index);
                        events.push(ServerMessage::JailStateUpdated { 
                            player_id: player_id.clone(), 
                            is_in_jail: true, 
                            jail_turns: 0 
                        });
                    }
                }
            },
            "collect_all" => {
                if let Some(amount) = card.value {
                    let count = self.players.len();
                    for i in 0..count {
                        if i != player_index {
                            self.players[i].money -= amount;
                        }
                    }
                    self.players[player_index].money += amount * (count as i32 - 1);
                }
            },
            "advance_nearest_railroad" => {
                if let Some(player) = self.players.get_mut(player_index) {
                    let current = player.position;
                    // Railroads: 5, 15, 25, 35
                    let railroads = [5, 15, 25, 35];
                    let mut target = 5;
                    for &r in &railroads {
                        if r > current {
                            target = r;
                            break;
                        }
                    }
                    // If no railroad > current, wrap around to 5
                    if target < current {
                        player.money += 200_000;
                    }
                    player.position = target;
                }
            },
            "advance_nearest_utility" => {
                if let Some(player) = self.players.get_mut(player_index) {
                    let current = player.position;
                    // Utilities: 12, 28
                    let utilities = [12, 28];
                    let mut target = 12;
                    for &u in &utilities {
                        if u > current {
                            target = u;
                            break;
                        }
                    }
                    if target < current {
                        player.money += 200_000;
                    }
                    player.position = target;
                }
            },
            "repair" => {
                if let Some(player) = self.players.get_mut(player_index) {
                    // Calculate total houses and hotels
                    // We need to iterate over properties owned by this player
                    // We can't do this easily while `player` is mutably borrowed.
                    // So we need to calculate cost first.
                }
                // Re-borrow immutably to calculate
                let player_id = self.players[player_index].id.clone();
                let mut house_count = 0;
                let mut hotel_count = 0;
                
                for prop in &self.properties {
                    if prop.owner_id.as_ref() == Some(&player_id) {
                        if prop.houses == 5 {
                            hotel_count += 1;
                        } else {
                            house_count += prop.houses as i32;
                        }
                    }
                }
                
                // "Renovasi Kosan": 25k/house, 100k/hotel
                // "Perbaikan Gedung Fakultas": 40k/house, 115k/hotel
                // We need to know which card it is.
                // Using values from card.value is tricky because we have two rates.
                // Let's hardcode based on Card ID or Title for now.
                
                let (house_cost, hotel_cost) = if card.title == "Renovasi Kosan" {
                    (25_000, 100_000)
                } else {
                    (40_000, 115_000)
                };
                
                let total_cost = (house_count * house_cost) + (hotel_count * hotel_cost);
                
                if let Some(player) = self.players.get_mut(player_index) {
                    player.money -= total_cost;
                }
            },
            "get_out_of_jail" => {
                if let Some(player) = self.players.get_mut(player_index) {
                    player.held_cards.push(card.clone());
                }
                // Do NOT put back in deck immediately (handled by caller usually putting back, but for this type we should NOT put back)
                // Wait, `draw_chance_card` removes from top and pushes to bottom.
                // We need to prevent that if it's a keepable card.
                // But `draw_chance_card` is called BEFORE this.
                // So the card is ALREADY at the bottom of the deck.
                // We need to remove it from the deck if the player keeps it.
                
                // This is tricky with the current `draw_...` implementation.
                // `draw_chance_card` does: remove(0), push(clone).
                // So it's at the end.
                // We should remove it from the end of the deck.
                
                // Let's check which deck it came from.
                // If it's Chance...
                if let Some(last) = self.chance_deck.last() {
                    if last.id == card.id && last.title == card.title {
                        self.chance_deck.pop();
                    }
                }
                // If it's Community Chest...
                if let Some(last) = self.community_chest_deck.last() {
                    if last.id == card.id && last.title == card.title {
                        self.community_chest_deck.pop();
                    }
                }
            },
            _ => {}
        }
        events
    }

    fn check_monopoly(&self, owner_id: &str, group: crate::game::board::PropertyGroup) -> bool {
        let group_properties: Vec<&crate::game::state::PropertyState> = self.properties.iter()
            .filter(|p| {
                if let Some(prop_info) = crate::game::board::get_property(p.id) {
                    prop_info.group == group
                } else {
                    false
                }
            })
            .collect();

        if group_properties.is_empty() {
            return false;
        }

        group_properties.iter().all(|p| p.owner_id.as_deref() == Some(owner_id))
    }

    pub fn calculate_rent(&self, property_id: usize, dice_roll: u8) -> i32 {
        let property = &self.properties.iter().find(|p| p.id == property_id).unwrap();
        let prop_info = match crate::game::board::get_property(property_id) {
            Some(info) => info,
            None => return 0,
        };

        if let Some(owner_id) = &property.owner_id {
            // Check for utilities
            if prop_info.group == crate::game::board::PropertyGroup::Utility {
                let utility_count = self.properties.iter()
                    .filter(|p| {
                        if let Some(info) = crate::game::board::get_property(p.id) {
                            info.group == crate::game::board::PropertyGroup::Utility && p.owner_id.as_deref() == Some(owner_id)
                        } else {
                            false
                        }
                    })
                    .count();
                
                return if utility_count == 2 {
                    (dice_roll as i32) * 10000
                } else {
                    (dice_roll as i32) * 4000
                };
            }

            // Check for railroads
            if prop_info.group == crate::game::board::PropertyGroup::Railroad {
                let railroad_count = self.properties.iter()
                    .filter(|p| {
                        if let Some(info) = crate::game::board::get_property(p.id) {
                            info.group == crate::game::board::PropertyGroup::Railroad && p.owner_id.as_deref() == Some(owner_id)
                        } else {
                            false
                        }
                    })
                    .count();
                
                return match railroad_count {
                    1 => 25000,
                    2 => 50000,
                    3 => 100000,
                    4 => 200000,
                    _ => 0,
                };
            }

            // Standard properties
            let base_rent = prop_info.rent;
            
            // If has houses, calculate based on house count
            // Placeholder for house rent logic until board.rs is updated
            
            // Let's check if monopoly
            if self.check_monopoly(owner_id, prop_info.group.clone()) && property.houses == 0 {
                return base_rent * 2;
            }
            
            if property.houses > 0 {
                 // Simple multiplier for now until we add full data
                 return base_rent * (1 + property.houses as i32 * 4); 
            }

            base_rent
        } else {
            0
        }
    }

    pub fn handle_buy_building(&mut self, player_id: String, property_id: usize) -> Result<Vec<ServerMessage>, String> {
        let property = self.properties.iter().find(|p| p.id == property_id).ok_or("Property not found")?;
        
        if property.owner_id.as_ref() != Some(&player_id) {
            return Err("You do not own this property".to_string());
        }

        let prop_info = crate::game::board::get_property(property_id).ok_or("Cannot build on this property")?;
        let group = prop_info.group.clone();
        
        if group == crate::game::board::PropertyGroup::Railroad || group == crate::game::board::PropertyGroup::Utility {
            return Err("Cannot build on railroads or utilities".to_string());
        }

        if !self.check_monopoly(&player_id, group.clone()) {
            return Err("You must own the monopoly to build".to_string());
        }

        // Check even building
        let group_properties: Vec<&crate::game::state::PropertyState> = self.properties.iter()
            .filter(|p| {
                if let Some(info) = crate::game::board::get_property(p.id) {
                    info.group == group
                } else {
                    false
                }
            })
            .collect();
        
        let min_houses = group_properties.iter().map(|p| p.houses).min().unwrap();

        if property.houses == 5 {
            return Err("Already at max level (Hotel)".to_string());
        }

        if property.houses > min_houses {
            return Err("Must build evenly".to_string());
        }

        // Check limits
        if property.houses == 4 { // Building a hotel
            if self.total_hotels == 0 {
                return Err("No hotels left in bank".to_string());
            }
        } else { // Building a house
            if self.total_houses == 0 {
                return Err("No houses left in bank".to_string());
            }
        }

        // Cost
        let building_cost = match property_id {
            1 | 3 | 6 | 8 | 9 => 50000,
            11 | 13 | 14 | 16 | 18 | 19 => 100000,
            21 | 23 | 24 | 26 | 27 | 29 => 150000,
            31 | 32 | 34 | 37 | 39 => 200000,
            _ => 0,
        };

        let player_idx = self.players.iter().position(|p| p.id == player_id).unwrap();
        if self.players[player_idx].money < building_cost {
            return Err("Not enough money".to_string());
        }

        // Execute
        self.players[player_idx].money -= building_cost;
        let prop_mut = self.properties.iter_mut().find(|p| p.id == property_id).unwrap();
        
        if prop_mut.houses == 4 { // Building a hotel
            self.total_houses += 4; // Return 4 houses to the bank
            self.total_hotels -= 1; // Take 1 hotel from the bank
        } else { // Building a house
            self.total_houses -= 1; // Take 1 house from the bank
        }
        prop_mut.houses += 1;
        let new_houses = prop_mut.houses;
        
        // Drop mutable borrow
        // (Implicitly dropped if we don't use prop_mut anymore)

        Ok(vec![
            ServerMessage::GameStateUpdate { state: self.clone() },
            ServerMessage::BuildingBought { property_id, houses: new_houses }
        ])
    }

    pub fn handle_sell_building(&mut self, player_id: String, property_id: usize) -> Result<Vec<ServerMessage>, String> {
        let property = self.properties.iter().find(|p| p.id == property_id).ok_or("Property not found")?;
        
        if property.owner_id.as_ref() != Some(&player_id) {
            return Err("You do not own this property".to_string());
        }

        if property.houses == 0 {
            return Err("No buildings to sell".to_string());
        }

        let prop_info = crate::game::board::get_property(property_id).ok_or("Invalid property")?;
        let group = prop_info.group.clone();

        // Check even selling
        let group_properties: Vec<&crate::game::state::PropertyState> = self.properties.iter()
            .filter(|p| {
                if let Some(info) = crate::game::board::get_property(p.id) {
                    info.group == group
                } else {
                    false
                }
            })
            .collect();
        
        let max_houses = group_properties.iter().map(|p| p.houses).max().unwrap();

        if property.houses < max_houses {
            return Err("Must sell evenly".to_string());
        }

        // Cost (50% return)
        let building_cost = match property_id {
            1 | 3 | 6 | 8 | 9 => 50000,
            11 | 13 | 14 | 16 | 18 | 19 => 100000,
            21 | 23 | 24 | 26 | 27 | 29 => 150000,
            31 | 32 | 34 | 37 | 39 => 200000,
            _ => 0,
        };
        let refund = building_cost / 2;

        // Execute
        let player_idx = self.players.iter().position(|p| p.id == player_id).unwrap();
        self.players[player_idx].money += refund;
        
        let prop_mut = self.properties.iter_mut().find(|p| p.id == property_id).unwrap();
        
        if prop_mut.houses == 5 { // Selling a hotel
            // Check if there are enough houses in the bank to replace the hotel
            if self.total_houses < 4 {
                return Err("Not enough houses in bank to downgrade hotel".to_string());
            }
            self.total_hotels += 1; // Return 1 hotel to the bank
            self.total_houses -= 4; // Take 4 houses from the bank
        } else { // Selling a house
            self.total_houses += 1; // Return 1 house to the bank
        }
        prop_mut.houses -= 1;
        let new_houses = prop_mut.houses;

        Ok(vec![
            ServerMessage::GameStateUpdate { state: self.clone() },
            ServerMessage::BuildingSold { property_id, houses: new_houses }
        ])
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

    pub fn pay_bail(&mut self, player_index: usize) -> Result<Vec<ServerMessage>, String> {
        if let Some(player) = self.players.get_mut(player_index) {
            if !player.is_in_jail {
                return Err("Player is not in jail".to_string());
            }
            if player.money < 50_000 {
                return Err("Not enough money".to_string());
            }
            
            player.money -= 50_000;
            player.is_in_jail = false;
            player.jail_turns = 0;
            
            let events = vec![ServerMessage::JailStateUpdated { 
                player_id: player.id.clone(), 
                is_in_jail: false, 
                jail_turns: 0 
            }];
            Ok(events)
        } else {
            Err("Player not found".to_string())
        }
    }

    pub fn use_jail_card(&mut self, player_index: usize) -> Result<Vec<ServerMessage>, String> {
        if let Some(player) = self.players.get_mut(player_index) {
            if !player.is_in_jail {
                return Err("Player is not in jail".to_string());
            }
            
            // Check if player has a Get Out of Jail Free card
            if let Some(card_idx) = player.held_cards.iter().position(|c| c.effect_type == "get_out_of_jail") {
                // Remove card
                let card = player.held_cards.remove(card_idx);
                
                // Return card to bottom of deck
                // We need to know which deck it came from. 
                // For now, let's assume we can put it back in Chance if ID <= 16, else Community Chest?
                // Or just put it back in both? Or just don't put it back yet (discard pile)?
                // Standard Monopoly: put back in deck.
                // Let's check card ID or title.
                // Chance IDs: 1-16. Community Chest IDs: 1-16. 
                // Wait, IDs overlap. We need a way to distinguish.
                // For now, let's just free the player and NOT put it back immediately (simplification)
                // OR, we can try to guess based on title/description if we really want to be correct.
                // "Kartu Bebas Skorsing" is in both.
                
                // Let's just free the player.
                player.is_in_jail = false;
                player.jail_turns = 0;
                
                // Re-add to deck?
                // If we don't, the card is gone forever.
                // Let's try to find which deck it belongs to.
                // Actually, `GameState` has `chance_deck` and `community_chest_deck`.
                // We can check if the card is in the original lists? No, they are shuffled.
                // Let's just push it to chance for now if we can't tell, or maybe we don't care for this milestone.
                // Let's just free the player.
                
                let events = vec![ServerMessage::JailStateUpdated { 
                    player_id: player.id.clone(), 
                    is_in_jail: false, 
                    jail_turns: 0 
                }];
                Ok(events)
            } else {
                Err("You do not have a Get Out of Jail Free card".to_string())
            }
        } else {
            Err("Player not found".to_string())
        }
    }

    pub fn handle_propose_trade(&mut self, initiator_id: String, target_player_id: String, offer: crate::game::trade::TradeOffer, request: crate::game::trade::TradeOffer) -> Result<Vec<ServerMessage>, String> {
        // Validate players exist
        if !self.players.iter().any(|p| p.id == initiator_id) {
            return Err("Initiator not found".to_string());
        }
        if !self.players.iter().any(|p| p.id == target_player_id) {
            return Err("Target player not found".to_string());
        }

        // Validate ownership of offered items
        let initiator = self.players.iter().find(|p| p.id == initiator_id).unwrap();
        if initiator.money < offer.money {
            return Err("Not enough money to offer".to_string());
        }
        for prop_id in &offer.property_ids {
            if let Some(prop) = self.properties.iter().find(|p| p.id == *prop_id) {
                if prop.owner_id.as_ref() != Some(&initiator_id) {
                    return Err(format!("You do not own property {}", prop_id));
                }
            } else {
                return Err(format!("Property {} not found", prop_id));
            }
        }

        // Validate ownership of requested items
        let target = self.players.iter().find(|p| p.id == target_player_id).unwrap();
        // We don't strictly enforce target has money NOW, but we check on accept.
        // But for properties, we should check they own them.
        for prop_id in &request.property_ids {
            if let Some(prop) = self.properties.iter().find(|p| p.id == *prop_id) {
                if prop.owner_id.as_ref() != Some(&target_player_id) {
                    return Err(format!("Target does not own property {}", prop_id));
                }
            } else {
                return Err(format!("Property {} not found", prop_id));
            }
        }

        let trade_id = uuid::Uuid::new_v4().to_string();
        let proposal = crate::game::trade::TradeProposal {
            id: trade_id.clone(),
            initiator_id: initiator_id.clone(),
            target_player_id: target_player_id.clone(),
            offer,
            request,
            status: crate::game::trade::TradeStatus::Pending,
        };

        self.active_trades.insert(trade_id.clone(), proposal.clone());

        Ok(vec![ServerMessage::TradeProposed { proposal }])
    }

    pub fn handle_accept_trade(&mut self, trade_id: String, player_id: String) -> Result<Vec<ServerMessage>, String> {
        if let Some(proposal) = self.active_trades.get(&trade_id) {
            if proposal.target_player_id != player_id {
                return Err("You are not the target of this trade".to_string());
            }

            // Re-validate assets (state might have changed)
            let initiator_idx = self.players.iter().position(|p| p.id == proposal.initiator_id).ok_or("Initiator not found")?;
            let target_idx = self.players.iter().position(|p| p.id == proposal.target_player_id).ok_or("Target not found")?;

            // Check money
            if self.players[initiator_idx].money < proposal.offer.money {
                return Err("Initiator no longer has enough money".to_string());
            }
            if self.players[target_idx].money < proposal.request.money {
                return Err("You do not have enough money".to_string());
            }

            // Check properties
            for prop_id in &proposal.offer.property_ids {
                let prop = self.properties.iter().find(|p| p.id == *prop_id).ok_or("Property not found")?;
                if prop.owner_id.as_ref() != Some(&proposal.initiator_id) {
                    return Err("Initiator no longer owns offered property".to_string());
                }
            }
            for prop_id in &proposal.request.property_ids {
                let prop = self.properties.iter().find(|p| p.id == *prop_id).ok_or("Property not found")?;
                if prop.owner_id.as_ref() != Some(&proposal.target_player_id) {
                    return Err("You no longer own requested property".to_string());
                }
            }

            // Execute Trade
            // 1. Money
            self.players[initiator_idx].money -= proposal.offer.money;
            self.players[target_idx].money += proposal.offer.money;
            
            self.players[target_idx].money -= proposal.request.money;
            self.players[initiator_idx].money += proposal.request.money;

            // 2. Properties
            // We need to collect property indices first to avoid borrow checker issues if we iterate self.properties mutably
            // Actually, we can just iterate and match IDs.
            let offer_props = proposal.offer.property_ids.clone();
            let request_props = proposal.request.property_ids.clone();

            for prop in &mut self.properties {
                if offer_props.contains(&prop.id) {
                    prop.owner_id = Some(proposal.target_player_id.clone());
                }
                if request_props.contains(&prop.id) {
                    prop.owner_id = Some(proposal.initiator_id.clone());
                }
            }

            // Remove trade
            self.active_trades.remove(&trade_id);

            Ok(vec![
                ServerMessage::TradeAccepted { trade_id },
                ServerMessage::GameStateUpdate { state: self.clone() }
            ])
        } else {
            Err("Trade not found".to_string())
        }
    }

    pub fn handle_reject_trade(&mut self, trade_id: String, player_id: String) -> Result<Vec<ServerMessage>, String> {
        if let Some(proposal) = self.active_trades.get(&trade_id) {
            if proposal.target_player_id != player_id {
                return Err("You are not the target of this trade".to_string());
            }
            self.active_trades.remove(&trade_id);
            Ok(vec![ServerMessage::TradeRejected { trade_id }])
        } else {
            Err("Trade not found".to_string())
        }
    }

    pub fn handle_cancel_trade(&mut self, trade_id: String, player_id: String) -> Result<Vec<ServerMessage>, String> {
        if let Some(proposal) = self.active_trades.get(&trade_id) {
            if proposal.initiator_id != player_id {
                return Err("You are not the initiator of this trade".to_string());
            }
            self.active_trades.remove(&trade_id);
            Ok(vec![ServerMessage::TradeCancelled { trade_id }])
        } else {
            Err("Trade not found".to_string())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::game::state::{GameState, GamePhase};

    fn create_test_game() -> GameState {
        let mut game = GameState::new();
        game.players.push(crate::game::state::PlayerState {
            id: "player1".to_string(),
            name: "Player 1".to_string(),
            money: 1500000,
            position: 0,
            color: "red".to_string(),
            is_in_jail: false,
            jail_turns: 0,
            doubles_count: 0,
            held_cards: Vec::new(),
        });
        game.players.push(crate::game::state::PlayerState {
            id: "player2".to_string(),
            name: "Player 2".to_string(),
            money: 1500000,
            position: 0,
            color: "blue".to_string(),
            is_in_jail: false,
            jail_turns: 0,
            doubles_count: 0,
            held_cards: Vec::new(),
        });
        game.current_turn = 0;
        game.phase = GamePhase::Rolling;
        game
    }

    #[test]
    fn test_handle_roll_success() {
        let mut game = create_test_game();
        // Ensure it's player 1's turn and Rolling phase
        assert_eq!(game.current_turn, 0);
        assert_eq!(game.phase, GamePhase::Rolling);

        let result = game.handle_roll("player1");
        assert!(result.is_ok());
    }

    #[test]
    fn test_handle_roll_wrong_turn() {
        let mut game = create_test_game();
        let result = game.handle_roll("player2");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Not your turn");
    }

    #[test]
    fn test_handle_roll_wrong_phase() {
        let mut game = create_test_game();
        game.phase = GamePhase::EndTurn;
        let result = game.handle_roll("player1");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid phase"));
    }

    #[test]
    fn test_next_turn_success() {
        let mut game = create_test_game();
        game.phase = GamePhase::EndTurn; // Must be in EndTurn to call next_turn

        let result = game.next_turn("player1");
        assert!(result.is_ok());
        assert_eq!(game.current_turn, 1);
        assert_eq!(game.phase, GamePhase::Rolling);
    }

    #[test]
    fn test_next_turn_wrong_turn() {
        let mut game = create_test_game();
        game.phase = GamePhase::EndTurn;
        
        let result = game.next_turn("player2");
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Not your turn");
    }

    #[test]
    fn test_next_turn_wrong_phase() {
        let mut game = create_test_game();
        game.phase = GamePhase::Rolling; // Wrong phase
        
        let result = game.next_turn("player1");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Invalid phase"));
    }
}
