import { useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export const Landing = () => {
    const [name, setName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const { sendMessage, isConnected } = useWebSocket();

    const handleCreate = () => {
        if (!name) return alert('Please enter your name');
        sendMessage({ type: 'CreateRoom', player_name: name });
    };

    const handleJoin = () => {
        if (!name) return alert('Please enter your name');
        if (!roomCode) return alert('Please enter a room code');
        sendMessage({ type: 'JoinRoom', room_code: roomCode, player_name: name });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <h1 className="text-4xl font-bold mb-8 text-yellow-500">Keliling UI</h1>

            <div className="w-full max-w-md space-y-6 bg-gray-800 p-8 rounded-xl shadow-lg">
                <div>
                    <label className="block text-sm font-medium mb-2">Your Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none"
                        placeholder="Enter your name..."
                    />
                </div>

                <div className="space-y-4">
                    <button
                        onClick={handleCreate}
                        disabled={!isConnected}
                        className={`w-full py-3 font-bold rounded-lg transition-colors ${isConnected ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                    >
                        {isConnected ? 'Create New Room' : 'Connecting...'}
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-gray-800 text-gray-400">Or join existing</span>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <input
                            type="text"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            className="flex-1 px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="ROOM CODE"
                        />
                        <button
                            onClick={handleJoin}
                            disabled={!isConnected}
                            className={`px-6 py-2 font-bold rounded-lg transition-colors ${isConnected ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                        >
                            Join
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
