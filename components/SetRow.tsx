import { View, Text, StyleSheet } from 'react-native';

interface SetRowProps {
  setNumber: number;
  reps: number;
  weightKg: number;
  rpe?: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function SetRow({ setNumber, reps, weightKg, rpe }: SetRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.setNum}>Set {setNumber}</Text>
      <Text style={styles.value}>{weightKg} kg</Text>
      <Text style={styles.value}>{reps} reps</Text>
      {rpe && <Text style={styles.value}>RPE {rpe}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    marginBottom: 6,
  },
  setNum: { color: '#888', fontSize: 14, width: 50 },
  value: { color: '#fff', fontSize: 14 },
});
