import React, { useState } from 'react';
import { Board } from './Board';
import { Controls } from './Controls';
import { PlayerList } from './PlayerList';
import { VoteModal } from './VoteModal';
import { CardModal } from './CardModal';
import { IncomingTradeModal } from './Trade/IncomingTradeModal';
import { JailModal } from './JailModal';
import { CardNotification } from './CardNotification';
import { PropertyModal } from './PropertyModal';
import { GameOverModal } from './GameOverModal';

export const Game: React.FC = () => {
    const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100 p-4 gap-4 overflow-auto">
            <div className="flex-1 flex flex-col gap-4">
                <div className="flex justify-center">
                    <Board onTileClick={(id) => setSelectedPropertyId(id)} />
                </div>
                <Controls />
            </div>
            <div className="w-full lg:w-80 flex-shrink-0">
                <PlayerList />
            </div>
            <VoteModal />
            <JailModal />
            <CardNotification />
            <CardModal />
            <IncomingTradeModal />
            <PropertyModal
                propertyId={selectedPropertyId}
                onClose={() => setSelectedPropertyId(null)}
            />
            <GameOverModal />
        </div>
    );
};
