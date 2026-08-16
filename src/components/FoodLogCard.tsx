import { Trash2 } from 'lucide-react';
import type { FoodLogEntry } from '@/db/foodDb';

interface Props {
  entry: FoodLogEntry;
  onDelete: () => void;
}

export function FoodLogCard({ entry, onDelete }: Props) {
  return (
    <div className="flex items-center justify-between py-2 group">
      <div className="min-w-0">
        <div className="text-sm text-ink-900 truncate">{entry.item.name}</div>
        <div className="font-data text-xs text-ink-500">
          {Math.round(entry.log.quantityG)}g · {Math.round(entry.calories)} kcal · {Math.round(entry.protein)}P {Math.round(entry.carbs)}C {Math.round(entry.fat)}F
        </div>
      </div>
      <button
        onClick={onDelete}
        aria-label={`Remove ${entry.item.name}`}
        className="text-ink-300 hover:text-gold-600 p-1 shrink-0"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
