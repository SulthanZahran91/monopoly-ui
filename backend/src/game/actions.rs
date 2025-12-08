use crate::game::state::GameState;
use crate::game::board::get_property;

pub fn handle_buy_property(game: &mut GameState, player_id: &str) -> Result<(), String> {
    // 0. Check state
    tracing::info!(
        "[FSM] handle_buy_property: START - player_id={}, current_turn={}, phase={:?}",
        player_id, game.current_turn, game.phase
    );
    
    game.check_turn(player_id)?;
    game.check_phase(crate::game::state::GamePhase::EndTurn)?;

    // 1. Find player
    let player_idx = game.players.iter().position(|p| p.id == player_id)
        .ok_or("Player not found")?;
    
    // 2. Get player's current position
    let position = game.players[player_idx].position;
    
    // 3. Check if it's a valid property
    let property_info = get_property(position).ok_or("Not a property")?;
    
    // 4. Check if already owned
    let property_state = game.properties.iter_mut().find(|p| p.id == position)
        .ok_or("Property state not found")?;
        
    if property_state.owner_id.is_some() {
        tracing::warn!(
            "[FSM] handle_buy_property: FAIL - property already owned, position={}",
            position
        );
        return Err("Property already owned".to_string());
    }
    
    // 5. Check funds
    if game.players[player_idx].money < property_info.price {
        tracing::warn!(
            "[FSM] handle_buy_property: FAIL - insufficient funds, money={}, price={}",
            game.players[player_idx].money, property_info.price
        );
        return Err("Insufficient funds".to_string());
    }
    
    // 6. Execute purchase
    game.players[player_idx].money -= property_info.price;
    property_state.owner_id = Some(player_id.to_string());
    
    tracing::info!(
        "[FSM] handle_buy_property: SUCCESS - player_id={}, property_id={}, price={}",
        player_id, position, property_info.price
    );
    
    Ok(())
}

/// Result of a pay rent attempt
pub enum PayRentResult {
    /// Rent paid successfully
    Success,
    /// Player cannot pay - bankruptcy required. Contains creditor_id and rent amount.
    BankruptcyRequired { creditor_id: String, rent_owed: i32 },
}

