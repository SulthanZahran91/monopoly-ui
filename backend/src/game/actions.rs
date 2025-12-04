use crate::game::state::GameState;
use crate::game::board::get_property;

pub fn handle_buy_property(game: &mut GameState, player_id: &str) -> Result<(), String> {
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
        return Err("Property already owned".to_string());
    }
    
    // 5. Check funds
    if game.players[player_idx].money < property_info.price {
        return Err("Insufficient funds".to_string());
    }
    
    // 6. Execute purchase
    game.players[player_idx].money -= property_info.price;
    property_state.owner_id = Some(player_id.to_string());
    
    Ok(())
}

pub fn handle_pay_rent(game: &mut GameState, player_id: &str) -> Result<(), String> {
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
        return Err("You own this property".to_string());
    }
    
    // 4. Calculate rent (basic for now)
    let rent = property_info.rent;
    
    // 5. Check funds
    if game.players[player_idx].money < rent {
        return Err("Insufficient funds".to_string()); // In future: bankruptcy logic
    }
    
    // 6. Transfer money
    game.players[player_idx].money -= rent;
    
    if let Some(owner_idx) = game.players.iter().position(|p| &p.id == owner_id) {
        game.players[owner_idx].money += rent;
    }
    
    game.rent_paid = true;

    Ok(())
}
