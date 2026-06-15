import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import MuscleMap from '../../components/MuscleMap';
import { getSessionForDate, getSessionWithSets } from '../../db/workoutDb';
import { getDailyTotals } from '../../db/foodDb';
import { getCardioSessions } from '../../db/cardioDb';
import { getWeightStats } from '../../db/bodyweightDb';
import { getSettings, Settings } from '../../db/settingsDb';
import { useWorkoutData } from '../../hooks/useWorkoutData';
import { formatWeight } from '../../utils/unitConversion';

export default function HomeScreen() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { todayVolume, refreshTodayVolume } = useWorkoutData();

  const [settings, setSettings] = useState<Settings | null>(null);
  const [foodTotals, setFoodTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [workoutSession, setWorkoutSession] = useState<{ exercises: number; sets: number } | null>(null);
  const [cardioToday, setCardioToday] = useState<{ count: number; totalKm: number; totalSeconds: number } | null>(null);
  const [weightStats, setWeightStats] = useState<{ current: number | null; sevenDayAvg: number | null } | null>(null);

  const loadAllData = useCallback(async () => {
    try {
      const [s, food, cardio, weight] = await Promise.all([
        getSettings(),
        getDailyTotals(today),
        getCardioSessions(10),
        getWeightStats(),
      ]);
      setSettings(s);
      setFoodTotals(food);
      setWeightStats({ current: weight.current, sevenDayAvg: weight.sevenDayAvg });

      const session = await getSessionForDate(today);
      if (session) {
        const full = await getSessionWithSets(session.id);
        if (full) {
          const exerciseCount = new Set(full.sets.map((s) => s.exercise_id)).size;
          setWorkoutSession({ exercises: exerciseCount, sets: full.sets.length });
        }
      } else {
        setWorkoutSession(null);
      }

      const todayCardio = cardio.filter((c) => c.date === today);
      if (todayCardio.length > 0) {
        setCardioToday({
          count: todayCardio.length,
          totalKm: todayCardio.reduce((sum, c) => sum + (c.distance_km || 0), 0),
          totalSeconds: todayCardio.reduce((sum, c) => sum + c.duration_seconds, 0),
        });
      } else {
        setCardioToday(null);
      }

      await refreshTodayVolume(today);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    }
  }, [today, refreshTodayVolume]);

  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [loadAllData])
  );

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const weightTrend = () => {
    if (!weightStats?.current || !weightStats?.sevenDayAvg) return null;
    const diff = weightStats.current - weightStats.sevenDayAvg;
    if (Math.abs(diff) < 0.2) return 'flat';
    return diff > 0 ? 'up' : 'down';
  };

  const trend = weightTrend();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
      <Text style={styles.greeting}>{greeting()}</Text>

      {/* Muscle Map Thumbnail */}
      <View style={styles.heatmapCard}>
        <Text style={styles.sectionTitle}>Today's Muscle Heatmap</Text>
        <MuscleMap muscleVolumes={todayVolume} size={200} />
      </View>

      {/* Calories & Macros */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="restaurant" size={20} color="#1E64FF" />
          <Text style={styles.cardTitle}>Nutrition</Text>
        </View>
        <View style={styles.calorieRow}>
          <Text style={styles.calorieValue}>{Math.round(foodTotals.calories)}</Text>
          <Text style={styles.calorieLabel}> / {settings?.daily_calorie_goal ?? 2500} kcal</Text>
        </View>
        <View style={styles.macroRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{Math.round(foodTotals.protein)}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{Math.round(foodTotals.carbs)}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>{Math.round(foodTotals.fat)}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>
      </View>

      {/* Workout Summary */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="fitness" size={20} color="#1E64FF" />
          <Text style={styles.cardTitle}>Workout</Text>
        </View>
        {workoutSession ? (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{workoutSession.exercises}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{workoutSession.sets}</Text>
              <Text style={styles.statLabel}>Sets</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>No workout logged today</Text>
        )}
      </View>

      {/* Cardio Summary */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="walk" size={20} color="#1E64FF" />
          <Text style={styles.cardTitle}>Cardio</Text>
        </View>
        {cardioToday ? (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{cardioToday.count}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{cardioToday.totalKm.toFixed(1)}</Text>
              <Text style={styles.statLabel}>km</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.floor(cardioToday.totalSeconds / 60)}</Text>
              <Text style={styles.statLabel}>min</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>No cardio logged today</Text>
        )}
      </View>

      {/* Body Weight */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="body" size={20} color="#1E64FF" />
          <Text style={styles.cardTitle}>Body Weight</Text>
        </View>
        {weightStats?.current ? (
          <View style={styles.weightRow}>
            <Text style={styles.weightValue}>
              {formatWeight(weightStats.current, settings?.bodyweight_unit ?? 'kg')}
            </Text>
            {trend && (
              <Ionicons
                name={trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove'}
                size={24}
                color={trend === 'up' ? '#ff4444' : trend === 'down' ? '#00C853' : '#888'}
              />
            )}
          </View>
        ) : (
          <Text style={styles.emptyText}>No weight logged yet</Text>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickButton} onPress={() => router.push('/workout/log-session')}>
          <Ionicons name="fitness" size={24} color="#1E64FF" />
          <Text style={styles.quickButtonText}>Log Workout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => router.push('/food/search')}>
          <Ionicons name="restaurant" size={24} color="#1E64FF" />
          <Text style={styles.quickButtonText}>Log Meal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => router.push('/cardio/log-run')}>
          <Ionicons name="walk" size={24} color="#1E64FF" />
          <Text style={styles.quickButtonText}>Log Run</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickButton} onPress={() => router.push('/(tabs)/bodyweight')}>
          <Ionicons name="body" size={24} color="#1E64FF" />
          <Text style={styles.quickButtonText}>Log Weight</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  date: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  greeting: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  heatmapCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  calorieValue: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  calorieLabel: {
    color: '#888',
    fontSize: 14,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    color: '#1E64FF',
    fontSize: 18,
    fontWeight: '700',
  },
  macroLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#1E64FF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
    fontStyle: 'italic',
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  weightValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  quickButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
