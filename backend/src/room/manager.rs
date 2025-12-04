use dashmap::DashMap;
use std::sync::Arc;
use uuid::Uuid;
use crate::room::room::Room;
use crate::room::player::Player;

#[derive(Clone)]
pub struct RoomManager {
    pub rooms: Arc<DashMap<String, Room>>,
}

impl RoomManager {
    pub fn new() -> Self {
        Self {
            rooms: Arc::new(DashMap::new()),
        }
    }

    pub fn create_room(&self) -> String {
        let room_id = Uuid::new_v4().to_string()[..6].to_uppercase();
        let room = Room::new(room_id.clone());
        self.rooms.insert(room_id.clone(), room);
        room_id
    }

    pub fn join_room(&self, room_id: &str, player_name: String) -> Option<(String, Vec<Player>)> {
        if let Some(mut room) = self.rooms.get_mut(room_id) {
            let player_id = Uuid::new_v4().to_string();
            let player = Player {
                id: player_id.clone(),
                name: player_name,
            };
            room.add_player(player);
            
            let players = room.players.values().cloned().collect();
            Some((player_id, players))
        } else {
            None
        }
    }
    
    pub fn get_room_players(&self, room_id: &str) -> Option<Vec<Player>> {
        self.rooms.get(room_id).map(|room| room.players.values().cloned().collect())
    }
}
