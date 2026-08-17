import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SideNav } from '@/components/SideNav';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';
import { InstallHint } from '@/components/InstallHint';
import { Home } from '@/pages/Home';
import { Workout } from '@/pages/Workout';
import { WorkoutLogSession } from '@/pages/WorkoutLogSession';
import { WorkoutHistory } from '@/pages/WorkoutHistory';
import { WorkoutPresets } from '@/pages/WorkoutPresets';
import { CardioPresets } from '@/pages/CardioPresets';
import { Food } from '@/pages/Food';
import { FoodSearch } from '@/pages/FoodSearch';
import { FoodHistory } from '@/pages/FoodHistory';
import { FoodDishes } from '@/pages/FoodDishes';
import { Cardio } from '@/pages/Cardio';
import { CardioLogRun } from '@/pages/CardioLogRun';
import { SettingsPage } from '@/pages/Settings';

// Recharts pulls in a meaningful chunk of its own — split it off the main bundle.
const BodyWeight = lazy(() => import('@/pages/BodyWeight').then((m) => ({ default: m.BodyWeight })));
// react-markdown + remark-gfm are only needed once the (backend-only, often
// unused) AI Coach tab is actually opened.
const Coach = lazy(() => import('@/pages/Coach').then((m) => ({ default: m.Coach })));

export default function App() {
  return (
    <div className="md:flex md:min-h-dvh">
      <SideNav />
      <div className="flex-1 min-w-0">
        <InstallHint />
        <TopBar />
        <main className="pb-20 md:pb-0 max-w-5xl mx-auto px-4 py-5 sm:px-6 sm:py-8">
          <Suspense fallback={<p className="plate-caption text-xs text-ink-500">Loading…</p>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/workout" element={<Workout />} />
              <Route path="/workout/log" element={<WorkoutLogSession />} />
              <Route path="/workout/history" element={<WorkoutHistory />} />
              <Route path="/workout/presets" element={<WorkoutPresets />} />
              <Route path="/food" element={<Food />} />
              <Route path="/food/search" element={<FoodSearch />} />
              <Route path="/food/history" element={<FoodHistory />} />
              <Route path="/food/dishes" element={<FoodDishes />} />
              <Route path="/cardio" element={<Cardio />} />
              <Route path="/cardio/log" element={<CardioLogRun />} />
            <Route path="/cardio/presets" element={<CardioPresets />} />
              <Route path="/bodyweight" element={<BodyWeight />} />
              <Route path="/coach" element={<Coach />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Suspense>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