pub fn handle_pay_rent(game: &mut GameState, player_id: &str) -> Result<PayRentResult, String> {
    // 0. Check state
    tracing::info!(
        "[FSM] handle_pay_rent: START - player_id={}, current_turn={}, phase={:?}",
        player_id, game.current_turn, game.phase
    );
    
    game.check_turn(player_id)?;
    game.check_phase(crate::game::state::GamePhase::EndTurn)?;

    // 1. Find player
    let player_idx = game.players.iter().position(|p| p.id == player_id)
        .ok_or("Player not found")?;
    let player_pos = game.players[player_idx].position;
    
    // 2. Get property info and state
    let property_info = get_property(player_pos).ok_or("Not a property")?;
    let property_state = game.properties.iter().find(|p| p.id == player_pos)
        .ok_or("Property state not found")?;
        
    // 3. Check ownership
    let owner_id = property_state.owner_id.as_ref().ok_or("Property not owned")?;
    if owner_id == player_id {
        tracing::warn!(
            "[FSM] handle_pay_rent: FAIL - player owns this property, position={}",
            player_pos
        );
        return Err("You own this property".to_string());
    }
    
    // 4. Calculate rent
    let dice_sum = if let Some((d1, d2)) = game.last_dice_roll {
        d1 + d2
    } else {
        0 // Should not happen if moved by dice, but if moved by card without roll, might be 0.
          // For utilities, this means 0 rent if no dice roll recorded.
    };
    let rent = game.calculate_rent(player_pos, dice_sum);
    
    tracing::info!(
        "[FSM] handle_pay_rent: CALCULATING - position={}, dice_sum={}, rent={}, owner={}",
        player_pos, dice_sum, rent, owner_id
    );
    
    // 5. Check funds - if insufficient, return bankruptcy required
    if game.players[player_idx].money < rent {
        tracing::warn!(
            "[FSM] handle_pay_rent: BANKRUPTCY REQUIRED - player_id={}, money={}, rent={}, creditor={}",
            player_id, game.players[player_idx].money, rent, owner_id
        );
        return Ok(PayRentResult::BankruptcyRequired { 
            creditor_id: owner_id.clone(), 
            rent_owed: rent 
        });
    }
    
    // 6. Transfer money
    game.players[player_idx].money -= rent;
    
    if let Some(owner_idx) = game.players.iter().position(|p| &p.id == owner_id) {
        game.players[owner_idx].money += rent;
    }
    
    game.rent_paid = true;
    
    tracing::info!(
        "[FSM] handle_pay_rent: SUCCESS - player_id={}, position={}, rent={}, owner={}",
        player_id, player_pos, rent, owner_id
    );

    Ok(PayRentResult::Success)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::game::state::{GameState, PlayerState};

    #[test]
    fn test_buy_property_success() {
        let mut game = GameState::new();
        // Add a player
        game.players.push(PlayerState {
            id: "player1".to_string(),
            name: "Test Player".to_string(),
            money: 100_000,
            position: 1, // ID 1 is Matematika (Price 60_000)
            color: "red".to_string(),
            is_in_jail: false,
            jail_turns: 0,
            doubles_count: 0,
            held_cards: Vec::new(),
        });
        game.phase = crate::game::state::GamePhase::EndTurn;

        // Ensure property is not owned
        assert!(game.properties.iter().find(|p| p.id == 1).unwrap().owner_id.is_none());

        // Buy
        let result = handle_buy_property(&mut game, "player1");
        assert!(result.is_ok());

        // Check ownership
        let prop = game.properties.iter().find(|p| p.id == 1).unwrap();
        assert_eq!(prop.owner_id, Some("player1".to_string()));
        
        // Check money
        let player = game.players.iter().find(|p| p.id == "player1").unwrap();
        assert_eq!(player.money, 40_000); // 100k - 60k
    }

    #[test]
    fn test_buy_property_insufficient_funds() {
        let mut game = GameState::new();
        game.players.push(PlayerState {
            id: "player1".to_string(),
            name: "Test Player".to_string(),
            money: 10_000, // Not enough for 60k
            position: 1,
            color: "red".to_string(),
            is_in_jail: false,
            jail_turns: 0,
            doubles_count: 0,
            held_cards: Vec::new(),
        });
        game.phase = crate::game::state::GamePhase::EndTurn;

        let result = handle_buy_property(&mut game, "player1");
        assert_eq!(result, Err("Insufficient funds".to_string()));
    }

    #[test]
    fn test_buy_property_already_owned() {
        let mut game = GameState::new();
        game.players.push(PlayerState {
            id: "player1".to_string(),
            name: "Player 1".to_string(),
            money: 100_000,
            position: 1,
            color: "red".to_string(),
            is_in_jail: false,
            jail_turns: 0,
            doubles_count: 0,
            held_cards: Vec::new(),
        });
        game.players.push(PlayerState {
            id: "player2".to_string(),
            name: "Player 2".to_string(),
            money: 100_000,
            position: 1,
            color: "blue".to_string(),
            is_in_jail: false,
            jail_turns: 0,
            doubles_count: 0,
            held_cards: Vec::new(),
        });
        game.phase = crate::game::state::GamePhase::EndTurn;

        // Player 1 buys
        assert!(handle_buy_property(&mut game, "player1").is_ok());

        // Switch turn to Player 2
        game.current_turn = 1;
        game.phase = crate::game::state::GamePhase::EndTurn;

        // Player 2 tries to buy
        let result = handle_buy_property(&mut game, "player2");
        assert_eq!(result, Err("Property already owned".to_string()));
    }
}
