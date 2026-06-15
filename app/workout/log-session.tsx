import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import MuscleMap from '../../components/MuscleMap';
import ConfettiBanner from '../../components/ConfettiBanner';
import { createSession, getSessionWithSets, clearSessionSets, addSet as dbAddSet, saveSessionWithSets, getExercisePR, addCustomExercise } from '../../db/workoutDb';
import { getCustomExercises } from '../../db/workoutDb';
import { EXERCISES, Exercise, searchExercises } from '../../constants/exercises';
import { MUSCLES } from '../../constants/muscles';
import { useWorkoutData } from '../../hooks/useWorkoutData';

interface SessionSet {
  id?: number;
  setNumber: number;
  reps: string;
  weightKg: string;
  rpe: string;
}

interface SessionExercise {
  exerciseId: string;
  exerciseName: string;
  primaryMuscles: string[];
  sets: SessionSet[];
}

export default function LogSessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const existingSessionId = sessionId ? parseInt(sessionId, 10) : null;
  const today = format(new Date(), 'yyyy-MM-dd');
  const { todayVolume, refreshTodayVolume } = useWorkoutData();

  const [exercises, setExercises] = useState<SessionExercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  // Load existing session
  useEffect(() => {
    async function load() {
      if (existingSessionId) {
        const session = await getSessionWithSets(existingSessionId);
        if (session) {
          setNotes(session.notes || '');
          // Group sets by exercise
          const grouped: Record<string, SessionExercise> = {};
          for (const set of session.sets) {
            const ex = EXERCISES.find((e) => e.id === set.exercise_id);
            if (!grouped[set.exercise_id]) {
              grouped[set.exercise_id] = {
                exerciseId: set.exercise_id,
                exerciseName: ex?.name || set.exercise_id,
                primaryMuscles: ex?.primaryMuscles || [],
                sets: [],
              };
            }
            grouped[set.exercise_id].sets.push({
              id: set.id,
              setNumber: set.set_number,
              reps: String(set.reps),
              weightKg: String(set.weight_kg),
              rpe: set.rpe ? String(set.rpe) : '',
            });
          }
          setExercises(Object.values(grouped));
        }
      }
      setLoading(false);
    }
    load();
  }, [existingSessionId]);

  // Search exercises
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const results = searchExercises(searchQuery);
    setSearchResults(results.slice(0, 10));
  }, [searchQuery]);

  // Calculate live volume for muscle map
  const liveVolume = useCallback(() => {
    const volume: Record<string, number> = {};
    for (const ex of exercises) {
      const exercise = EXERCISES.find((e) => e.id === ex.exerciseId);
      if (!exercise) continue;
      const muscles = [...exercise.primaryMuscles, ...exercise.secondaryMuscles];
      for (const set of ex.sets) {
        const reps = parseInt(set.reps) || 0;
        const weight = parseFloat(set.weightKg) || 0;
        const setVolume = reps * weight;
        for (const muscle of muscles) {
          volume[muscle] = (volume[muscle] || 0) + setVolume;
        }
      }
    }
    return volume;
  }, [exercises]);

  const addExercise = (exercise: Exercise) => {
    setExercises((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        primaryMuscles: exercise.primaryMuscles,
        sets: [],
      },
    ]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const addSet = (exerciseIndex: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const ex = updated[exerciseIndex];
      const lastSet = ex.sets[ex.sets.length - 1];
      ex.sets = [
        ...ex.sets,
        {
          setNumber: ex.sets.length + 1,
          reps: lastSet ? lastSet.reps : '10',
          weightKg: lastSet ? lastSet.weightKg : '50',
          rpe: lastSet ? lastSet.rpe : '',
        },
      ];
      return updated;
    });
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: keyof SessionSet, value: string) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex].sets[setIndex] = {
        ...updated[exerciseIndex].sets[setIndex],
        [field]: value,
      };
      return updated;
    });
  };

  const deleteSet = (exerciseIndex: number, setIndex: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex].sets.splice(setIndex, 1);
      // Renumber sets
      updated[exerciseIndex].sets.forEach((set, i) => {
        set.setNumber = i + 1;
      });
      return updated;
    });
  };

  const deleteExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const [prBanner, setPrBanner] = useState<{ visible: boolean; exerciseName: string; type: 'weight' | 'volume'; value: number } | null>(null);
  const [customExerciseModal, setCustomExerciseModal] = useState(false);
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [customExerciseCategory, setCustomExerciseCategory] = useState<'strength' | 'bodyweight' | 'machine' | 'cable'>('strength');
  const [customPrimaryMuscles, setCustomPrimaryMuscles] = useState<string[]>([]);
  const [customSecondaryMuscles, setCustomSecondaryMuscles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const saveSession = async () => {
    // Validation
    const validExercises = exercises.filter((ex) => ex.sets.length > 0);
    if (validExercises.length === 0) {
      Alert.alert('Empty Session', 'Add at least one exercise with sets');
      return;
    }

    // Validate all sets
    for (const ex of validExercises) {
      for (const set of ex.sets) {
        const reps = parseInt(set.reps);
        const weight = parseFloat(set.weightKg);
        if (isNaN(reps) || reps <= 0 || reps > 100) {
          Alert.alert('Invalid Input', `Invalid reps in ${ex.exerciseName} set ${set.setNumber}`);
          return;
        }
        if (isNaN(weight) || weight < 0 || weight > 1000) {
          Alert.alert('Invalid Input', `Invalid weight in ${ex.exerciseName} set ${set.setNumber}`);
          return;
        }
        if (set.rpe && (parseInt(set.rpe) < 1 || parseInt(set.rpe) > 10)) {
          Alert.alert('Invalid Input', `RPE must be 1-10 in ${ex.exerciseName}`);
          return;
        }
      }
    }

    const exerciseData = validExercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      sets: ex.sets.map((set) => ({
        reps: parseInt(set.reps) || 0,
        weightKg: parseFloat(set.weightKg) || 0,
        rpe: set.rpe ? parseInt(set.rpe) : undefined,
      })),
    }));

    setSaving(true);
    try {
      if (existingSessionId) {
        await clearSessionSets(existingSessionId);
        for (const exercise of exerciseData) {
          for (let i = 0; i < exercise.sets.length; i++) {
            const set = exercise.sets[i];
            await dbAddSet(existingSessionId, exercise.exerciseId, i + 1, set.reps, set.weightKg, set.rpe);
          }
        }
      } else {
        await saveSessionWithSets(today, exerciseData, notes);
      }

      // Check for PRs
      for (const exercise of exerciseData) {
        const pr = await getExercisePR(exercise.exerciseId);
        const maxWeight = Math.max(...exercise.sets.map((s) => s.weightKg));
        const maxVolume = Math.max(...exercise.sets.map((s) => s.weightKg * s.reps));
        const exerciseName = EXERCISES.find((e) => e.id === exercise.exerciseId)?.name || exercise.exerciseId;

        if (maxWeight > pr.maxWeight) {
          setPrBanner({ visible: true, exerciseName, type: 'weight', value: maxWeight });
        } else if (maxVolume > pr.maxVolume) {
          setPrBanner({ visible: true, exerciseName, type: 'volume', value: maxVolume });
        }
      }

      await refreshTodayVolume(today);
      router.back();
    } catch (e) {
      console.error('Failed to save session:', e);
      Alert.alert('Error', 'Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCustomExercise = async () => {
    if (!customExerciseName.trim()) {
      Alert.alert('Invalid', 'Exercise name is required');
      return;
    }
    if (customPrimaryMuscles.length === 0) {
      Alert.alert('Invalid', 'Select at least one primary muscle');
      return;
    }

    const id = `custom_${Date.now()}`;
    try {
      await addCustomExercise(id, customExerciseName.trim(), customPrimaryMuscles, customSecondaryMuscles, customExerciseCategory);
      const newExercise: Exercise = {
        id,
        name: customExerciseName.trim(),
        primaryMuscles: customPrimaryMuscles,
        secondaryMuscles: customSecondaryMuscles,
        category: customExerciseCategory,
      };
      setExercises((prev) => [
        ...prev,
        {
          exerciseId: newExercise.id,
          exerciseName: newExercise.name,
          primaryMuscles: newExercise.primaryMuscles,
          sets: [],
        },
      ]);
      setCustomExerciseModal(false);
      setCustomExerciseName('');
      setCustomPrimaryMuscles([]);
      setCustomSecondaryMuscles([]);
    } catch (e) {
      console.error('Failed to create custom exercise:', e);
      Alert.alert('Error', 'Failed to create custom exercise');
    }
  };

  const currentVolume = liveVolume();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</Text>

        {/* Live Muscle Map */}
        <View style={styles.heatmapContainer}>
          <MuscleMap muscleVolumes={currentVolume} size={200} />
        </View>

        {/* Exercise Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exercises..."
              placeholderTextColor="#555"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                <Ionicons name="close-circle" size={18} color="#888" />
              </TouchableOpacity>
            )}
          </View>

          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              {searchResults.map((ex) => (
                <TouchableOpacity key={ex.id} style={styles.resultItem} onPress={() => addExercise(ex)}>
                  <Text style={styles.resultName}>{ex.name}</Text>
                  <View style={styles.resultTags}>
                    {ex.primaryMuscles.slice(0, 3).map((m) => (
                      <View key={m} style={styles.muscleTag}>
                        <Text style={styles.muscleTagText}>{MUSCLES[m]?.displayName || m}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TouchableOpacity style={styles.customExerciseBtn} onPress={() => setCustomExerciseModal(true)}>
            <Ionicons name="add-circle" size={16} color="#1E64FF" />
            <Text style={styles.customExerciseText}>Create Custom Exercise</Text>
          </TouchableOpacity>
        </View>

        {/* Exercise Cards */}
        {exercises.map((ex, exIndex) => (
          <View key={ex.exerciseId} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View>
                <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
                <View style={styles.exerciseTags}>
                  {ex.primaryMuscles.slice(0, 3).map((m) => (
                    <View key={m} style={styles.muscleTag}>
                      <Text style={styles.muscleTagText}>{MUSCLES[m]?.displayName || m}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <TouchableOpacity onPress={() => deleteExercise(exIndex)}>
                <Ionicons name="trash-outline" size={20} color="#ff4444" />
              </TouchableOpacity>
            </View>

            {/* Sets Header */}
            <View style={styles.setsHeader}>
              <Text style={styles.headerCell}>Set</Text>
              <Text style={styles.headerCell}>Weight</Text>
              <Text style={styles.headerCell}>Reps</Text>
              <Text style={styles.headerCell}>RPE</Text>
              <Text style={styles.headerCell} />
            </View>

            {/* Set Rows */}
            {ex.sets.map((set, setIndex) => (
              <View key={setIndex} style={styles.setRow}>
                <Text style={styles.setCell}>{set.setNumber}</Text>
                <TextInput
                  style={styles.inputCell}
                  value={set.weightKg}
                  onChangeText={(v) => updateSet(exIndex, setIndex, 'weightKg', v)}
                  keyboardType="decimal-pad"
                  placeholder="kg"
                  placeholderTextColor="#555"
                />
                <TextInput
                  style={styles.inputCell}
                  value={set.reps}
                  onChangeText={(v) => updateSet(exIndex, setIndex, 'reps', v)}
                  keyboardType="number-pad"
                  placeholder="reps"
                  placeholderTextColor="#555"
                />
                <TextInput
                  style={styles.inputCell}
                  value={set.rpe}
                  onChangeText={(v) => updateSet(exIndex, setIndex, 'rpe', v)}
                  keyboardType="number-pad"
                  placeholder="RPE"
                  placeholderTextColor="#555"
                />
                <TouchableOpacity onPress={() => deleteSet(exIndex, setIndex)}>
                  <Ionicons name="remove-circle" size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(exIndex)}>
              <Ionicons name="add" size={18} color="#1E64FF" />
              <Text style={styles.addSetText}>Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Workout notes..."
            placeholderTextColor="#555"
            multiline
            numberOfLines={2}
          />
        </View>
      </ScrollView>

      {/* Floating Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={saveSession} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Done</Text>
        )}
      </TouchableOpacity>

      {/* PR Banner */}
      {prBanner && (
        <ConfettiBanner
          visible={prBanner.visible}
          exerciseName={prBanner.exerciseName}
          type={prBanner.type}
          value={prBanner.value}
          onDismiss={() => setPrBanner(null)}
        />
      )}

      {/* Custom Exercise Modal */}
      <Modal visible={customExerciseModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Custom Exercise</Text>
              <TouchableOpacity onPress={() => setCustomExerciseModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={customExerciseName}
              onChangeText={setCustomExerciseName}
              placeholder="Exercise name..."
              placeholderTextColor="#555"
              autoFocus
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {(['strength', 'bodyweight', 'machine', 'cable'] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryButton, customExerciseCategory === cat && styles.categoryButtonActive]}
                  onPress={() => setCustomExerciseCategory(cat)}
                >
                  <Text style={[styles.categoryText, customExerciseCategory === cat && styles.categoryTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Primary Muscles</Text>
            <View style={styles.muscleGrid}>
              {Object.keys(MUSCLES).map((muscle) => (
                <TouchableOpacity
                  key={muscle}
                  style={[
                    styles.muscleChip,
                    customPrimaryMuscles.includes(muscle) && styles.muscleChipActive,
                  ]}
                  onPress={() => {
                    setCustomPrimaryMuscles((prev) =>
                      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
                    );
                  }}
                >
                  <Text style={[styles.muscleChipText, customPrimaryMuscles.includes(muscle) && styles.muscleChipTextActive]}>
                    {MUSCLES[muscle]?.displayName || muscle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Secondary Muscles (optional)</Text>
            <View style={styles.muscleGrid}>
              {Object.keys(MUSCLES).map((muscle) => (
                <TouchableOpacity
                  key={muscle}
                  style={[
                    styles.muscleChip,
                    customSecondaryMuscles.includes(muscle) && styles.muscleChipSecondary,
                  ]}
                  onPress={() => {
                    setCustomSecondaryMuscles((prev) =>
                      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
                    );
                  }}
                >
                  <Text style={[styles.muscleChipText, customSecondaryMuscles.includes(muscle) && styles.muscleChipTextActive]}>
                    {MUSCLES[muscle]?.displayName || muscle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.createButton} onPress={handleCreateCustomExercise}>
              <Text style={styles.createButtonText}>Create Exercise</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  date: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  heatmapContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  searchResults: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 250,
  },
  resultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  resultName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultTags: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  muscleTag: {
    backgroundColor: '#1E64FF22',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  muscleTagText: {
    color: '#1E64FF',
    fontSize: 11,
  },
  exerciseCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  exerciseTags: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  setsHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
    marginBottom: 8,
  },
  headerCell: {
    color: '#888',
    fontSize: 12,
    flex: 1,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  setCell: {
    color: '#888',
    fontSize: 14,
    width: 30,
    textAlign: 'center',
  },
  inputCell: {
    flex: 1,
    backgroundColor: '#2a2a3e',
    borderRadius: 6,
    padding: 8,
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
  },
  addSetText: {
    color: '#1E64FF',
    fontSize: 14,
    fontWeight: '600',
  },
  notesSection: {
    marginBottom: 20,
  },
  notesLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    minHeight: 60,
  },
  saveButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1E64FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  customExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
  },
  customExerciseText: {
    color: '#1E64FF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#1E64FF',
  },
  categoryText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#fff',
  },
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  muscleChip: {
    backgroundColor: '#2a2a3e',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  muscleChipActive: {
    backgroundColor: '#1E64FF',
  },
  muscleChipSecondary: {
    backgroundColor: '#FFAB00',
  },
  muscleChipText: {
    color: '#888',
    fontSize: 12,
  },
  muscleChipTextActive: {
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#1E64FF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
