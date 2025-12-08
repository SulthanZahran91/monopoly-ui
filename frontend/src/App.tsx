import { useGameStore } from './store';
import { Landing } from './components/Landing';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { WebSocketProvider } from './context/WebSocketContext';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
  const { roomCode, gameState, error } = useGameStore();

  return (
    <WebSocketProvider>
      <ConnectionStatus />
      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce z-50">
          {error}
        </div>
      )}
      {!roomCode ? <Landing /> : gameState ? <Game /> : <Lobby />}
    </WebSocketProvider>
  );
}

const ConnectionStatus = () => {
  const { isConnected } = useWebSocket();
  return (
    <div className={`fixed bottom-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${isConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
};

export default App;
