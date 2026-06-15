import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { getAllSessions, getSessionWithSets, getExercisePR, deleteSession, WorkoutSessionWithSets } from '../../db/workoutDb';
import { EXERCISES } from '../../constants/exercises';
import SparkLine from '../../components/SparkLine';

export default function WorkoutHistoryScreen() {
  const [activeTab, setActiveTab] = useState<'history' | 'prs'>('history');
  const [sessions, setSessions] = useState<WorkoutSessionWithSets[]>([]);
  const [prs, setPrs] = useState<{ exerciseId: string; exerciseName: string; maxWeight: number; maxVolume: number }[]>([]);
  const [selectedSession, setSelectedSession] = useState<WorkoutSessionWithSets | null>(null);
  const [loading, setLoading] = useState(true);
  const [weightProgression, setWeightProgression] = useState<Record<string, number[]>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const sessionList = await getAllSessions(50);
      const sessionsWithSets = await Promise.all(
        sessionList.map(async (s) => {
          const full = await getSessionWithSets(s.id);
          return full!;
        })
      );
      setSessions(sessionsWithSets);

      // Load PRs
      const prData = await Promise.all(
        EXERCISES.map(async (ex) => {
          const pr = await getExercisePR(ex.id);
          return {
            exerciseId: ex.id,
            exerciseName: ex.name,
            maxWeight: pr.maxWeight,
            maxVolume: pr.maxVolume,
          };
        })
      );
      setPrs(prData.filter((p) => p.maxWeight > 0 || p.maxVolume > 0));

      // Load weight progression for sparklines
      const progression: Record<string, number[]> = {};
      for (const ex of EXERCISES) {
        const exSessions = sessionsWithSets
          .filter((s) => s.sets.some((set) => set.exercise_id === ex.id))
          .slice(0, 10)
          .reverse();
        
        const weights = exSessions.map((s) => {
          const sets = s.sets.filter((set) => set.exercise_id === ex.id);
          return Math.max(...sets.map((set) => set.weight_kg));
        });
        
        if (weights.length > 1) {
          progression[ex.id] = weights;
        }
      }
      setWeightProgression(progression);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDeleteSession = (sessionId: number) => {
    Alert.alert('Delete Session', 'Are you sure you want to delete this workout session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteSession(sessionId);
            await loadData();
          } catch (e) {
            console.error('Failed to delete session:', e);
          }
        },
      },
    ]);
  };

  const renderSession = ({ item }: { item: WorkoutSessionWithSets }) => {
    const date = parseISO(item.date);
    const totalSets = item.sets.length;
    const totalExercises = new Set(item.sets.map((s) => s.exercise_id)).size;
    const totalVolume = item.sets.reduce((sum, s) => sum + s.reps * s.weight_kg, 0);

    return (
      <TouchableOpacity style={styles.sessionCard} onPress={() => setSelectedSession(item)}>
        <View style={styles.sessionHeader}>
          <View>
            <Text style={styles.sessionDate}>{format(date, 'MMM d, yyyy')}</Text>
            <Text style={styles.sessionDay}>{format(date, 'EEEE')}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDeleteSession(item.id)}>
            <Ionicons name="trash-outline" size={18} color="#ff4444" />
          </TouchableOpacity>
        </View>
        <View style={styles.sessionStats}>
          <Text style={styles.stat}>{totalExercises} exercises</Text>
          <Text style={styles.stat}>{totalSets} sets</Text>
          <Text style={styles.stat}>{Math.round(totalVolume)} vol</Text>
        </View>
        {item.notes && <Text style={styles.sessionNotes}>{item.notes}</Text>}
      </TouchableOpacity>
    );
  };

  const renderSessionDetail = () => {
    if (!selectedSession) return null;
    const date = parseISO(selectedSession.date);
    const grouped: Record<string, { exerciseId: string; exerciseName: string; sets: typeof selectedSession.sets }> = {};
    for (const set of selectedSession.sets) {
      const ex = EXERCISES.find((e) => e.id === set.exercise_id);
      if (!grouped[set.exercise_id]) {
        grouped[set.exercise_id] = {
          exerciseId: set.exercise_id,
          exerciseName: ex?.name || set.exercise_id,
          sets: [],
        };
      }
      grouped[set.exercise_id].sets.push(set);
    }

    return (
      <View style={styles.detailOverlay}>
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>{format(date, 'MMMM d, yyyy')}</Text>
            <TouchableOpacity onPress={() => setSelectedSession(null)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.detailScroll}>
            {Object.values(grouped).map((ex) => (
              <View key={ex.exerciseId} style={styles.detailExercise}>
                <Text style={styles.detailExerciseName}>{ex.exerciseName}</Text>
                {ex.sets.map((set) => (
                  <View key={set.id} style={styles.detailSet}>
                    <Text style={styles.detailSetText}>
                      Set {set.set_number}: {set.weight_kg} kg x {set.reps} reps
                      {set.rpe ? ` @ RPE ${set.rpe}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
            {selectedSession.notes && (
              <Text style={styles.detailNotes}>{selectedSession.notes}</Text>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'prs' && styles.tabActive]}
          onPress={() => setActiveTab('prs')}
        >
          <Text style={[styles.tabText, activeTab === 'prs' && styles.tabTextActive]}>PRs</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'history' && (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="barbell-outline" size={48} color="#333" />
              <Text style={styles.emptyText}>No workouts yet</Text>
              <Text style={styles.emptySubtext}>Start logging to see your history here</Text>
            </View>
          }
        />
      )}

      {activeTab === 'prs' && (
        <ScrollView style={styles.listContent}>
          {prs.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="trophy-outline" size={48} color="#333" />
              <Text style={styles.emptyText}>No PRs yet</Text>
              <Text style={styles.emptySubtext}>Log some workouts to track your progress</Text>
            </View>
          )}
          {prs.map((pr) => (
            <View key={pr.exerciseId} style={styles.prCard}>
              <View style={styles.prHeader}>
                <Text style={styles.prName}>{pr.exerciseName}</Text>
                {weightProgression[pr.exerciseId] && (
                  <SparkLine data={weightProgression[pr.exerciseId]} width={80} height={30} color="#1E64FF" />
                )}
              </View>
              <View style={styles.prStats}>
                <View style={styles.prStat}>
                  <Text style={styles.prValue}>{pr.maxWeight.toFixed(1)} kg</Text>
                  <Text style={styles.prLabel}>Max Weight</Text>
                </View>
                <View style={styles.prStat}>
                  <Text style={styles.prValue}>{Math.round(pr.maxVolume)}</Text>
                  <Text style={styles.prLabel}>Max Volume</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {selectedSession && renderSessionDetail()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  tabBar: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#1E64FF',
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  sessionCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionDate: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sessionDay: {
    color: '#888',
    fontSize: 14,
  },
  sessionStats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    color: '#1E64FF',
    fontSize: 14,
  },
  sessionNotes: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },
  prCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  prHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  prName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  prStats: {
    flexDirection: 'row',
    gap: 24,
  },
  prStat: {
    alignItems: 'center',
  },
  prValue: {
    color: '#1E64FF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  prLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyText: {
    color: '#555',
    fontSize: 18,
    marginTop: 12,
  },
  emptySubtext: {
    color: '#333',
    fontSize: 14,
    marginTop: 8,
  },
  detailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  detailScroll: {
    maxHeight: 400,
  },
  detailExercise: {
    marginBottom: 16,
  },
  detailExerciseName: {
    color: '#1E64FF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  detailSet: {
    paddingVertical: 4,
  },
  detailSetText: {
    color: '#fff',
    fontSize: 14,
  },
  detailNotes: {
    color: '#888',
    fontSize: 14,
    marginTop: 12,
    fontStyle: 'italic',
  },
});
