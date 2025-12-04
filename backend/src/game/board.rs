use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PropertyGroup {
    Brown,
    LightBlue,
    Pink,
    Orange,
    Red,
    Yellow,
    Green,
    DarkBlue,
    Railroad,
    Utility,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PropertyInfo {
    pub id: usize,
    pub name: &'static str,
    pub price: i32,
    pub rent: i32, // Base rent for now
    pub group: PropertyGroup,
}

pub const PROPERTIES: &[PropertyInfo] = &[
    // Brown
    PropertyInfo { id: 1, name: "Matematika", price: 60_000, rent: 2_000, group: PropertyGroup::Brown },
    PropertyInfo { id: 3, name: "Fisika", price: 60_000, rent: 4_000, group: PropertyGroup::Brown },
    
    // Railroads
    PropertyInfo { id: 5, name: "Stasiun UI", price: 200_000, rent: 25_000, group: PropertyGroup::Railroad },
    PropertyInfo { id: 15, name: "Bikun", price: 200_000, rent: 25_000, group: PropertyGroup::Railroad },
    PropertyInfo { id: 25, name: "Gerbang Utama", price: 200_000, rent: 25_000, group: PropertyGroup::Railroad },
    PropertyInfo { id: 35, name: "Balairung", price: 200_000, rent: 25_000, group: PropertyGroup::Railroad },

    // Light Blue
    PropertyInfo { id: 6, name: "Sastra Inggris", price: 100_000, rent: 6_000, group: PropertyGroup::LightBlue },
    PropertyInfo { id: 8, name: "Arkeologi", price: 100_000, rent: 6_000, group: PropertyGroup::LightBlue },
    PropertyInfo { id: 9, name: "Filsafat", price: 120_000, rent: 8_000, group: PropertyGroup::LightBlue },

    // Pink
    PropertyInfo { id: 11, name: "Ilmu Komunikasi", price: 140_000, rent: 10_000, group: PropertyGroup::Pink },
    PropertyInfo { id: 13, name: "Hubungan Internasional", price: 140_000, rent: 10_000, group: PropertyGroup::Pink },
    PropertyInfo { id: 14, name: "Sosiologi", price: 160_000, rent: 12_000, group: PropertyGroup::Pink },

    // Utilities
    PropertyInfo { id: 12, name: "Perpustakaan UI", price: 150_000, rent: 0, group: PropertyGroup::Utility }, // Special rent logic
    PropertyInfo { id: 28, name: "Danau UI", price: 150_000, rent: 0, group: PropertyGroup::Utility },

    // Orange
    PropertyInfo { id: 16, name: "Hukum Perdata", price: 180_000, rent: 14_000, group: PropertyGroup::Orange },
    PropertyInfo { id: 18, name: "Hukum Pidana", price: 180_000, rent: 14_000, group: PropertyGroup::Orange },
    PropertyInfo { id: 19, name: "Hukum Tata Negara", price: 200_000, rent: 16_000, group: PropertyGroup::Orange },

    // Red
    PropertyInfo { id: 21, name: "Akuntansi", price: 220_000, rent: 18_000, group: PropertyGroup::Red },
    PropertyInfo { id: 23, name: "Manajemen", price: 220_000, rent: 18_000, group: PropertyGroup::Red },
    PropertyInfo { id: 24, name: "Ilmu Ekonomi", price: 240_000, rent: 20_000, group: PropertyGroup::Red },

    // Yellow
    PropertyInfo { id: 26, name: "Ilmu Komputer", price: 260_000, rent: 22_000, group: PropertyGroup::Yellow },
    PropertyInfo { id: 27, name: "Sistem Informasi", price: 260_000, rent: 22_000, group: PropertyGroup::Yellow },
    PropertyInfo { id: 29, name: "Teknologi Informasi", price: 280_000, rent: 24_000, group: PropertyGroup::Yellow },

    // Green
    PropertyInfo { id: 31, name: "Teknik Sipil", price: 300_000, rent: 26_000, group: PropertyGroup::Green },
    PropertyInfo { id: 32, name: "Teknik Elektro", price: 300_000, rent: 26_000, group: PropertyGroup::Green },
    PropertyInfo { id: 34, name: "Teknik Mesin", price: 320_000, rent: 28_000, group: PropertyGroup::Green },

    // Dark Blue
    PropertyInfo { id: 37, name: "Kedokteran Gigi", price: 350_000, rent: 35_000, group: PropertyGroup::DarkBlue },
    PropertyInfo { id: 39, name: "Kedokteran", price: 400_000, rent: 50_000, group: PropertyGroup::DarkBlue },
];

pub fn get_property(id: usize) -> Option<&'static PropertyInfo> {
    PROPERTIES.iter().find(|p| p.id == id)
}
