import { useEffect, useState } from 'react';
import { InsightCard } from '@/components/InsightCard';
import { getWorkoutVolumeTrend, getCalorieTrend, getCardioDistanceTrend } from '@/db/insightsDb';
import { getBodyWeightLogsInRange } from '@/db/bodyweightDb';
import { getSettings } from '@/db/settingsDb';
import { formatWeight } from '@/utils/unitConversion';

const TREND_DAYS = 14;

export default function HomeInsights() {
  const [volumeData, setVolumeData] = useState<{ date: string; value: number }[]>([]);
  const [calorieData, setCalorieData] = useState<{ date: string; value: number }[]>([]);
  const [cardioData, setCardioData] = useState<{ date: string; value: number }[]>([]);
  const [weightData, setWeightData] = useState<{ date: string; value: number }[]>([]);
  const [calorieGoal, setCalorieGoal] = useState(2200);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');

  useEffect(() => {
    getWorkoutVolumeTrend(TREND_DAYS).then(setVolumeData);
    getCalorieTrend(TREND_DAYS).then(setCalorieData);
    getCardioDistanceTrend(TREND_DAYS).then(setCardioData);
    getBodyWeightLogsInRange('1m').then((logs) =>
      setWeightData(logs.map((l) => ({ date: l.date, value: l.weightKg }))),
    );
    getSettings().then((s) => {
      setCalorieGoal(s.dailyCalorieGoal);
      setWeightUnit(s.bodyweightUnit);
    });
  }, []);

  const todayVolume = volumeData[volumeData.length - 1]?.value ?? 0;
  const todayCalories = calorieData[calorieData.length - 1]?.value ?? 0;
  const todayCardio = cardioData[cardioData.length - 1]?.value ?? 0;
  const latestWeight = weightData[weightData.length - 1];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <InsightCard
        label="Workout Volume"
        todayValue={todayVolume > 0 ? Math.round(todayVolume).toLocaleString() : '—'}
        todayDetail="kg·reps today"
        data={volumeData}
        unit=" kg·reps"
      />
      <InsightCard
        label="Calories"
        todayValue={todayCalories > 0 ? Math.round(todayCalories).toLocaleString() : '—'}
        todayDetail={`of ${calorieGoal.toLocaleString()} goal`}
        data={calorieData}
        unit=" kcal"
      />
      <InsightCard
        label="Cardio"
        todayValue={todayCardio > 0 ? `${todayCardio.toFixed(1)} km` : '—'}
        todayDetail="today"
        data={cardioData}
        unit=" km"
      />
      <InsightCard
        label="Body Weight"
        todayValue={latestWeight ? formatWeight(latestWeight.value, weightUnit) : '—'}
        todayDetail={latestWeight ? `as of ${latestWeight.date}` : 'not logged yet'}
        data={weightData}
        chartType="line"
        unit={` ${weightUnit}`}
      />
    </div>
  );
}
