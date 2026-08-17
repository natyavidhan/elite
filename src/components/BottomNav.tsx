import { NavLink } from 'react-router-dom';
import { Home, Dumbbell, UtensilsCrossed, Activity, Scale, Sparkles } from 'lucide-react';
import { useCoachAvailability } from '@/hooks/useCoachAvailability';

const BASE_NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/workout', label: 'Workout', icon: Dumbbell },
  { to: '/food', label: 'Food', icon: UtensilsCrossed },
  { to: '/cardio', label: 'Cardio', icon: Activity },
  { to: '/bodyweight', label: 'Weight', icon: Scale },
];

export function BottomNav() {
  const coachAvailable = useCoachAvailability() === 'available';
  const NAV_ITEMS = coachAvailable ? [...BASE_NAV_ITEMS, { to: '/coach', label: 'Coach', icon: Sparkles }] : BASE_NAV_ITEMS;

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-30 bg-paper-100 border-t hairline md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] plate-caption tracking-normal transition-colors ${
                  isActive ? 'text-gold-700' : 'text-ink-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.25 : 1.75} />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
