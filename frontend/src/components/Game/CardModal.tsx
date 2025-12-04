import React from 'react';
import { useGameStore } from '../../store';

export const CardModal: React.FC = () => {
    const { currentCard, setCurrentCard } = useGameStore();

    if (!currentCard) return null;

    const { card, is_chance } = currentCard;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`
                w-full max-w-sm rounded-xl p-8 shadow-2xl transform transition-all scale-100
                flex flex-col items-center text-center space-y-6
                ${is_chance ? 'bg-orange-100 border-4 border-orange-500' : 'bg-blue-100 border-4 border-blue-500'}
            `}>
                <div className="space-y-2">
                    <h2 className={`text-xl font-bold uppercase tracking-wider ${is_chance ? 'text-orange-700' : 'text-blue-700'}`}>
                        {is_chance ? 'SIAK-NG' : 'BEM'}
                    </h2>
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                        {card.title}
                    </h3>
                </div>

                <div className="py-4 px-6 bg-white/50 rounded-lg w-full">
                    <p className="text-lg text-gray-800 font-medium">
                        {card.description}
                    </p>
                </div>

                <button
                    onClick={() => setCurrentCard(null)}
                    className={`
                        w-full py-3 px-6 rounded-lg font-bold text-white shadow-lg
                        transform transition hover:scale-105 active:scale-95
                        ${is_chance ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'}
                    `}
                >
                    OK
                </button>
            </div>
        </div>
    );
};
