import React from 'react';
import { useGameStore } from '../../store';
import { useWebSocket } from '../../hooks/useWebSocket';

export const JailModal: React.FC = () => {
    const { gameState, playerId } = useGameStore();
    const { sendMessage } = useWebSocket();

    if (!gameState || !playerId) return null;

    const me = gameState.players.find(p => p.id === playerId);
    if (!me || !me.is_in_jail || gameState.current_turn !== gameState.players.findIndex(p => p.id === playerId)) {
        return null;
    }

    // If we are in Rolling phase and in jail, we show this modal instead of normal controls?
    // Or maybe this modal is always visible when it's my turn and I'm in jail.

    const hasJailCard = me.held_cards.some(c => c.effect_type === 'get_out_of_jail');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-900 border-2 border-orange-500 p-6 rounded-lg shadow-xl max-w-md w-full text-white">
                <h2 className="text-2xl font-bold mb-2 text-orange-500">You are in Skorsing!</h2>
                <p className="mb-6 text-gray-300">Choose how you want to get out:</p>

                <div className="space-y-3">
                    <button
                        onClick={() => sendMessage({ type: 'PayBail' })}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded font-bold transition-colors flex justify-between px-4"
                        disabled={me.money < 50000}
                    >
                        <span>Pay Fine</span>
                        <span>Rp 50k</span>
                    </button>

                    <button
                        onClick={() => sendMessage({ type: 'RollDice' })}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded font-bold transition-colors"
                    >
                        Roll Doubles
                    </button>

                    {hasJailCard && (
                        <button
                            onClick={() => sendMessage({ type: 'UseJailCard' })}
                            className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-3 rounded font-bold transition-colors"
                        >
                            Use "Bebas Skorsing" Card
                        </button>
                    )}
                </div>

                <div className="mt-4 text-xs text-gray-500 text-center">
                    Turns in jail: {me.jail_turns}/3
                </div>
            </div>
        </div>
    );
};
