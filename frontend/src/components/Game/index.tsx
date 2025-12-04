import { Board } from './Board';
import { Controls } from './Controls';
import { PlayerList } from './PlayerList';
import { VoteModal } from './VoteModal';

export const Game = () => {
    return (
        <div className="flex h-screen bg-gray-900 p-4 gap-4">
            <div className="flex-1 flex justify-center items-center">
                <Board />
            </div>
            <div className="w-96 flex flex-col gap-4">
                <PlayerList />
                <Controls />
            </div>
            <VoteModal />
        </div>
    );
};
