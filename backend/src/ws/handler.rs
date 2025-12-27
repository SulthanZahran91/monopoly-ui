use axum::{
    extract::ws::{Message, WebSocket, WebSocketUpgrade},
    extract::State,
    response::IntoResponse,
};
use futures::{sink::SinkExt, stream::StreamExt};
use std::sync::Arc;
use tokio::sync::broadcast;
use crate::room::manager::RoomManager;
use crate::ws::messages::{ClientMessage, ServerMessage};
use crate::game::state::GamePhase;

#[tracing::instrument(skip(ws, room_manager))]
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(room_manager): State<Arc<RoomManager>>,
) -> impl IntoResponse {
    tracing::info!("New WebSocket connection attempt");
    ws.on_upgrade(move |socket| handle_socket(socket, room_manager))
}

async fn handle_socket(socket: WebSocket, room_manager: Arc<RoomManager>) {
    let (mut sender, mut receiver) = socket.split();
    let mut current_room_code: Option<String> = None;
    let mut current_player_id: Option<String> = None;
    let mut broadcast_rx: Option<broadcast::Receiver<ServerMessage>> = None;
    
    tracing::info!("WebSocket connection established");

    loop {
        tokio::select! {
            msg_result = receiver.next() => {
                match msg_result {
                    Some(Ok(msg)) => {
                        if let Message::Text(text) = msg {
                            if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(&text) {
                                match client_msg {
                                    ClientMessage::CreateRoom { player_name } => {
                                        let room_code = room_manager.create_room();
                                        if let Some((player_id, players)) = room_manager.join_room(&room_code, player_name) {
                                            current_room_code = Some(room_code.clone());
                                            current_player_id = Some(player_id.clone());
                                            
                                            // Get broadcast channel
                                            if let Some(room) = room_manager.rooms.get(&room_code) {
                                                broadcast_rx = Some(room.tx.subscribe());
                                            }

                                            tracing::info!("Room created: {}, Player: {}", room_code, player_id);

                                            let response = ServerMessage::RoomCreated { 
                                                room_code,
                                                player_id,
                                                players
                                            };
                                            let _ = sender.send(Message::Text(serde_json::to_string(&response).unwrap())).await;
                                        }
                                    }
                                    ClientMessage::JoinRoom { room_code, player_name } => {
                                        if let Some((player_id, players)) = room_manager.join_room(&room_code, player_name.clone()) {
                                            current_room_code = Some(room_code.clone());
                                            current_player_id = Some(player_id.clone());

                                            // Broadcast PlayerJoined to others
                                            if let Some(room) = room_manager.rooms.get(&room_code) {
                                                let _ = room.tx.send(ServerMessage::PlayerJoined { 
                                                    player: crate::room::player::Player { id: player_id.clone(), name: player_name } 
                                                });
                                                // Subscribe AFTER broadcasting to avoid receiving own join message (optional, but cleaner)
                                                broadcast_rx = Some(room.tx.subscribe());
                                            }

                                            tracing::info!("Joined room: {}, Player: {}", room_code, player_id);

                                            let response = ServerMessage::RoomJoined {
                                                room_code,
                                                player_id,
                                                players
                                            };
                                            let _ = sender.send(Message::Text(serde_json::to_string(&response).unwrap())).await;
                                        }
                                     }
                                     ClientMessage::Reconnect { room_code, player_id } => {
                                         if let Some(room) = room_manager.rooms.get(&room_code) {
                                             if room.players.contains_key(&player_id) {
                                                 current_room_code = Some(room_code.clone());
                                                 current_player_id = Some(player_id.clone());
                                                 broadcast_rx = Some(room.tx.subscribe());

                                                 tracing::info!("Reconnected: {}, Player: {}", room_code, player_id);

                                                 let players: Vec<_> = room.players.values().cloned().collect();
                                                 let response = ServerMessage::RoomJoined {
                                                     room_code,
                                                     player_id,
                                                     players
                                                 };
                                                 let _ = sender.send(Message::Text(serde_json::to_string(&response).unwrap())).await;

                                                 // If game has started, send the current state
                                                 if let Some(state) = &room.game_state {
                                                     tracing::info!("Sending current game state to reconnected player. Phase: {:?}", state.phase);
                                                     let state_update = ServerMessage::GameStateUpdate { state: state.clone() };
                                                     let _ = sender.send(Message::Text(serde_json::to_string(&state_update).unwrap())).await;
                                                 } else {
                                                     tracing::info!("No game state found for reconnected room");
                                                 }
                                             } else {
                                                 tracing::warn!("Failed to reconnect: Player {} not in room {}", player_id, room_code);
                                                 let response = ServerMessage::Error { message: "Player not in room".to_string() };
                                                 let _ = sender.send(Message::Text(serde_json::to_string(&response).unwrap())).await;
                                             }
                                         } else {
                                             tracing::warn!("Failed to reconnect: Room {} not found", room_code);
                                             let response = ServerMessage::Error { message: "Room not found".to_string() };
                                             let _ = sender.send(Message::Text(serde_json::to_string(&response).unwrap())).await;
                                         }
                                     }
                                     ClientMessage::StartGame => {
                                        if let Some(room_code) = &current_room_code {
                                            if let Some(mut room) = room_manager.rooms.get_mut(room_code) {
                                                room.start_game();
                                                if let Some(state) = &room.game_state {
                                                    tracing::info!("Game started in room: {}", room_code);
                                                    let response = ServerMessage::GameStarted { state: state.clone() };
                                                    let _ = room.tx.send(response);
                                                }
                                            }
                                        }
                                    }
                                    ClientMessage::RollDice => {
                                        if let (Some(room_code), Some(player_id)) = (&current_room_code, &current_player_id) {
                                            if let Some(mut room) = room_manager.rooms.get_mut(room_code) {
                                                let tx = room.tx.clone();
                                                if let Some(state) = &mut room.game_state {
                                                    let current_player_idx = state.current_turn;
                                                    if let Some(_player) = state.players.get(current_player_idx) {
                                                        match state.handle_roll(player_id) {
                                                            Ok((dice, events)) => {
                                                                let is_doubles = dice.0 == dice.1;
                                                                let phase_before = state.phase.clone();
                                                                
                                                                // If sent to jail, phase is already EndTurn (set by send_to_jail called in handle_roll)
                                                                // If not sent to jail, we are in Rolling.
                                                                if state.phase == GamePhase::Rolling {
                                                                    if !is_doubles {
                                                                        state.phase = GamePhase::EndTurn;
                                                                        tracing::info!(
                                                                            "[FSM] RollDice handler: TRANSITION - phase: {:?} -> {:?} (not doubles)",
                                                                            phase_before, state.phase
                                                                        );
                                                                    } else {
                                                                        tracing::info!(
                                                                            "[FSM] RollDice handler: NO TRANSITION - phase stays {:?} (doubles={})",
                                                                            state.phase, is_doubles
                                                                        );
                                                                    }
                                                                    // If doubles, stay in Rolling
                                                                } else {
                                                                    tracing::info!(
                                                                        "[FSM] RollDice handler: NO HANDLER TRANSITION - phase already {:?} (set by game logic, e.g., jail)",
                                                                        state.phase
                                                                    );
                                                                }

                                                                let response = ServerMessage::DiceRolled { 
                                                                    dice, 
                                                                    state: state.clone() 
                                                                };
                                                                let _ = tx.send(response);
                                                                
                                                                let events_occurred = !events.is_empty();
                                                                for event in events {
                                                                    let _ = tx.send(event);
                                                                }
                                                                
                                                                if events_occurred {
                                                                    let _ = tx.send(ServerMessage::GameStateUpdate { state: state.clone() });
                                                                }
                                                            }
                                                            Err(e) => {
                                                                let response = ServerMessage::Error { message: e };
                                                                let _ = sender.send(Message::Text(serde_json::to_string(&response).unwrap())).await;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    ClientMessage::PayBail => {
                                        if let (Some(room_code), Some(player_id)) = (&current_room_code, &current_player_id) {
                                            if let Some(mut room) = room_manager.rooms.get_mut(room_code) {
                                                let tx = room.tx.clone();
                                                if let Some(state) = &mut room.game_state {
                                                    let current_player_idx = state.current_turn;
                                                    if let Some(player) = state.players.get(current_player_idx) {
                                                        if &player.id == player_id {
                                                            match state.pay_bail(current_player_idx) {
                                                                Ok(events) => {
                                                                    for event in events {
                                                                        let _ = tx.send(event);
                                                                    }
                                                                    let _ = tx.send(ServerMessage::GameStateUpdate { state: state.clone() });
                                                                }
                                                                Err(e) => {
                                                                    let response = ServerMessage::Error { message: e };
                                                                    let _ = sender.send(Message::Text(serde_json::to_string(&response).unwrap())).await;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    ClientMessage::UseJailCard => {
                                        if let (Some(room_code), Some(player_id)) = (&current_room_code, &current_player_id) {
                                            if let Some(mut room) = room_manager.rooms.get_mut(room_code) {
                                                let tx = room.tx.clone();
                                                if let Some(state) = &mut room.game_state {
                                                    let current_player_idx = state.current_turn;
                                                    if let Some(player) = state.players.get(current_player_idx) {
                                                        if &player.id == player_id {
                                                            match state.use_jail_card(current_player_idx) {
                                                                Ok(events) => {
                                                                    for event in events {
                                                                        let _ = tx.send(event);
                                                                    }
                                                                    let _ = tx.send(ServerMessage::GameStateUpdate { state: state.clone() });
                                                                }
                                                                Err(e) => {
                                                                    let response = ServerMessage::Error { message: e };
                                                                    let _ = sender.send(Message::Text(serde_json::to_string(&response).unwrap())).await;
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    ClientMessage::ProposeTrade { target_player_id, offer, request } => {
                                        if let (Some(room_code), Some(player_id)) = (&current_room_code, &current_player_id) {
                                            if let Some(mut room) = room_manager.rooms.get_mut(room_code) {
                                                let tx = room.tx.clone();
                                                if let Some(state) = &mut room.game_state {
                                                    match state.handle_propose_trade(player_id.clone(), target_player_id, offer, request) {
                                                        Ok(events) => {
                                                            for event in events {
                                                                let _ = tx.send(event);
                                                            }
                                                        }
                                                        Err(e) => {
                                                            let response = ServerMessage::Error { message: e };
                                                            let _ = sender.send(Message::Text(serde_json::to_string(&response).unwrap())).await;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    ClientMessage::AcceptTrade { trade_id } => {
                                        if let (Some(room_code), Some(player_id)) = (&current_room_code, &current_player_id) {
                                            if let Some(mut room) = room_manager.rooms.get_mut(room_code) {
                                                let tx = room.tx.clone();
                                                if let Some(state) = &mut room.game_state {
                                                    match state.handle_accept_trade(trade_id, player_id.clone()) {
                                                        Ok(events) => {
                                                            for event in events {
                                                                let _ = tx.send(event);
                                                            }
                                                        }
                                                        Err(e) => {
                                                            let response = ServerMessage::Error { message: e };
                                                            let _ = sender.send(Message::Text(serde_json::to_string(&response).unwrap())).await;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    ClientMessage::RejectTrade { trade_id } => {
                                        if let (Some(room_code), Some(player_id)) = (&current_room_code, &current_player_id) {
                                            if let Some(mut room) = room_manager.rooms.get_mut(room_code) {
                                                let tx = room.tx.clone();
                                                if let Some(state) = &mut room.game_state {
                                                    match state.handle_reject_trade(trade_id, player_id.clone()) {
                                                        Ok(events) => {
                                                            for event in events {
                                                                let _ = tx.send(event);
                                                            }
                                                        }
                                                        Err(e) => {
                                                            let response = ServerMessage::Error { message: e };
                                                            let _ = sender.send(Message::Text(serde_json::to_string(&response).unwrap())).await;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    ClientMessage::CancelTrade { trade_id } => {
                                        if let (Some(room_code), Some(player_id)) = (&current_room_code, &current_player_id) {
                                            if let Some(mut room) = room_manager.rooms.get_mut(room_code) {
                                                let tx = room.tx.clone();
                                                if let Some(state) = &mut room.game_state {
                                                    match state.handle_cancel_trade(trade_id, player_id.clone()) {
                                                        Ok(events) => {
                                                            for event in events {
                                                                let _ = tx.send(event);
                                                            }
                                                        }
                                                        Err(e) => {
                                                            let _ = tx.send(ServerMessage::Error { message: e });
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    ClientMessage::BuyBuilding { property_id } => {
                                        if let (Some(room_code), Some(player_id)) = (&current_room_code, &current_player_id) {
                                            if let Some(mut room) = room_manager.rooms.get_mut(room_code) {
                                                let tx = room.tx.clone();
                                                if let Some(state) = &mut room.game_state {
                                                    match state.handle_buy_building(player_id.clone(), property_id) {
                                                        Ok(events) => {
                                                            for event in events {
                                                                let _ = tx.send(event);
                                                            }
                                                        }
                                                        Err(e) => {
                                                            let _ = tx.send(ServerMessage::Error { message: e });
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    ClientMessage::SellBuilding { property_id } => {
                                        if let (Some(room_code), Some(player_id)) = (&current_room_code, &current_player_id) {
                                            if let Some(mut room) = room_manager.rooms.get_mut(room_code) {
                                                let tx = room.tx.clone();
                                                if let Some(state) = &mut room.game_state {
                                                    match state.handle_sell_building(player_id.clone(), property_id) {
                                                        Ok(events) => {
                                                            for event in events {
                                                                let _ = tx.send(event);
                                                            }
                                                        }
                                                        Err(e) => {
                                                            let _ = tx.send(ServerMessage::Error { message: e });
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    ClientMessage::MortgageProperty { property_id } => {
                                        if let (Some(room_code), Some(player_id)) = (&current_room_code, &current_player_id) {
                                            if let Some(mut room) = room_manager.rooms.get_mut(room_code) {
                                                let tx = room.tx.clone();
                                                if let Some(state) = &mut room.game_state {
                                                    match state.handle_mortgage_property(player_id.clone(), property_id) {
                                                        Ok(events) => {
                                                            for event in events {
                                                                let _ = tx.send(event);
                                                            }
                                                        }
                                                        Err(e) => {
                                                            let _ = tx.send(ServerMessage::Error { message: e });
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    ClientMessage::UnmortgageProperty { property_id } => {
                                        if let (Some(room_code), Some(player_id)) = (&current_room_code, &current_player_id) {
                                            if let Some(mut room) = room_manager.rooms.get_mut(room_code) {
                                                let tx = room.tx.clone();
                                                if let Some(state) = &mut room.game_state {
                                                    match state.handle_unmortgage_property(player_id.clone(), property_id) {
                                                        Ok(events) => {
                                                            for event in events {
                                                                let _ = tx.send(event);
                                                            }
                                                        }
                                                        Err(e) => {
                                                            let _ = tx.send(ServerMessage::Error { message: e });
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    ClientMessage::DeclareBankruptcy { creditor_id } => {
                                        if let (Some(room_code), Some(player_id)) = (&current_room_code, &current_player_id) {
                                            if let Some(mut room) = room_manager.rooms.get_mut(room_code) {
                                                let tx = room.tx.clone();
                                                if let Some(state) = &mut room.game_state {
                                                    tracing::info!(
                                                        "[FSM] DeclareBankruptcy: player_id={}, creditor_id={:?}",
                                                        player_id, creditor_id
                                                    );
                                                    let events = state.handle_bankruptcy(
                                                        player_id,
                                                        creditor_id.as_deref()
                                                    );
                                                    for event in events {
                                                        let _ = tx.send(event);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    ClientMessage::BuyProperty => {
                                        if let (Some(room_code), Some(player_id)) = (&current_room_code, &current_player_id) {
                                            tracing::info!("Received BuyProperty request from player {} in room {}", player_id, room_code);
                                            if let Some(mut room) = room_manager.rooms.get_mut(room_code) {
                                                if let Some(state) = &mut room.game_state {
                                                    match crate::game::actions::handle_buy_property(state, player_id) {
                                                        Ok(_) => {
                                                            let response = ServerMessage::GameStateUpdate { state: state.clone() };
                                                            let _ = room.tx.send(response);
                                                        }
                                                        Err(e) => {
                                                            let response = ServerMessage::Error { message: e };
                                                            let _ = sender.send(Message::Text(serde_json::to_string(&response).unwrap())).await;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    ClientMessage::PayRent => {
                                        if let (Some(room_code), Some(player_id)) = (&current_room_code, &current_player_id) {
                                            if let Some(mut room) = room_manager.rooms.get_mut(room_code) {
                                                let tx = room.tx.clone();
                                                if let Some(state) = &mut room.game_state {
                                                    match crate::game::actions::handle_pay_rent(state, player_id) {
                                                        Ok(result) => {
                                                            use crate::game::actions::PayRentResult;
                                                            match result {
                                                                PayRentResult::Success => {
                                                                    let response = ServerMessage::GameStateUpdate { state: state.clone() };
                                                                    let _ = tx.send(response);
                                                                }
                                                                PayRentResult::BankruptcyRequired { creditor_id, rent_owed } => {
                                                                    tracing::info!(
                                                                        "[FSM] PayRent: AUTO-BANKRUPTCY - player_id={}, creditor_id={}, rent_owed={}",
                                                                        player_id, creditor_id, rent_owed
                                                                    );
                                                                    // Auto-trigger bankruptcy - assets transfer to creditor
                                                                    let events = state.handle_bankruptcy(
                                                                        player_id,
                                                                        Some(&creditor_id)
                                                                    );
                                                                    for event in events {
                                                                        let _ = tx.send(event);
                                                                    }
                                                                }
                                                            }
                                                        }
                                                        Err(e) => {
                                                            let response = ServerMessage::Error { message: e };
                                                            let _ = sender.send(Message::Text(serde_json::to_string(&response).unwrap())).await;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    ClientMessage::EndTurn => {
                                         if let (Some(room_code), Some(player_id)) = (&current_room_code, &current_player_id) {
                                            if let Some(mut room) = room_manager.rooms.get_mut(room_code) {
                                                if let Some(state) = &mut room.game_state {
                                                    let current_player_idx = state.current_turn;
                                                    if let Some(_player) = state.players.get(current_player_idx) {
                                                        match state.next_turn(player_id) {
                                                            Ok(_) => {
                                                                let response = ServerMessage::TurnEnded { 
                                                                    state: state.clone() 
                                                                };
                                                                let _ = room.tx.send(response);
                                                            }
                                                            Err(e) => {
                                                                let response = ServerMessage::Error { message: e };
                                                                let _ = sender.send(Message::Text(serde_json::to_string(&response).unwrap())).await;
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    ClientMessage::VoteKick { target_player_id } => {
                                        if let (Some(room_code), Some(player_id)) = (&current_room_code, &current_player_id) {
                                            if let Some(mut room) = room_manager.rooms.get_mut(room_code) {
                                                // Check if vote already in progress
                                                if room.vote_state.is_some() {
                                                    let response = ServerMessage::Error { message: "Vote already in progress".to_string() };
                                                    let _ = sender.send(Message::Text(serde_json::to_string(&response).unwrap())).await;
                                                    continue;
                                                }

                                                // Check if target exists
                                                if !room.players.contains_key(&target_player_id) {
                                                    let response = ServerMessage::Error { message: "Player not found".to_string() };
                                                    let _ = sender.send(Message::Text(serde_json::to_string(&response).unwrap())).await;
                                                    continue;
                                                }

                                                // Initialize vote
                                                let end_time = std::time::SystemTime::now()
                                                    .duration_since(std::time::UNIX_EPOCH)
                                                    .unwrap()
                                                    .as_secs() + 30;

                                                let mut votes_for = std::collections::HashSet::new();
                                                votes_for.insert(player_id.clone()); // Initiator automatically votes yes

                                                let vote_state = crate::room::room::VoteState {
                                                    initiator_id: player_id.clone(),
                                                    target_player_id: target_player_id.clone(),
                                                    votes_for,
                                                    votes_against: std::collections::HashSet::new(),
                                                    end_time,
                                                };

                                                room.vote_state = Some(vote_state);

                                                let response = ServerMessage::VoteStarted {
                                                    initiator_id: player_id.clone(),
                                                    target_player_id: target_player_id.clone(),
                                                    end_time,
                                                };
                                                let _ = room.tx.send(response);

                                                // Send initial update
                                                let required = (room.players.len() as f32 / 2.0).floor() as usize + 1;
                                                let update = ServerMessage::VoteUpdate {
                                                    votes_for: 1,
                                                    votes_against: 0,
                                                    required,
                                                };
                                                let _ = room.tx.send(update);
                                            }
                                        }
                                    }
                                    ClientMessage::CastVote { vote } => {
                                        if let (Some(room_code), Some(player_id)) = (&current_room_code, &current_player_id) {
                                            if let Some(mut room) = room_manager.rooms.get_mut(room_code) {
                                                let tx = room.tx.clone();
                                                let total_players = room.players.len();
                                                if let Some(vote_state) = &mut room.vote_state {
                                                    if vote {
                                                        vote_state.votes_for.insert(player_id.clone());
                                                        vote_state.votes_against.remove(player_id);
                                                    } else {
                                                        vote_state.votes_against.insert(player_id.clone());
                                                        vote_state.votes_for.remove(player_id);
                                                    }

                                                    let votes_for_count = vote_state.votes_for.len();
                                                    let votes_against_count = vote_state.votes_against.len();
                                                    // Remaining players = total players - 1 (the target)
                                                    // Actually, usually the target cannot vote, or their vote doesn't count towards the majority of *others*.
                                                    // Let's say target CAN vote (to save themselves).
                                                    // Majority of ALL players? Or majority of remaining players if target is removed?
                                                    // Plan said: ">50% of remaining players".
                                                    // Let's assume target is excluded from "remaining players".
                                                    
                                                    let remaining_players = if total_players > 0 { total_players - 1 } else { 0 };
                                                    let required = (remaining_players as f32 / 2.0).floor() as usize + 1;

                                                    // Check if target voted (if we want to exclude them, we should filter them out or not let them vote)
                                                    // For simplicity, let's just count everyone but set threshold based on N-1.
                                                    // If target votes NO, it helps them.
                                                    
                                                    let update = ServerMessage::VoteUpdate {
                                                        votes_for: votes_for_count,
                                                        votes_against: votes_against_count,
                                                        required,
                                                    };
                                                    let _ = tx.send(update);

                                                    if votes_for_count >= required {
                                                        // Kick successful
                                                        let target_id = vote_state.target_player_id.clone();
                                                        
                                                        // Remove from game state
                                                        if let Some(game_state) = &mut room.game_state {
                                                            game_state.remove_player(&target_id);
                                                        }
                                                        
                                                        // Remove from room
                                                        room.remove_player(&target_id);
                                                        room.vote_state = None;

                                                        let response = ServerMessage::PlayerKicked { player_id: target_id };
                                                        let _ = tx.send(response);
                                                    } else if votes_against_count > (remaining_players - required) {
                                                        // Vote failed (impossible to reach majority)
                                                        room.vote_state = None;
                                                        let response = ServerMessage::VoteFailed { reason: "Not enough votes".to_string() };
                                                        let _ = tx.send(response);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                tracing::error!("Failed to parse client message: {}", text);
                            }
                        }
                    }
                    Some(Err(e)) => {
                        tracing::error!("WebSocket receive error: {}", e);
                        break;
                    }
                    None => break, // Disconnect
                }
            }
            recv_result = async { 
                if let Some(rx) = &mut broadcast_rx {
                    rx.recv().await
                } else {
                    std::future::pending().await
                }
            } => {
                match recv_result {
                    Ok(msg) => {
                        if let Ok(json) = serde_json::to_string(&msg) {
                            let _ = sender.send(Message::Text(json)).await;
                        }
                    }
                    Err(_) => {
                        // Lagged or closed
                    }
                }
            }
        }
    }

    tracing::info!("WebSocket disconnected. Room: {:?}, Player: {:?}", current_room_code, current_player_id);
}
