
import React, { useState } from 'react';
import { useGameStore } from '../../../store';
import { useWebSocket } from '../../../hooks/useWebSocket';
import type { TradeOffer } from '../../../types/game';

interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({ isOpen, onClose }) => {
    const { gameState, playerId, players } = useGameStore();
    const { sendMessage } = useWebSocket();

    const [targetPlayerId, setTargetPlayerId] = useState<string>('');
    const [offerMoney, setOfferMoney] = useState<number>(0);
    const [requestMoney, setRequestMoney] = useState<number>(0);
    const [offerProperties, setOfferProperties] = useState<number[]>([]);
    const [requestProperties, setRequestProperties] = useState<number[]>([]);

    if (!isOpen || !gameState || !playerId) return null;

    const currentPlayer = gameState.players.find(p => p.id === playerId);
    const targetPlayer = gameState.players.find(p => p.id === targetPlayerId);

    const myProperties = gameState.properties.filter(p => p.owner_id === playerId);
    const targetProperties = targetPlayerId
        ? gameState.properties.filter(p => p.owner_id === targetPlayerId)
        : [];

    const handlePropose = () => {
        if (!targetPlayerId) return;

        const offer: TradeOffer = {
            money: offerMoney,
            property_ids: offerProperties
        };

        const request: TradeOffer = {
            money: requestMoney,
            property_ids: requestProperties
        };

        sendMessage({
            type: 'ProposeTrade',
            target_player_id: targetPlayerId,
            offer,
            request
        });

        onClose();
    };

    const toggleOfferProperty = (id: number) => {
        setOfferProperties(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const toggleRequestProperty = (id: number) => {
        setRequestProperties(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">Propose Trade</h2>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Trade With:</label>
                    <select
                        className="w-full border rounded p-2"
                        value={targetPlayerId}
                        onChange={(e) => setTargetPlayerId(e.target.value)}
                    >
                        <option value="">Select Player</option>
                        {players.filter(p => p.id !== playerId).map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {targetPlayerId && (
                    <div className="grid grid-cols-2 gap-6">
                        {/* My Offer */}
                        <div className="border p-4 rounded">
                            <h3 className="font-bold mb-2">You Offer</h3>

                            <div className="mb-4">
                                <label className="block text-sm">Money (Max: {currentPlayer?.money})</label>
                                <input
                                    type="number"
                                    className="w-full border rounded p-1"
                                    value={offerMoney}
                                    onChange={(e) => setOfferMoney(Math.min(Number(e.target.value), currentPlayer?.money || 0))}
                                    max={currentPlayer?.money}
                                />
                            </div>

                            <div>
                                <h4 className="font-semibold mb-1">Properties</h4>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {myProperties.map(prop => (
                                        <label key={prop.id} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={offerProperties.includes(prop.id)}
                                                onChange={() => toggleOfferProperty(prop.id)}
                                            />
                                            <span>{prop.name}</span>
                                        </label>
                                    ))}
                                    {myProperties.length === 0 && <p className="text-gray-500 text-sm">No properties to offer</p>}
                                </div>
                            </div>
                        </div>

                        {/* My Request */}
                        <div className="border p-4 rounded">
                            <h3 className="font-bold mb-2">You Request</h3>

                            <div className="mb-4">
                                <label className="block text-sm">Money (Max: {targetPlayer?.money})</label>
                                <input
                                    type="number"
                                    className="w-full border rounded p-1"
                                    value={requestMoney}
                                    onChange={(e) => setRequestMoney(Math.min(Number(e.target.value), targetPlayer?.money || 0))}
                                    max={targetPlayer?.money}
                                />
                            </div>

                            <div>
                                <h4 className="font-semibold mb-1">Properties</h4>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {targetProperties.map(prop => (
                                        <label key={prop.id} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={requestProperties.includes(prop.id)}
                                                onChange={() => toggleRequestProperty(prop.id)}
                                            />
                                            <span>{prop.name}</span>
                                        </label>
                                    ))}
                                    {targetProperties.length === 0 && <p className="text-gray-500 text-sm">Target has no properties</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        onClick={handlePropose}
                        disabled={!targetPlayerId || (offerMoney === 0 && requestMoney === 0 && offerProperties.length === 0 && requestProperties.length === 0)}
                    >
                        Propose Trade
                    </button>
                </div>
            </div>
        </div>
    );
};
