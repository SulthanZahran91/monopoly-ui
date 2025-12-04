import { useEffect, useState } from 'react';
import { useGameStore } from '../../store';
import { useWebSocket } from '../../hooks/useWebSocket';

export const VoteModal = () => {
    const { voteState, players, playerId } = useGameStore();
    const { sendMessage } = useWebSocket();
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        if (!voteState) return;

        const interval = setInterval(() => {
            const now = Math.floor(Date.now() / 1000);
            const remaining = Math.max(0, voteState.end_time - now);
            setTimeLeft(remaining);
        }, 1000);

        return () => clearInterval(interval);
    }, [voteState]);

    if (!voteState) return null;

    const targetPlayer = players.find(p => p.id === voteState.target_player_id);
    const initiator = players.find(p => p.id === voteState.initiator_id);

    // Check if I have already voted
    // Wait, the backend doesn't send who voted what to everyone, only counts.
    // But I should track if I voted locally? Or just let me change vote?
    // The backend uses HashSet, so multiple votes from same person just update/overwrite.
    // But wait, my backend logic:
    // if vote: insert into votes_for, remove from votes_against
    // So yes, I can change vote.

    // However, for UI, I don't know if I voted YES or NO unless I track it or backend sends it.
    // Backend sends `votes_for` count.
    // Let's just show buttons always.

    // Don't show modal to the target?
    // Plan said: "A player is kicked if >50% of remaining players vote YES."
    // Usually target sees it but can't vote or their vote doesn't matter.
    // My backend logic lets everyone vote.

    const isTarget = playerId === voteState.target_player_id;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
                    <span>Vote Kick</span>
                    <span className="text-red-400 font-mono">{timeLeft}s</span>
                </h3>

                <div className="mb-6 text-gray-300">
                    <p className="mb-2">
                        <span className="font-bold text-yellow-400">{initiator?.name || 'Unknown'}</span> wants to kick <span className="font-bold text-red-400">{targetPlayer?.name || 'Unknown'}</span>.
                    </p>
                    <p className="text-sm text-gray-400">
                        Required votes: {voteState.required}
                    </p>
                </div>

                <div className="flex justify-between items-center mb-6 bg-gray-900/50 p-4 rounded-lg">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">{voteState.votes_for}</div>
                        <div className="text-xs text-gray-500 uppercase">Yes</div>
                    </div>
                    <div className="text-gray-600 font-bold">VS</div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-500">{voteState.votes_against}</div>
                        <div className="text-xs text-gray-500 uppercase">No</div>
                    </div>
                </div>

                {!isTarget && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => sendMessage({ type: 'CastVote', vote: true })}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors"
                        >
                            Vote Yes
                        </button>
                        <button
                            onClick={() => sendMessage({ type: 'CastVote', vote: false })}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors"
                        >
                            Vote No
                        </button>
                    </div>
                )}

                {isTarget && (
                    <div className="text-center text-yellow-500 font-bold animate-pulse">
                        You are being voted off!
                    </div>
                )}
            </div>
        </div>
    );
};
