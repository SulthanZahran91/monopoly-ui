
import React from 'react';
import { useGameStore } from '../../../store';
import { useWebSocket } from '../../../hooks/useWebSocket';

export const IncomingTradeModal: React.FC = () => {
    const { activeTrades, playerId, players, gameState } = useGameStore();
    const { sendMessage } = useWebSocket();

    // Find trades where I am the target
    const myIncomingTrades = activeTrades.filter(t => t.target_player_id === playerId);

    if (myIncomingTrades.length === 0 || !gameState) return null;

    const trade = myIncomingTrades[0]; // Show first one
    const initiator = players.find(p => p.id === trade.initiator_id);

    const getPropertyNames = (ids: number[]) => {
        return ids.map(id => gameState.properties.find(p => p.id === id)?.name).filter(Boolean).join(', ');
    };

    const handleAccept = () => {
        sendMessage({ type: 'AcceptTrade', trade_id: trade.id });
    };

    const handleReject = () => {
        sendMessage({ type: 'RejectTrade', trade_id: trade.id });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-lg w-full">
                <h2 className="text-2xl font-bold mb-4">Incoming Trade Offer</h2>
                <p className="mb-4">From: <span className="font-semibold">{initiator?.name || 'Unknown'}</span></p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                        <h3 className="font-bold text-green-800 mb-2">You Get</h3>
                        <div className="space-y-1 text-sm">
                            {trade.offer.money > 0 && <p>💰 Rp {trade.offer.money.toLocaleString()}</p>}
                            {trade.offer.property_ids.length > 0 && (
                                <div>
                                    <p className="font-semibold">Properties:</p>
                                    <p>{getPropertyNames(trade.offer.property_ids)}</p>
                                </div>
                            )}
                            {trade.offer.money === 0 && trade.offer.property_ids.length === 0 && <p className="italic">Nothing</p>}
                        </div>
                    </div>

                    <div className="bg-red-50 p-3 rounded border border-red-200">
                        <h3 className="font-bold text-red-800 mb-2">You Give</h3>
                        <div className="space-y-1 text-sm">
                            {trade.request.money > 0 && <p>💰 Rp {trade.request.money.toLocaleString()}</p>}
                            {trade.request.property_ids.length > 0 && (
                                <div>
                                    <p className="font-semibold">Properties:</p>
                                    <p>{getPropertyNames(trade.request.property_ids)}</p>
                                </div>
                            )}
                            {trade.request.money === 0 && trade.request.property_ids.length === 0 && <p className="italic">Nothing</p>}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <button
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        onClick={handleReject}
                    >
                        Reject
                    </button>
                    <button
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        onClick={handleAccept}
                    >
                        Accept Trade
                    </button>
                </div>
            </div>
        </div>
    );
};
