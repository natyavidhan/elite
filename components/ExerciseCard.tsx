import { View, Text, StyleSheet } from 'react-native';

interface ExerciseCardProps {
  exerciseId: string;
  exerciseName: string;
  primaryMuscles: string[];
  sets: { reps: number; weightKg: number; rpe?: number }[];
}

export default function ExerciseCard({ exerciseId, exerciseName, primaryMuscles, sets }: ExerciseCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{exerciseName}</Text>
      <Text style={styles.sets}>{sets.length} sets</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sets: { color: '#888', fontSize: 14, marginTop: 4 },
});
