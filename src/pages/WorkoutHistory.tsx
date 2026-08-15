import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { SparkLine } from '@/components/SparkLine';
import {
  getAllSessionsHistory,
  getSessionDetail,
  getExercisePRs,
  getExerciseWeightTrend,
  type SessionSummary,
  type SessionExerciseDetail,
  type ExercisePR,
} from '@/db/workoutDb';
import { muscleDisplayName } from '@/constants/muscles';
import { findExerciseById } from '@/constants/exercises';

export function WorkoutHistory() {
  const [tab, setTab] = useState<'history' | 'records'>('history');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-ink-900">History</h1>
        <div className="flex gap-1 mt-3 text-xs">
          {(['history', 'records'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`plate-caption px-3 py-1.5 border-b-2 transition-colors ${
                tab === t ? 'text-vermilion-700 border-vermilion-600' : 'text-ink-500 border-transparent hover:text-ink-700'
              }`}
            >
              {t === 'history' ? 'Sessions' : 'Records'}
            </button>
          ))}
        </div>
      </div>
      {tab === 'history' ? <SessionList /> : <RecordsList />}
    </div>
  );
}

function SessionList() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [detail, setDetail] = useState<SessionExerciseDetail[]>([]);

  useEffect(() => {
    getAllSessionsHistory().then(setSessions);
  }, []);

  async function toggle(sessionId: number) {
    if (expanded === sessionId) {
      setExpanded(null);
      return;
    }
    setExpanded(sessionId);
    setDetail(await getSessionDetail(sessionId));
  }

  if (sessions.length === 0) {
    return <p className="text-sm text-ink-500 py-8 text-center">No sessions logged yet.</p>;
  }

  return (
    <div className="bg-paper-100 border border-paper-400 shadow-plate rounded-[2px] divide-y divide-paper-400">
      {sessions.map(({ session, exerciseCount, setCount, totalVolume }) => (
        <div key={session.id}>
          <button
            onClick={() => toggle(session.id!)}
            className="w-full flex items-center justify-between px-4 py-3 sm:px-6 text-left hover:bg-paper-300/50 transition-colors"
          >
            <div>
              <div className="text-sm text-ink-900">{format(parseISO(session.date), 'EEEE, MMM d')}</div>
              <div className="font-data text-xs text-ink-500">
                {exerciseCount} exercises · {setCount} sets · {Math.round(totalVolume).toLocaleString()} kg·reps
              </div>
            </div>
            <ChevronDown size={16} className={`text-ink-500 transition-transform ${expanded === session.id ? 'rotate-180' : ''}`} />
          </button>
          {expanded === session.id && (
            <div className="px-4 pb-4 sm:px-6 space-y-3">
              {detail.map((d) => (
                <div key={d.exerciseId}>
                  <div className="text-sm text-ink-900">{d.exerciseName}</div>
                  <div className="font-data text-xs text-ink-500">{d.sets.map((s) => `${s.weightKg}kg×${s.reps}`).join('  ·  ')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RecordsList() {
  const [prs, setPrs] = useState<ExercisePR[]>([]);
  const [trends, setTrends] = useState<Record<string, number[]>>({});

  useEffect(() => {
    getExercisePRs().then(async (list) => {
      setPrs(list);
      const entries = await Promise.all(
        list.map(async (pr) => [pr.exerciseId, (await getExerciseWeightTrend(pr.exerciseId, 10)).map((t) => t.weightKg)] as const),
      );
      setTrends(Object.fromEntries(entries));
    });
  }, []);

  if (prs.length === 0) {
    return <p className="text-sm text-ink-500 py-8 text-center">Log a few sessions to start tracking records.</p>;
  }

  return (
    <div className="bg-paper-100 border border-paper-400 shadow-plate rounded-[2px] divide-y divide-paper-400">
      {prs.map((pr) => {
        const exercise = findExerciseById(pr.exerciseId);
        return (
          <div key={pr.exerciseId} className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div>
              <div className="text-sm text-ink-900">{exercise?.name ?? pr.exerciseId}</div>
              <div className="plate-caption text-[10px] text-ink-500 mt-0.5">
                {exercise?.primaryMuscles.map(muscleDisplayName).join(' · ')}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SparkLine values={trends[pr.exerciseId] ?? []} />
              <div className="text-right">
                <div className="font-data text-sm text-vermilion-700">{pr.bestWeightKg} kg</div>
                <div className="font-data text-xs text-ink-500">{Math.round(pr.bestVolume).toLocaleString()} vol</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
