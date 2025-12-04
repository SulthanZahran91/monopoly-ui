import React, { useState } from 'react';
import { Board } from './Board';
import { Controls } from './Controls';
import { PlayerList } from './PlayerList';
import { VoteModal } from './VoteModal';
import { CardModal } from './CardModal';
import { IncomingTradeModal } from './Trade/IncomingTradeModal';
import { PropertyModal } from './PropertyModal';

export const Game: React.FC = () => {
    const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);

    return (
        <div className="flex h-screen bg-gray-100 p-4 gap-4">
            <div className="flex-grow flex flex-col gap-4">
                <Board onTileClick={(id) => setSelectedPropertyId(id)} />
                <Controls />
            </div>
            <div className="w-80 flex-shrink-0">
                <PlayerList />
            </div>
            <VoteModal />
            <CardModal />
            <IncomingTradeModal />
            <PropertyModal
                propertyId={selectedPropertyId}
                onClose={() => setSelectedPropertyId(null)}
            />
        </div>
    );
};
