import React from 'react';
import { useGameStore } from '../../store';
import { useWebSocket } from '../../hooks/useWebSocket';

// For now, I'll assume we can get property info from a constant or just display what we have in state.
// Since we don't have a shared constants file for properties yet (it's in backend), I'll create a basic version or rely on state.
// Actually, `Board.tsx` uses `TILES` and `getTile`. I should check where `getTile` comes from.
// It seems `Board.tsx` imports `TILES` from `../../constants/board`. Let's check that file.
// Wait, I can't check it right now inside this tool call.
// I'll assume I can pass the property ID to this modal.

interface PropertyModalProps {
    propertyId: number | null;
    onClose: () => void;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({ propertyId, onClose }) => {
    const { gameState, playerId } = useGameStore();
    const { sendMessage } = useWebSocket();

    if (propertyId === null || !gameState) return null;

    const propertyState = gameState.properties.find(p => p.id === propertyId);
    if (!propertyState) return null;

    const owner = propertyState.owner_id
        ? gameState.players.find(p => p.id === propertyState.owner_id)
        : null;

    const isOwner = propertyState.owner_id === playerId;

    // We need property static info (rent, group, etc).
    // Since I don't have easy access to the static data here without duplicating it or fetching it,
    // I will just display the dynamic state for now and add buttons.
    // Ideally, static data should be available on frontend too.

    const handleBuyBuilding = () => {
        sendMessage({ type: 'BuyBuilding', property_id: propertyId });
    };

    const handleSellBuilding = () => {
        sendMessage({ type: 'SellBuilding', property_id: propertyId });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{propertyState.name}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-500">Owner</p>
                        <p className="font-medium">{owner ? owner.name : 'Unowned'}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Buildings</p>
                        <div className="flex items-center space-x-2">
                            <span className="text-xl">{propertyState.houses === 5 ? '1 Hotel' : `${propertyState.houses} Houses`}</span>
                            {propertyState.houses > 0 && (
                                <div className="flex">
                                    {propertyState.houses === 5 ? '🏫' : Array(propertyState.houses).fill('🏠').join('')}
                                </div>
                            )}
                        </div>
                    </div>

                    {isOwner && (
                        <div className="flex space-x-3 pt-4 border-t">
                            <button
                                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleBuyBuilding}
                                disabled={propertyState.houses >= 5}
                            >
                                Build (+1)
                            </button>
                            <button
                                className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={handleSellBuilding}
                                disabled={propertyState.houses === 0}
                            >
                                Sell (-1)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
