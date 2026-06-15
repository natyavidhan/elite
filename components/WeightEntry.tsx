import { View, Text, StyleSheet } from 'react-native';

interface WeightEntryProps {
  weightKg: number;
  date: string;
  bodyFatPct?: number;
  onDelete?: () => void;
}

export default function WeightEntry({ weightKg, date, bodyFatPct }: WeightEntryProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.weight}>{weightKg.toFixed(1)} kg</Text>
      <Text style={styles.date}>{date}</Text>
      {bodyFatPct && <Text style={styles.bf}>BF: {bodyFatPct}%</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weight: { color: '#fff', fontSize: 20, fontWeight: '700' },
  date: { color: '#888', fontSize: 14, flex: 1 },
  bf: { color: '#1E64FF', fontSize: 14 },
});
