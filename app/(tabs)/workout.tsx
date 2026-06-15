import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import MuscleMap from '../../components/MuscleMap';
import { getSessionForDate, getSessionWithSets, WorkoutSessionWithSets } from '../../db/workoutDb';
import { useWorkoutData } from '../../hooks/useWorkoutData';

export default function WorkoutScreen() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { todayVolume, refreshTodayVolume } = useWorkoutData();
  const [session, setSession] = useState<WorkoutSessionWithSets | null>(null);
  const [loading, setLoading] = useState(true);

  const loadToday = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getSessionForDate(today);
      if (s) {
        const full = await getSessionWithSets(s.id);
        setSession(full);
      } else {
        setSession(null);
      }
      await refreshTodayVolume(today);
    } catch (e) {
      console.error('Failed to load today:', e);
    } finally {
      setLoading(false);
    }
  }, [today, refreshTodayVolume]);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const totalSets = session?.sets.length ?? 0;
  const totalExercises = new Set(session?.sets.map((s) => s.exercise_id) ?? []).size;
  const totalVolume = Object.values(todayVolume).reduce((sum, v) => sum + v, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>

      <View style={styles.heatmapCard}>
        <Text style={styles.sectionTitle}>Today's Muscle Heatmap</Text>
        <MuscleMap muscleVolumes={todayVolume} size={280} />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Workout Summary</Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalExercises}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totalSets}</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{Math.round(totalVolume)}</Text>
            <Text style={styles.statLabel}>Volume</Text>
          </View>
        </View>
        {session?.notes && (
          <Text style={styles.notes}>{session.notes}</Text>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() =>
            router.push({
              pathname: '/workout/log-session',
              params: { sessionId: session?.id ?? '' },
            })
          }
        >
          <Ionicons name={session ? 'add-circle' : 'play'} size={20} color="#fff" />
          <Text style={styles.buttonText}>
            {session ? 'Continue Workout' : 'Start Workout'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/workout/history')}>
          <Ionicons name="time" size={20} color="#1E64FF" />
          <Text style={styles.secondaryButtonText}>View History</Text>
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
    paddingTop: 10,
  },
  date: {
    color: '#888',
    fontSize: 14,
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  summaryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: '#1E64FF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  notes: {
    color: '#888',
    fontSize: 14,
    marginTop: 12,
    fontStyle: 'italic',
  },
  actions: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E64FF',
    padding: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2a2a3e',
    padding: 16,
    borderRadius: 12,
  },
  secondaryButtonText: {
    color: '#1E64FF',
    fontSize: 16,
    fontWeight: '600',
  },
});
