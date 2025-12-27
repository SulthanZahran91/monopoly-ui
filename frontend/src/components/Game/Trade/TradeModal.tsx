
import React, { useState } from 'react';
import { useGameStore } from '../../../store';
import { useWebSocket } from '../../../hooks/useWebSocket';

interface TradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({ isOpen, onClose }) => {
    const { gameState: state, playerId } = useGameStore();
    const { proposeTrade } = useWebSocket();

    const [targetPlayerId, setTargetPlayerId] = useState<string>('');
    const [offerMoney, setOfferMoney] = useState<number>(0);
    const [offerProperties, setOfferProperties] = useState<number[]>([]);
    const [requestMoney, setRequestMoney] = useState<number>(0);
    const [requestProperties, setRequestProperties] = useState<number[]>([]);

    // Reset state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setTargetPlayerId('');
            setOfferMoney(0);
            setOfferProperties([]);
            setRequestMoney(0);
            setRequestProperties([]);
        }
    }, [isOpen]);

    if (!isOpen || !state) return null;

    const otherPlayers = state.players.filter(p => p.id !== playerId);
    const myPlayer = state.players.find(p => p.id === playerId);
    const targetPlayer = state.players.find(p => p.id === targetPlayerId);

    const myProperties = state.properties.filter(p => p.owner_id === playerId);
    const targetProperties = targetPlayer
        ? state.properties.filter(p => p.owner_id === targetPlayerId)
        : [];

    const handlePropose = () => {
        if (!targetPlayerId) return;

        proposeTrade(targetPlayerId, {
            money: offerMoney,
            propertyIds: offerProperties
        }, {
            money: requestMoney,
            propertyIds: requestProperties
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
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">Propose Trade</h2>

                {/* Select Player */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trade with:</label>
                    <select
                        className="w-full p-2 border rounded"
                        value={targetPlayerId}
                        onChange={(e) => setTargetPlayerId(e.target.value)}
                    >
                        <option value="">Select a player</option>
                        {otherPlayers.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {targetPlayerId && (
                    <div className="grid grid-cols-2 gap-6">
                        {/* My Offer */}
                        <div className="border p-4 rounded">
                            <h3 className="font-bold mb-2 text-green-600">You Give</h3>

                            <div className="mb-4">
                                <label className="block text-sm text-gray-600">Money</label>
                                <input
                                    id="trade-offer-money"
                                    type="number"
                                    className="w-full p-1 border rounded"
                                    value={offerMoney}
                                    onChange={(e) => setOfferMoney(Number(e.target.value))}
                                    max={myPlayer?.money || 0}
                                />
                                <div className="text-xs text-gray-500">Max: Rp {myPlayer?.money.toLocaleString()}</div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Properties</label>
                                <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                                    {myProperties.map(p => (
                                        <div key={p.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={offerProperties.includes(p.id)}
                                                onChange={() => toggleOfferProperty(p.id)}
                                                className="mr-2"
                                            />
                                            <span className="text-sm">{p.name}</span>
                                        </div>
                                    ))}
                                    {myProperties.length === 0 && <div className="text-sm text-gray-400">No properties</div>}
                                </div>
                            </div>
                        </div>

                        {/* Their Offer */}
                        <div className="border p-4 rounded">
                            <h3 className="font-bold mb-2 text-blue-600">You Get</h3>

                            <div className="mb-4">
                                <label className="block text-sm text-gray-600">Money</label>
                                <input
                                    id="trade-request-money"
                                    type="number"
                                    className="w-full p-1 border rounded"
                                    value={requestMoney}
                                    onChange={(e) => setRequestMoney(Number(e.target.value))}
                                    max={targetPlayer?.money || 0}
                                />
                                <div className="text-xs text-gray-500">Max: Rp {targetPlayer?.money.toLocaleString()}</div>
                            </div>

                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Properties</label>
                                <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1">
                                    {targetProperties.map(p => (
                                        <div key={p.id} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={requestProperties.includes(p.id)}
                                                onChange={() => toggleRequestProperty(p.id)}
                                                className="mr-2"
                                            />
                                            <span className="text-sm">{p.name}</span>
                                        </div>
                                    ))}
                                    {targetProperties.length === 0 && <div className="text-sm text-gray-400">No properties</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end mt-6 gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePropose}
                        disabled={!targetPlayerId || (offerMoney === 0 && requestMoney === 0 && offerProperties.length === 0 && requestProperties.length === 0)}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        Propose Trade
                    </button>
                </div>
            </div>
        </div>
    );
};
