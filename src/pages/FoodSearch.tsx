import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, ChevronLeft } from 'lucide-react';

// @zxing/browser is only needed once scanning actually starts.
const BarcodeScanner = lazy(() => import('@/components/BarcodeScanner').then((m) => ({ default: m.BarcodeScanner })));
import { Button } from '@/components/ui/Button';
import { today } from '@/db/schema';
import type { FoodItem, MealType } from '@/db/schema';
import { searchLocalFoodItems, upsertFoodItem, logFood } from '@/db/foodDb';
import { lookupBarcode, searchUsda } from '@/utils/nutritionApi';

export function FoodSearch() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const mealType = (params.get('meal') as MealType) ?? 'snack';

  const [query, setQuery] = useState('');
  const [localResults, setLocalResults] = useState<FoodItem[]>([]);
  const [remoteResults, setRemoteResults] = useState<FoodItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FoodItem | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setLocalResults([]);
      setRemoteResults([]);
      return;
    }
    searchLocalFoodItems(q).then(setLocalResults);
    setSearching(true);
    const t = setTimeout(() => {
      searchUsda(q)
        .then(setRemoteResults)
        .finally(() => setSearching(false));
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const combined = useMemo(() => {
    const localNames = new Set(localResults.map((r) => r.name.toLowerCase()));
    return [...localResults, ...remoteResults.filter((r) => !localNames.has(r.name.toLowerCase()))];
  }, [localResults, remoteResults]);

  async function handleBarcodeDetected(code: string) {
    setScanning(false);
    const product = await lookupBarcode(code);
    if (!product) {
      setScanError('No product found for that barcode.');
      return;
    }
    setSelected(product);
  }

  if (selected) {
    return <QuantitySheet item={selected} mealType={mealType} onBack={() => setSelected(null)} onLogged={() => navigate('/food')} />;
  }

  return (
    <div className="space-y-4">
      {scanning && (
        <Suspense fallback={null}>
          <BarcodeScanner onDetected={handleBarcodeDetected} onClose={() => setScanning(false)} />
        </Suspense>
      )}

      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
        <ChevronLeft size={16} /> Back
      </button>

      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl sm:text-3xl text-ink-900 capitalize">Add to {mealType}</h1>
        <Link to="/food/dishes" className="text-xs text-ink-500 hover:text-gold-600 underline underline-offset-4">
          My Dishes
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods…"
          className="flex-1 bg-transparent border-b border-ink-900/25 focus:border-gold-600 py-2 text-sm focus:outline-none placeholder:text-ink-300"
        />
        <button
          onClick={() => {
            setScanError(null);
            setScanning(true);
          }}
          aria-label="Scan barcode"
          className="text-ink-700 hover:text-gold-600 p-2 border border-ink-900/25 rounded-[2px]"
        >
          <Camera size={18} />
        </button>
      </div>

      {scanError && <p className="text-xs text-gold-700">{scanError}</p>}
      {searching && <p className="text-xs text-ink-500">Searching…</p>}

      <div className="divide-y divide-paper-400 border-t border-b hairline">
        {combined.map((item, i) => (
          <button
            key={item.externalId ?? i}
            onClick={() => setSelected(item)}
            className="w-full flex items-center justify-between py-3 text-left hover:bg-paper-300/40 transition-colors px-1"
          >
            <div>
              <div className="text-sm text-ink-900">{item.name}</div>
              <div className="font-data text-xs text-ink-500">{Math.round(item.caloriesPer100g)} kcal / 100g</div>
            </div>
            <span className="plate-caption text-[9px] text-ink-500">{item.source}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function QuantitySheet({
  item,
  mealType,
  onBack,
  onLogged,
}: {
  item: FoodItem;
  mealType: MealType;
  onBack: () => void;
  onLogged: () => void;
}) {
  const [grams, setGrams] = useState(String(item.defaultServingG ?? 100));
  const g = parseFloat(grams) || 0;
  const factor = g / 100;

  async function handleLog() {
    if (g <= 0) return;
    const id = await upsertFoodItem(item);
    await logFood({ date: today(), foodItemId: id, mealType, quantityG: g });
    onLogged();
  }

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
        <ChevronLeft size={16} /> Back to search
      </button>

      <div>
        <h1 className="font-display text-2xl text-ink-900">{item.name}</h1>
        <p className="plate-caption text-[10px] text-ink-500 mt-1">{item.source}</p>
      </div>

      <label className="block">
        <span className="plate-caption text-[10px] block mb-1">Quantity (grams)</span>
        <input
          type="number"
          inputMode="decimal"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          className="font-data w-full text-2xl bg-transparent border-b border-ink-900/25 focus:border-gold-600 py-1 focus:outline-none"
          autoFocus
        />
      </label>

      <div className="bg-paper-100 border border-paper-400 rounded-[2px] divide-y divide-paper-400">
        <PreviewRow label="Calories" value={`${Math.round(item.caloriesPer100g * factor)} kcal`} />
        <PreviewRow label="Protein" value={`${Math.round(item.proteinPer100g * factor)} g`} />
        <PreviewRow label="Carbs" value={`${Math.round(item.carbsPer100g * factor)} g`} />
        <PreviewRow label="Fat" value={`${Math.round(item.fatPer100g * factor)} g`} />
      </div>

      <Button onClick={handleLog} disabled={g <= 0} className="w-full">
        Log
      </Button>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="plate-caption text-xs text-ink-500">{label}</span>
      <span className="font-data text-sm text-ink-900">{value}</span>
    </div>
  );
}
