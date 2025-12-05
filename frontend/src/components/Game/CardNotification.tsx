import React, { useEffect } from 'react';
import { useGameStore } from '../../store';

export const CardNotification: React.FC = () => {
    // We need a way to detect when a card is drawn.
    // The store doesn't explicitly have "last drawn card" in a way that persists for animation easily,
    // but we can listen to WebSocket messages or add it to the store.
    // For now, let's assume we can't easily hook into the WS stream here without context.
    // BUT, we can add `lastDrawnCard` to the Zustand store.
    // Let's check store.ts first.

    // Actually, I'll just make this a placeholder for now or check store.ts.
    // If I can't modify store easily right now, I might skip this or implement it later.
    // But the plan said "CardNotification".

    // Let's assume we will modify store.ts to include `lastDrawnCard`.

    const { lastDrawnCard, setLastDrawnCard } = useGameStore();

    useEffect(() => {
        if (lastDrawnCard) {
            const timer = setTimeout(() => {
                setLastDrawnCard(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [lastDrawnCard, setLastDrawnCard]);

    if (!lastDrawnCard) return null;

    const isChance = lastDrawnCard.is_chance;
    const card = lastDrawnCard.card;

    return (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-bounce-in">
            <div className={`p-6 rounded-xl shadow-2xl border-4 max-w-sm w-full text-center ${isChance ? 'bg-orange-100 border-orange-500 text-orange-900' : 'bg-blue-100 border-blue-500 text-blue-900'
                }`}>
                <div className="uppercase tracking-widest font-bold text-sm mb-2 opacity-75">
                    {isChance ? 'SIAK-NG (Chance)' : 'BEM (Community Chest)'}
                </div>
                <h3 className="text-xl font-black mb-4">{card.title}</h3>
                <p className="text-lg leading-relaxed">{card.description}</p>
            </div>
        </div>
    );
};
