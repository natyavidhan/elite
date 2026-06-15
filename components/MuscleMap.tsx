import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import MuscleMapFront from './MuscleMapFront';
import MuscleMapBack from './MuscleMapBack';
import { MUSCLES } from '../constants/muscles';
import { getExercisesByMuscle } from '../constants/exercises';

interface MuscleMapProps {
  muscleVolumes: Record<string, number>;
  size?: number;
}

export default function MuscleMap({ muscleVolumes, size = 250 }: MuscleMapProps) {
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const muscleDef = selectedMuscle ? MUSCLES[selectedMuscle] : null;
  const exercises = selectedMuscle ? getExercisesByMuscle(selectedMuscle) : [];

  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, side === 'front' && styles.toggleActive]}
          onPress={() => setSide('front')}
        >
          <Text style={[styles.toggleText, side === 'front' && styles.toggleTextActive]}>Front</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, side === 'back' && styles.toggleActive]}
          onPress={() => setSide('back')}
        >
          <Text style={[styles.toggleText, side === 'back' && styles.toggleTextActive]}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        {side === 'front' ? (
          <MuscleMapFront
            muscleVolumes={muscleVolumes}
            onMusclePress={setSelectedMuscle}
            size={size}
          />
        ) : (
          <MuscleMapBack
            muscleVolumes={muscleVolumes}
            onMusclePress={setSelectedMuscle}
            size={size}
          />
        )}
      </View>

      {/* Bottom sheet / modal for tapped muscle */}
      <Modal
        visible={!!selectedMuscle}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMuscle(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {muscleDef?.displayName || selectedMuscle}
              </Text>
              <TouchableOpacity onPress={() => setSelectedMuscle(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.volumeText}>
              Volume: {Math.round(muscleVolumes[selectedMuscle!] || 0)} kg·reps
            </Text>

            <Text style={styles.sectionTitle}>Exercises:</Text>
            <ScrollView style={styles.exerciseList}>
              {exercises.map((ex) => (
                <View key={ex.id} style={styles.exerciseItem}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <Text style={styles.exerciseMuscles}>
                    {ex.primaryMuscles.map((m) => MUSCLES[m]?.displayName || m).join(', ')}
                  </Text>
                </View>
              ))}
              {exercises.length === 0 && (
                <Text style={styles.emptyText}>No exercises for this muscle group</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    padding: 4,
  },
  toggleBtn: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleActive: {
    backgroundColor: '#1E64FF',
  },
  toggleText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#fff',
  },
  mapContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalClose: {
    color: '#888',
    fontSize: 24,
    padding: 4,
  },
  volumeText: {
    color: '#1E64FF',
    fontSize: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  exerciseList: {
    maxHeight: 300,
  },
  exerciseItem: {
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  exerciseName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseMuscles: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  emptyText: {
    color: '#555',
    textAlign: 'center',
    padding: 20,
  },
});
