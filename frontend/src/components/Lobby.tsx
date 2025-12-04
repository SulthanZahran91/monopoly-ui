import { useGameStore } from '../store';
import { useWebSocket } from '../hooks/useWebSocket';

export const Lobby = () => {
    const { roomCode, players, playerId } = useGameStore();
    const { sendMessage, isConnected } = useWebSocket();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <div className="w-full max-w-2xl bg-gray-800 p-8 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
                    <h2 className="text-2xl font-bold">Lobby</h2>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">Room Code</p>
                        <p className="text-3xl font-mono font-bold text-yellow-500 tracking-wider">{roomCode}</p>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-gray-300">Players ({players.length})</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {players.map((player) => (
                            <div
                                key={player.id}
                                className={`p-4 rounded-lg flex items-center space-x-3 ${player.id === playerId ? 'bg-blue-900/50 border border-blue-500' : 'bg-gray-700'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-xl">
                                    👤
                                </div>
                                <div>
                                    <p className="font-bold">{player.name}</p>
                                    {player.id === playerId && <p className="text-xs text-blue-400">You</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-center space-y-4">
                    <div className="text-gray-500">
                        Waiting for host to start the game...
                    </div>
                    <button
                        onClick={() => sendMessage({ type: 'StartGame' })}
                        disabled={!isConnected}
                        className={`px-8 py-3 font-bold rounded-lg transition-colors shadow-lg ${isConnected ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                    >
                        Start Game
                    </button>
                </div>
            </div>
        </div>
    );
};
