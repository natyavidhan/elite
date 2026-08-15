import { format, parseISO } from 'date-fns';
import { Trash2 } from 'lucide-react';
import type { CardioSession } from '@/db/schema';
import { paceMinPerKm } from '@/db/cardioDb';

interface Props {
  session: CardioSession;
  onDelete: () => void;
}

export function CardioCard({ session, onDelete }: Props) {
  const pace = paceMinPerKm(session.durationSeconds, session.distanceKm);
  const minutes = Math.round(session.durationSeconds / 60);

  return (
    <div className="flex items-center justify-between py-3 group">
      <div>
        <div className="text-sm text-ink-900 capitalize">{session.activityType}</div>
        <div className="plate-caption text-[10px] text-ink-500 mt-0.5">{format(parseISO(session.date), 'EEE, MMM d')}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right font-data text-xs text-ink-500">
          <div>{minutes} min{session.distanceKm ? ` · ${session.distanceKm.toFixed(2)} km` : ''}</div>
          {pace && <div>{pace}</div>}
        </div>
        <button
          onClick={onDelete}
          aria-label="Delete session"
          className="text-ink-300 hover:text-vermilion-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity p-1"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
