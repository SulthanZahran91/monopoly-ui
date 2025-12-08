import React from 'react';
import { useGameStore } from '../../store';
import { useWebSocket } from '../../hooks/useWebSocket';
import { getTile } from '../../data/board';

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
    const tileInfo = getTile(propertyId);
    const propertyPrice = tileInfo?.price || 0;

    const handleBuyBuilding = () => {
        sendMessage({ type: 'BuyBuilding', property_id: propertyId });
    };

    const handleSellBuilding = () => {
        sendMessage({ type: 'SellBuilding', property_id: propertyId });
    };

    const handleMortgage = () => {
        sendMessage({ type: 'MortgageProperty', property_id: propertyId });
    };

    const handleUnmortgage = () => {
        sendMessage({ type: 'UnmortgageProperty', property_id: propertyId });
    };

    const mortgageValue = Math.floor(propertyPrice / 2);
    const unmortgageCost = Math.floor(propertyPrice * 0.55); // 50% + 10% = 55% of original

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{propertyState.name}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                {propertyState.is_mortgaged && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 text-center">
                        ⚠️ Cuti Akademik (Mortgaged)
                    </div>
                )}

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

                    {isOwner && !propertyState.is_mortgaged && (
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

                    {isOwner && (
                        <div className="pt-4 border-t">
                            {propertyState.is_mortgaged ? (
                                <button
                                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                                    onClick={handleUnmortgage}
                                >
                                    Aktif Kembali (Unmortgage) - Pay Rp {unmortgageCost.toLocaleString('id-ID')}
                                </button>
                            ) : (
                                <button
                                    className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleMortgage}
                                    disabled={propertyState.houses > 0}
                                    title={propertyState.houses > 0 ? 'Sell all buildings first' : ''}
                                >
                                    Cuti Akademik (Mortgage) - Get Rp {mortgageValue.toLocaleString('id-ID')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
