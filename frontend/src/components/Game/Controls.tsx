import { useGameStore } from '../../store';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getProperty, getTile, getGroupColor } from '../../data/board';

export const Controls = () => {
    const { gameState, playerId, dice } = useGameStore();
    const { sendMessage } = useWebSocket();

    if (!gameState || !playerId) return null;

    const currentPlayer = gameState.players[gameState.current_turn];
    const isMyTurn = currentPlayer.id === playerId;
    const canRoll = isMyTurn && gameState.phase === 'Rolling';

    // Property Logic
    const currentPosition = currentPlayer.position;
    const tileInfo = getTile(currentPosition);
    const propertyInfo = getProperty(currentPosition);
    const propertyState = gameState.properties.find(p => p.id === currentPosition);

    const isOwned = propertyState?.owner_id != null;
    const isMyProperty = propertyState?.owner_id === playerId;

    const canBuy = isMyTurn && gameState.phase === 'EndTurn' && propertyInfo && !isOwned && propertyInfo.price !== undefined && currentPlayer.money >= propertyInfo.price;
    const canPayRent = isMyTurn && gameState.phase === 'EndTurn' && propertyInfo && isOwned && !isMyProperty && propertyInfo.rent !== undefined && !gameState.rent_paid;

    const canEndTurn = isMyTurn && gameState.phase === 'EndTurn';

    // Get owner name if owned
    let ownerName = null;
    if (isOwned && propertyState?.owner_id) {
        const owner = gameState.players.find(p => p.id === propertyState.owner_id);
        if (owner) ownerName = owner.name;
    }

    return (
        <div className="bg-gray-800 p-4 rounded-xl shadow-lg space-y-4">
            <h3 className="text-xl font-bold text-white">Controls</h3>

            {/* Current Tile Info */}
            {tileInfo && (
                <div className="bg-white rounded-lg overflow-hidden shadow-md max-w-xs mx-auto md:mx-0">
                    {tileInfo.group && (
                        <div className={`h-4 w-full ${getGroupColor(tileInfo.group)}`} />
                    )}
                    <div className="p-3 text-gray-800">
                        <div className="font-bold text-lg mb-1">{tileInfo.name}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">{tileInfo.type}</div>

                        {tileInfo.price !== undefined && (
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm">Price:</span>
                                <span className="font-mono font-bold">Rp {(tileInfo.price / 1000).toFixed(0)}k</span>
                            </div>
                        )}

                        {tileInfo.rent !== undefined && (
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm">Rent:</span>
                                <span className="font-mono">Rp {(tileInfo.rent / 1000).toFixed(0)}k</span>
                            </div>
                        )}

                        {ownerName && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                                <div className="text-xs text-gray-500">Owned by:</div>
                                <div className="font-bold text-blue-600">{ownerName}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => sendMessage({ type: 'RollDice' })}
                    disabled={!canRoll}
                    className={`px-6 py-3 rounded-lg font-bold transition-colors ${canRoll
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    Roll Dice
                </button>

                {canBuy && propertyInfo && propertyInfo.price !== undefined && (
                    <button
                        onClick={() => sendMessage({ type: 'BuyProperty' })}
                        className="px-6 py-3 rounded-lg font-bold transition-colors bg-green-500 hover:bg-green-600 text-white"
                    >
                        Buy (Rp {(propertyInfo.price / 1000).toFixed(0)}k)
                    </button>
                )}

                {canPayRent && propertyInfo && propertyInfo.rent !== undefined && (
                    <button
                        onClick={() => sendMessage({ type: 'PayRent' })}
                        className="px-6 py-3 rounded-lg font-bold transition-colors bg-red-500 hover:bg-red-600 text-white"
                    >
                        Pay Rent (Rp {(propertyInfo.rent / 1000).toFixed(0)}k)
                    </button>
                )}

                <button
                    onClick={() => sendMessage({ type: 'EndTurn' })}
                    disabled={!canEndTurn}
                    className={`px-6 py-3 rounded-lg font-bold transition-colors ${canEndTurn
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    End Turn
                </button>
            </div>

            {dice && (
                <div className="text-white">
                    Last Roll: <span className="font-mono text-xl text-yellow-500">{dice[0]} + {dice[1]} = {dice[0] + dice[1]}</span>
                </div>
            )}

            <div className="text-gray-300 text-sm">
                Phase: <span className="font-bold text-white">{gameState.phase}</span>
            </div>
        </div>
    );
};
