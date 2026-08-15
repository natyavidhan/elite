import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkle } from 'lucide-react';

const PLATE_COLORS = ['#C13A2A', '#201B15', '#F6EFDF', '#A22E20'];

export function celebratePR() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  confetti({
    particleCount: 90,
    spread: 70,
    origin: { y: 0.6 },
    colors: PLATE_COLORS,
    scalar: 0.9,
    ticks: 180,
  });
}

interface Props {
  message: string;
  trigger: number;
}

export function ConfettiBanner({ message, trigger }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;
    setVisible(true);
    celebratePR();
    const t = setTimeout(() => setVisible(false), 2600);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
    >
      <div className="bg-ink-900 text-paper-100 px-4 py-2 rounded-[2px] shadow-plate flex items-center gap-2">
        <Sparkle size={14} className="text-vermilion-400" strokeWidth={2} />
        <span className="plate-caption text-xs tracking-plate">{message}</span>
      </div>
    </div>
  );
}
