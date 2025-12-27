
import React from 'react';
import { useGameStore } from '../../../store';
import { useWebSocket } from '../../../hooks/useWebSocket';


export const IncomingTradeModal: React.FC = () => {
    const { gameState: state, playerId, activeTrades } = useGameStore();
    const { acceptTrade, rejectTrade } = useWebSocket();

    if (!state || !playerId) return null;

    // Find the first pending trade where I am the target
    const proposal = activeTrades.find(t => t.target_player_id === playerId && t.status === 'Pending');

    if (!proposal) return null;

    const initiator = state.players.find(p => p.id === proposal.initiator_id);

    const offeredProperties = proposal.offer.property_ids.map(id =>
        state.properties.find(p => p.id === id)?.name
    ).filter(Boolean);

    const requestedProperties = proposal.request.property_ids.map(id =>
        state.properties.find(p => p.id === id)?.name
    ).filter(Boolean);

    const handleAccept = () => {
        acceptTrade(proposal.id);
    };

    const handleReject = () => {
        rejectTrade(proposal.id);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
                <h2 className="text-2xl font-bold mb-4">Trade Offer</h2>
                <p className="mb-4 text-gray-600">
                    <span className="font-bold">{initiator?.name || 'Unknown'}</span> wants to trade with you.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="border p-3 rounded bg-green-50">
                        <h3 className="font-bold text-green-700 mb-2">You Get</h3>
                        {proposal.offer.money > 0 && (
                            <div className="text-sm font-medium">Rp {proposal.offer.money.toLocaleString()}</div>
                        )}
                        {offeredProperties.map((name, i) => (
                            <div key={i} className="text-sm">{name}</div>
                        ))}
                        {proposal.offer.money === 0 && offeredProperties.length === 0 && (
                            <div className="text-sm text-gray-400 italic">Nothing</div>
                        )}
                    </div>

                    <div className="border p-3 rounded bg-red-50">
                        <h3 className="font-bold text-red-700 mb-2">You Give</h3>
                        {proposal.request.money > 0 && (
                            <div className="text-sm font-medium">Rp {proposal.request.money.toLocaleString()}</div>
                        )}
                        {requestedProperties.map((name, i) => (
                            <div key={i} className="text-sm">{name}</div>
                        ))}
                        {proposal.request.money === 0 && requestedProperties.length === 0 && (
                            <div className="text-sm text-gray-400 italic">Nothing</div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={handleReject}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                        Reject
                    </button>
                    <button
                        onClick={handleAccept}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        Accept Trade
                    </button>
                </div>
            </div>
        </div>
    );
};
