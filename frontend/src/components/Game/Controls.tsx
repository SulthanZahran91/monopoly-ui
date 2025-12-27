import { useState } from 'react';
import { useGameStore } from '../../store';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getProperty, getTile, getGroupColor } from '../../data/board';
import { TradeModal } from './Trade/TradeModal';

const ROLL_DEBOUNCE_MS = 1000; // Minimum 1 second between rolls

export const Controls = () => {
    const { gameState, playerId, dice, isRolling, lastRollTime, setIsRolling, setLastRollTime } = useGameStore();
    const { sendMessage } = useWebSocket();
    const [showTradeModal, setShowTradeModal] = useState(false);

    if (!gameState || !playerId) return null;

    const currentPlayer = gameState.players[gameState.current_turn];
    const isMyTurn = currentPlayer.id === playerId;

    // Debounce check: prevent rapid clicks
    const now = Date.now();
    const canRollDebounce = (now - lastRollTime) > ROLL_DEBOUNCE_MS;

    // Combined roll check: must be my turn, in Rolling phase, not already rolling, and debounce passed
    const canRoll = isMyTurn && gameState.phase === 'Rolling' && !isRolling && canRollDebounce;

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

    const handleRollDice = () => {
        if (!canRoll) return;

        // Set rolling state and update timestamp
        setIsRolling(true);
        setLastRollTime(Date.now());
        sendMessage({ type: 'RollDice' });
    };

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
                {currentPlayer.is_in_jail && isMyTurn ? (
                    <>
                        <div className="w-full bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg text-center">
                            <div className="font-bold text-lg mb-1">You are in Skorsing!</div>
                            <div className="text-sm">Please use the options in the modal to get out.</div>
                        </div>
                    </>
                ) : (
                    <>
                        <button
                            onClick={handleRollDice}
                            disabled={!canRoll}
                            className={`px-6 py-3 rounded-lg font-bold transition-colors flex items-center gap-2 ${canRoll
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isRolling ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Rolling...
                                </>
                            ) : (
                                'Roll Dice'
                            )}
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

                        <button
                            onClick={() => setShowTradeModal(true)}
                            className="px-6 py-3 rounded-lg font-bold transition-colors bg-purple-500 hover:bg-purple-600 text-white"
                        >
                            Trade
                        </button>
                    </>
                )}
            </div>

            {
                dice && (
                    <div className="text-white">
                        Last Roll: <span className="font-mono text-xl text-yellow-500">{dice[0]} + {dice[1]} = {dice[0] + dice[1]}</span>
                    </div>
                )
            }

            <div className="text-gray-300 text-sm">
                Phase: <span className="font-bold text-white">{gameState.phase}</span>
            </div>

            <TradeModal isOpen={showTradeModal} onClose={() => setShowTradeModal(false)} />
        </div >
    );
};
