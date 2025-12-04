import { useGameStore } from '../../store';
import { useWebSocket } from '../../hooks/useWebSocket';

export const PlayerList = () => {
    const { gameState, playerId } = useGameStore();
    const { sendMessage } = useWebSocket();

    if (!gameState) return null;

    return (
        <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold text-white mb-4">Players</h3>
            <div className="space-y-2">
                {gameState.players.map((p, i) => {
                    const isMe = p.id === playerId;
                    const isCurrentTurn = gameState.current_turn === i;

                    return (
                        <div
                            key={p.id}
                            className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${isCurrentTurn
                                ? 'bg-gray-700 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                                : 'bg-gray-800 border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-4 h-4 rounded-full ring-2 ring-white shadow-sm"
                                    style={{ backgroundColor: p.color }}
                                />
                                <div>
                                    <div className="font-bold text-white flex items-center gap-2">
                                        {p.name}
                                        {isMe && <span className="text-xs bg-blue-500 px-1.5 py-0.5 rounded text-white">YOU</span>}
                                        {p.is_in_jail && <span className="text-xs bg-orange-500 px-1.5 py-0.5 rounded text-white">JAIL</span>}
                                    </div>
                                    <div className="text-green-400 font-mono text-sm">
                                        Rp {(p.money / 1000).toLocaleString()}k
                                    </div>
                                </div>
                            </div>

                            {!isMe && (
                                <button
                                    onClick={() => sendMessage({ type: 'VoteKick', target_player_id: p.id })}
                                    className="text-xs bg-red-900/50 hover:bg-red-900 text-red-200 px-2 py-1 rounded transition-colors"
                                    title="Vote to kick"
                                >
                                    Kick
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
