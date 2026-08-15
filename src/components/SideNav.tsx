import { NavLink } from 'react-router-dom';
import { Home, Dumbbell, UtensilsCrossed, Activity, Scale, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/workout', label: 'Workout', icon: Dumbbell },
  { to: '/food', label: 'Food', icon: UtensilsCrossed },
  { to: '/cardio', label: 'Cardio', icon: Activity },
  { to: '/bodyweight', label: 'Body Weight', icon: Scale },
];

export function SideNav() {
  return (
    <nav aria-label="Primary" className="hidden md:flex md:flex-col md:w-56 md:shrink-0 md:border-r hairline md:py-8 md:px-4">
      <div className="px-2 mb-8">
        <span className="font-display text-2xl text-ink-900">Elite</span>
        <div className="plate-caption text-[10px] text-ink-500 mt-0.5">Training Record</div>
      </div>
      <ul className="space-y-1 flex-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2 py-2 text-sm rounded-[2px] transition-colors ${
                  isActive ? 'text-vermilion-700 bg-vermilion-300/10' : 'text-ink-700 hover:text-ink-900 hover:bg-paper-300'
                }`
              }
            >
              <Icon size={18} strokeWidth={1.75} />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `flex items-center gap-3 px-2 py-2 text-sm rounded-[2px] transition-colors ${
            isActive ? 'text-vermilion-700 bg-vermilion-300/10' : 'text-ink-700 hover:text-ink-900 hover:bg-paper-300'
          }`
        }
      >
        <Settings size={18} strokeWidth={1.75} />
        Settings
      </NavLink>
    </nav>
  );
}
