import { useGameStore } from '../../store';
import { getTile, getGroupColor } from '../../data/board';
import { MoneyFloatingText } from './MoneyFloatingText';

const TILES = Array.from({ length: 40 }, (_, i) => ({ id: i }));

interface BoardProps {
    onTileClick?: (tileId: number) => void;
}

export const Board: React.FC<BoardProps> = ({ onTileClick }) => {
    const { gameState } = useGameStore();

    if (!gameState) return null;

    // Helper to get tile position
    const getTilePosition = (index: number): React.CSSProperties => {
        // Board is 11x11 grid
        // 0 is bottom-right (11, 11)
        // 10 is bottom-left (11, 1)
        // 20 is top-left (1, 1)
        // 30 is top-right (1, 11)

        let row = 1;
        let col = 1;

        if (index >= 0 && index <= 10) {
            // Bottom row: 10 -> 0 (Left to Right? No, Monopoly starts Bottom-Right and goes Left)
            // 0 is GO (Bottom-Right). 10 is Jail (Bottom-Left).
            // So 0 is at (11, 11). 1 is (11, 10)... 10 is (11, 1).
            row = 11;
            col = 11 - index;
        } else if (index >= 11 && index <= 20) {
            // Left column: 11 -> 20 (Bottom to Top)
            // 11 is (10, 1). 20 is (1, 1).
            col = 1;
            row = 11 - (index - 10);
        } else if (index >= 21 && index <= 30) {
            // Top row: 21 -> 30 (Left to Right)
            // 21 is (1, 2). 30 is (1, 11).
            row = 1;
            col = 1 + (index - 20);
        } else if (index >= 31 && index <= 39) {
            // Right column: 31 -> 39 (Top to Bottom)
            // 31 is (2, 11). 39 is (10, 11).
            col = 11;
            row = 1 + (index - 30);
        }

        return {
            gridRow: row,
            gridColumn: col,
        };
    };

    return (
        <div className="grid grid-cols-11 grid-rows-11 gap-1 p-4 bg-green-800 rounded-xl overflow-hidden relative" style={{ aspectRatio: '1/1', maxHeight: '90vh' }}>
            {/* Center Logo/Area */}
            <div className="col-start-2 col-end-11 row-start-2 row-end-11 bg-green-700 flex items-center justify-center rounded-lg opacity-50 pointer-events-none">
                <div className="text-6xl font-black text-green-900 tracking-widest rotate-45 select-none">
                    KELILING UI
                </div>
            </div>

            {TILES.map((tile) => {
                const tileInfo = getTile(tile.id);
                const propertyState = gameState?.properties.find(p => p.id === tileInfo?.id);
                const owner = propertyState?.owner_id ? gameState.players.find(p => p.id === propertyState.owner_id) : null;

                const style = getTilePosition(tile.id);

                return (
                    <div
                        key={tile.id}
                        className="bg-white text-xs relative border border-gray-300 flex flex-col justify-between overflow-hidden shadow-sm transition-transform hover:z-10 hover:scale-105 cursor-pointer"
                        style={style}
                        onClick={() => onTileClick?.(tile.id)}
                    >
                        {/* Property Group Color Strip and Owner/Building Indicator */}
                        {tileInfo?.type === 'Property' && tileInfo.group && (
                            <div className="absolute top-0 left-0 right-0 h-4" style={{ backgroundColor: getGroupColor(tileInfo.group) }}>
                                {/* Owner Indicator */}
                                {owner && (
                                    <div
                                        className="absolute top-0 right-0 w-4 h-4 border-2 border-white rounded-full shadow-sm z-10"
                                        style={{ backgroundColor: owner.color }}
                                        title={`Owned by ${owner.name}`}
                                    />
                                )}

                                {/* Buildings */}
                                {propertyState && propertyState.houses > 0 && (
                                    <div className="absolute top-0 left-0 right-0 flex justify-center space-x-0.5 -mt-1">
                                        {propertyState.houses === 5 ? (
                                            <span className="text-xs" title="Fakultas (Hotel)">🏫</span>
                                        ) : (
                                            Array.from({ length: propertyState.houses }).map((_, i) => (
                                                <span key={i} className="text-[10px]" title="Gedung (House)">🏠</span>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mortgaged Property Overlay */}
                        {propertyState?.is_mortgaged && (
                            <div
                                className="absolute inset-0 bg-gray-500/60 flex items-center justify-center z-20 pointer-events-none"
                                title="Cuti Akademik (Mortgaged)"
                            >
                                <span
                                    className="text-[8px] font-black text-white bg-red-600 px-1 py-0.5 rotate-[-35deg] shadow-md"
                                >
                                    CUTI
                                </span>
                            </div>
                        )}
                        {/* Fallback for non-property tiles or if no owner/buildings, still show group color if applicable */}
                        {tileInfo?.type !== 'Property' && tileInfo?.group && (
                            <div className={`h-3 w-full shrink-0 ${getGroupColor(tileInfo.group)}`} />
                        )}

                        <div className="p-0.5 flex-1 flex flex-col justify-between items-center text-center">
                            <div className="font-bold text-gray-800 leading-tight text-[10px] break-words w-full">
                                {tileInfo ? tileInfo.name : tile.id}
                            </div>

                            {tileInfo?.price && (
                                <div className="text-gray-500 text-[9px]">
                                    Rp {(tileInfo.price / 1000).toFixed(0)}k
                                </div>
                            )}

                            <div className="flex flex-wrap justify-center gap-0.5 mt-auto w-full relative">
                                {gameState.players.filter(p => p.position === tile.id).map((p) => (
                                    <div key={p.id} className="relative">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full border border-black shadow-sm ring-1 ring-white"
                                            style={{ backgroundColor: p.color }}
                                            title={p.name}
                                        />
                                        {p.is_in_jail && (
                                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <span className="text-[8px] leading-none">⛓️</span>
                                            </div>
                                        )}
                                        <MoneyFloatingText playerId={p.id} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};



