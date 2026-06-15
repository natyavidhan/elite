import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { getCardioSessions, getWeeklyTotals, deleteCardioSession, CardioSession } from '../../db/cardioDb';

export default function CardioScreen() {
  const [sessions, setSessions] = useState<CardioSession[]>([]);
  const [weeklyTotals, setWeeklyTotals] = useState({ totalKm: 0, totalSeconds: 0, sessionCount: 0 });

  const loadData = useCallback(async () => {
    try {
      const [cardioSessions, weekly] = await Promise.all([
        getCardioSessions(20),
        getWeeklyTotals(),
      ]);
      setSessions(cardioSessions);
      setWeeklyTotals(weekly);
    } catch (e) {
      console.error('Failed to load cardio data:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDelete = async (sessionId: number) => {
    try {
      await deleteCardioSession(sessionId);
      await loadData();
    } catch (e) {
      console.error('Failed to delete cardio session:', e);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (durationSeconds: number, distanceKm: number | null) => {
    if (!distanceKm || distanceKm === 0) return null;
    const paceSeconds = durationSeconds / distanceKm;
    const mins = Math.floor(paceSeconds / 60);
    const secs = Math.round(paceSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')} /km`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Weekly Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>This Week</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{weeklyTotals.totalKm.toFixed(1)}</Text>
            <Text style={styles.summaryLabel}>km</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{formatDuration(weeklyTotals.totalSeconds)}</Text>
            <Text style={styles.summaryLabel}>Time</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{weeklyTotals.sessionCount}</Text>
            <Text style={styles.summaryLabel}>Sessions</Text>
          </View>
        </View>
      </View>

      {/* Recent Sessions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        {sessions.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="walk-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No cardio sessions yet</Text>
            <Text style={styles.emptySubtext}>Start logging to track your progress</Text>
          </View>
        ) : (
          sessions.map((session) => {
            const date = parseISO(session.date);
            const pace = formatPace(session.duration_seconds, session.distance_km);

            return (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionDate}>{format(date, 'MMM d, yyyy')}</Text>
                    <Text style={styles.sessionDay}>{format(date, 'EEEE')}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(session.id)}>
                    <Ionicons name="trash-outline" size={18} color="#ff4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.activityBadge}>
                  <Ionicons
                    name={
                      session.activity_type === 'run'
                        ? 'walk'
                        : session.activity_type === 'walk'
                          ? 'footsteps'
                          : session.activity_type === 'cycle'
                            ? 'bicycle'
                            : session.activity_type === 'swim'
                              ? 'water'
                              : 'fitness'
                    }
                    size={16}
                    color="#1E64FF"
                  />
                  <Text style={styles.activityText}>{session.activity_type}</Text>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statValue}>{formatDuration(session.duration_seconds)}</Text>
                    <Text style={styles.statLabel}>Duration</Text>
                  </View>
                  {session.distance_km && (
                    <View style={styles.stat}>
                      <Text style={styles.statValue}>{session.distance_km.toFixed(2)} km</Text>
                      <Text style={styles.statLabel}>Distance</Text>
                    </View>
                  )}
                  {pace && (
                    <View style={styles.stat}>
                      <Text style={styles.statValue}>{pace}</Text>
                      <Text style={styles.statLabel}>Pace</Text>
                    </View>
                  )}
                  {session.calories_burned && (
                    <View style={styles.stat}>
                      <Text style={styles.statValue}>{session.calories_burned}</Text>
                      <Text style={styles.statLabel}>kcal</Text>
                    </View>
                  )}
                </View>

                {session.avg_heart_rate && (
                  <View style={styles.hrRow}>
                    <Ionicons name="heart" size={14} color="#ff4444" />
                    <Text style={styles.hrText}>{session.avg_heart_rate} bpm</Text>
                  </View>
                )}

                {session.notes && <Text style={styles.notes}>{session.notes}</Text>}
              </View>
            );
          })
        )}
      </View>

      <TouchableOpacity style={styles.logButton} onPress={() => router.push('/cardio/log-run')}>
        <Ionicons name="add-circle" size={20} color="#fff" />
        <Text style={styles.logButtonText}>Log Cardio Session</Text>
      </TouchableOpacity>
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
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    color: '#888',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionDay: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  activityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E64FF22',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  activityText: {
    color: '#1E64FF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: '#1E64FF',
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  hrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  hrText: {
    color: '#ff4444',
    fontSize: 13,
  },
  notes: {
    color: '#888',
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#555',
    fontSize: 16,
    marginTop: 12,
  },
  emptySubtext: {
    color: '#333',
    fontSize: 14,
    marginTop: 8,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E64FF',
    padding: 16,
    borderRadius: 12,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
