import { useEffect, useState } from 'react';
import { useGameStore } from '../../store';

interface MoneyFloatingTextProps {
    playerId: string;
}

export const MoneyFloatingText = ({ playerId }: MoneyFloatingTextProps) => {
    const { moneyAnimations, removeMoneyAnimation } = useGameStore();
    const animations = moneyAnimations.filter(a => a.playerId === playerId);

    return (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
            {animations.map((anim) => (
                <FloatingItem
                    key={anim.id}
                    amount={anim.amount}
                    onComplete={() => removeMoneyAnimation(anim.id)}
                />
            ))}
        </div>
    );
};

const FloatingItem = ({ amount, onComplete }: { amount: number; onComplete: () => void }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            onComplete();
        }, 2000); // Animation duration
        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!visible) return null;

    const isPositive = amount > 0;
    const text = `${isPositive ? '+' : ''}Rp ${(Math.abs(amount) / 1000).toFixed(0)}k`;
    const colorClass = isPositive ? 'text-green-400' : 'text-red-400';

    return (
        <div className={`absolute top-[-20px] left-1/2 transform -translate-x-1/2 font-bold text-lg ${colorClass} animate-float-up shadow-sm`}>
            {text}
        </div>
    );
};
