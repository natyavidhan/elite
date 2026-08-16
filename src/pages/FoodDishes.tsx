import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Pencil, Plus, Trash2 } from 'lucide-react';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Plate } from '@/components/ui/Plate';
import { getCustomDishes, createCustomDish, updateCustomDish, deleteCustomDish, type DishInput } from '@/db/foodDb';
import type { FoodItem } from '@/db/schema';

export function FoodDishes() {
  const navigate = useNavigate();
  const [dishes, setDishes] = useState<FoodItem[]>([]);
  const [editing, setEditing] = useState<FoodItem | 'new' | null>(null);

  async function refresh() {
    setDishes(await getCustomDishes());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(id: number) {
    await deleteCustomDish(id);
    refresh();
  }

  if (editing) {
    return (
      <DishForm
        existing={editing === 'new' ? undefined : editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-5 max-w-lg">
      <button onClick={() => navigate('/food')} className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
        <ChevronLeft size={16} /> Back to Food
      </button>

      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-3xl text-ink-900">My Dishes</h1>
        <Button variant="secondary" onClick={() => setEditing('new')} className="text-xs px-3 py-1.5">
          <Plus size={14} /> New Dish
        </Button>
      </div>

      {dishes.length === 0 ? (
        <p className="text-sm text-ink-500 py-8 text-center">
          No custom dishes yet — add your own recipes with their macros to log them in seconds.
        </p>
      ) : (
        <Plate className="divide-y divide-paper-400">
          {dishes.map((dish) => (
            <div key={dish.id} className="flex items-center justify-between px-4 py-3 sm:px-6">
              <div>
                <div className="text-sm text-ink-900">{dish.name}</div>
                <div className="font-data text-xs text-ink-500">
                  {dish.defaultServingG ? `per ${dish.defaultServingG}g serving · ` : ''}
                  {Math.round(dish.caloriesPer100g * ((dish.defaultServingG ?? 100) / 100))} kcal
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditing(dish)} aria-label={`Edit ${dish.name}`} className="text-ink-500 hover:text-gold-600 p-1.5">
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => dish.id && handleDelete(dish.id)}
                  aria-label={`Delete ${dish.name}`}
                  className="text-ink-300 hover:text-gold-600 p-1.5"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </Plate>
      )}
    </div>
  );
}

function DishForm({ existing, onCancel, onSaved }: { existing?: FoodItem; onCancel: () => void; onSaved: () => void }) {
  const initialServing = existing?.defaultServingG ?? 100;
  const [name, setName] = useState(existing?.name ?? '');
  const [servingG, setServingG] = useState(String(initialServing));
  const [calories, setCalories] = useState(existing ? String(Math.round((existing.caloriesPer100g * initialServing) / 100)) : '');
  const [protein, setProtein] = useState(existing ? String(Math.round((existing.proteinPer100g * initialServing) / 100)) : '');
  const [carbs, setCarbs] = useState(existing ? String(Math.round((existing.carbsPer100g * initialServing) / 100)) : '');
  const [fat, setFat] = useState(existing ? String(Math.round((existing.fatPer100g * initialServing) / 100)) : '');

  const canSave = name.trim().length > 0 && parseFloat(servingG) > 0 && parseFloat(calories) >= 0;

  async function handleSave() {
    if (!canSave) return;
    const input: DishInput = {
      name: name.trim(),
      servingG: parseFloat(servingG),
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
    };
    if (existing?.id) await updateCustomDish(existing.id, input);
    else await createCustomDish(input);
    onSaved();
  }

  return (
    <div className="space-y-5 max-w-md">
      <button onClick={onCancel} className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900">
        <ChevronLeft size={16} /> Cancel
      </button>

      <h1 className="font-display text-2xl text-ink-900">{existing ? 'Edit Dish' : 'New Dish'}</h1>

      <Field label="Dish Name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grandma's Dal" autoFocus />
      <Field label="Serving Size (g)" type="number" inputMode="decimal" value={servingG} onChange={(e) => setServingG(e.target.value)} />

      <p className="plate-caption text-[10px] text-ink-500 -mb-2">Macros per serving</p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Calories (kcal)" type="number" inputMode="decimal" value={calories} onChange={(e) => setCalories(e.target.value)} />
        <Field label="Protein (g)" type="number" inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} />
        <Field label="Carbs (g)" type="number" inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
        <Field label="Fat (g)" type="number" inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} />
      </div>

      <Button onClick={handleSave} disabled={!canSave} className="w-full">
        Save Dish
      </Button>
    </div>
  );
}
