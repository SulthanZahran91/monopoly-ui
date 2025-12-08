import React from 'react';
import { useGameStore } from '../../store';

export const GameOverModal: React.FC = () => {
    const { gameState, reset } = useGameStore();

    if (!gameState || gameState.phase !== 'GameOver') return null;

    const winner = gameState.players.find(p => p.id === gameState.winner);

    // Sort players by money for final standings
    const standings = [...gameState.players].sort((a, b) => b.money - a.money);

    const handlePlayAgain = () => {
        reset();
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl p-1 shadow-2xl max-w-md w-full">
                <div className="bg-gray-900 rounded-xl p-8 text-center">
                    <div className="text-6xl mb-4">🎓</div>
                    <h2 className="text-3xl font-black text-yellow-400 mb-2">
                        Lulus Cumlaude!
                    </h2>
                    <p className="text-xl text-white mb-6">
                        {winner?.name || 'Unknown'} wins!
                    </p>

                    <div className="bg-gray-800 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-bold text-gray-300 mb-3">Final Standings</h3>
                        <div className="space-y-2">
                            {standings.map((player, index) => (
                                <div
                                    key={player.id}
                                    className={`flex justify-between items-center p-2 rounded ${index === 0 ? 'bg-yellow-500/20 text-yellow-300' : 'text-gray-400'
                                        }`}
                                >
                                    <span>
                                        {index === 0 ? '👑' : `${index + 1}.`} {player.name}
                                    </span>
                                    <span className="font-mono">
                                        Rp {player.money.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handlePlayAgain}
                        className="w-full py-3 px-6 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-colors"
                    >
                        Play Again
                    </button>
                </div>
            </div>
        </div>
    );
};
