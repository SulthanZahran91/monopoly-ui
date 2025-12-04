export type PropertyGroup =
    | 'Brown'
    | 'LightBlue'
    | 'Pink'
    | 'Orange'
    | 'Red'
    | 'Yellow'
    | 'Green'
    | 'DarkBlue'
    | 'Railroad'
    | 'Utility'
    | 'Special' // For GO, Jail, etc.
    | 'Tax'
    | 'Chance'
    | 'Chest';

export interface TileInfo {
    id: number;
    name: string;
    type: 'Property' | 'Corner' | 'Tax' | 'Chance' | 'Chest' | 'Railroad' | 'Utility';
    price?: number;
    rent?: number;
    group?: PropertyGroup;
}

export const TILES: TileInfo[] = [
    // Bottom Row (0-10)
    { id: 0, name: "Wisuda (GO)", type: 'Corner', group: 'Special' },
    { id: 1, name: "Matematika", type: 'Property', price: 60000, rent: 2000, group: 'Brown' },
    { id: 2, name: "BEM", type: 'Chest', group: 'Chest' },
    { id: 3, name: "Fisika", type: 'Property', price: 60000, rent: 4000, group: 'Brown' },
    { id: 4, name: "Bayar UKT", type: 'Tax', price: 200000, group: 'Tax' },
    { id: 5, name: "Stasiun UI", type: 'Railroad', price: 200000, rent: 25000, group: 'Railroad' },
    { id: 6, name: "Sastra Inggris", type: 'Property', price: 100000, rent: 6000, group: 'LightBlue' },
    { id: 7, name: "SIAK-NG", type: 'Chance', group: 'Chance' },
    { id: 8, name: "Arkeologi", type: 'Property', price: 100000, rent: 6000, group: 'LightBlue' },
    { id: 9, name: "Filsafat", type: 'Property', price: 120000, rent: 8000, group: 'LightBlue' },
    { id: 10, name: "Skorsing", type: 'Corner', group: 'Special' },

    // Left Column (11-19)
    { id: 11, name: "Ilmu Komunikasi", type: 'Property', price: 140000, rent: 10000, group: 'Pink' },
    { id: 12, name: "Perpustakaan UI", type: 'Utility', price: 150000, rent: 0, group: 'Utility' },
    { id: 13, name: "Hubungan Internasional", type: 'Property', price: 140000, rent: 10000, group: 'Pink' },
    { id: 14, name: "Sosiologi", type: 'Property', price: 160000, rent: 12000, group: 'Pink' },
    { id: 15, name: "Bikun", type: 'Railroad', price: 200000, rent: 25000, group: 'Railroad' },
    { id: 16, name: "Hukum Perdata", type: 'Property', price: 180000, rent: 14000, group: 'Orange' },
    { id: 17, name: "BEM", type: 'Chest', group: 'Chest' },
    { id: 18, name: "Hukum Pidana", type: 'Property', price: 180000, rent: 14000, group: 'Orange' },
    { id: 19, name: "Hukum Tata Negara", type: 'Property', price: 200000, rent: 16000, group: 'Orange' },

    // Top Row (20-30)
    { id: 20, name: "Pusgiwa", type: 'Corner', group: 'Special' },
    { id: 21, name: "Akuntansi", type: 'Property', price: 220000, rent: 18000, group: 'Red' },
    { id: 22, name: "SIAK-NG", type: 'Chance', group: 'Chance' },
    { id: 23, name: "Manajemen", type: 'Property', price: 220000, rent: 18000, group: 'Red' },
    { id: 24, name: "Ilmu Ekonomi", type: 'Property', price: 240000, rent: 20000, group: 'Red' },
    { id: 25, name: "Gerbang Utama", type: 'Railroad', price: 200000, rent: 25000, group: 'Railroad' },
    { id: 26, name: "Ilmu Komputer", type: 'Property', price: 260000, rent: 22000, group: 'Yellow' },
    { id: 27, name: "Sistem Informasi", type: 'Property', price: 260000, rent: 22000, group: 'Yellow' },
    { id: 28, name: "Danau UI", type: 'Utility', price: 150000, rent: 0, group: 'Utility' },
    { id: 29, name: "Teknologi Informasi", type: 'Property', price: 280000, rent: 24000, group: 'Yellow' },
    { id: 30, name: "Sanksi Akademik", type: 'Corner', group: 'Special' },

    // Right Column (31-39)
    { id: 31, name: "Teknik Sipil", type: 'Property', price: 300000, rent: 26000, group: 'Green' },
    { id: 32, name: "Teknik Elektro", type: 'Property', price: 300000, rent: 26000, group: 'Green' },
    { id: 33, name: "BEM", type: 'Chest', group: 'Chest' },
    { id: 34, name: "Teknik Mesin", type: 'Property', price: 320000, rent: 28000, group: 'Green' },
    { id: 35, name: "Balairung", type: 'Railroad', price: 200000, rent: 25000, group: 'Railroad' },
    { id: 36, name: "SIAK-NG", type: 'Chance', group: 'Chance' },
    { id: 37, name: "Kedokteran Gigi", type: 'Property', price: 350000, rent: 35000, group: 'DarkBlue' },
    { id: 38, name: "Biaya Praktikum", type: 'Tax', price: 100000, group: 'Tax' },
    { id: 39, name: "Kedokteran", type: 'Property', price: 400000, rent: 50000, group: 'DarkBlue' },
];

export const getTile = (id: number): TileInfo | undefined => {
    return TILES.find(t => t.id === id);
};

// Helper to get only buyable properties
export const getProperty = (id: number): TileInfo | undefined => {
    const tile = getTile(id);
    if (tile && (tile.type === 'Property' || tile.type === 'Railroad' || tile.type === 'Utility')) {
        return tile;
    }
    return undefined;
};

export const getGroupColor = (group: string) => {
    switch (group) {
        case 'Brown': return 'bg-yellow-900';
        case 'LightBlue': return 'bg-blue-200';
        case 'Pink': return 'bg-pink-400';
        case 'Orange': return 'bg-orange-400';
        case 'Red': return 'bg-red-500';
        case 'Yellow': return 'bg-yellow-400';
        case 'Green': return 'bg-green-500';
        case 'DarkBlue': return 'bg-blue-800';
        case 'Railroad': return 'bg-gray-800 text-white'; // Railroads are usually black/dark
        case 'Utility': return 'bg-gray-300'; // Utilities light gray
        case 'Tax': return 'bg-gray-400';
        case 'Chance': return 'bg-orange-200'; // Chance usually orange/question mark
        case 'Chest': return 'bg-blue-200'; // Community chest usually blue
        case 'Special': return 'bg-white'; // Corners
        default: return 'bg-gray-200';
    }
};
