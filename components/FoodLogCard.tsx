import { View, Text, StyleSheet } from 'react-native';

interface FoodLogCardProps {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
}

export default function FoodLogCard({ name, calories, protein, carbs, fat, quantity }: FoodLogCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.calories}>{calories} kcal</Text>
      <View style={styles.macros}>
        <Text style={styles.macro}>P {protein}g</Text>
        <Text style={styles.macro}>C {carbs}g</Text>
        <Text style={styles.macro}>F {fat}g</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  calories: { color: '#1E64FF', fontSize: 14, marginTop: 4 },
  macros: { flexDirection: 'row', gap: 12, marginTop: 4 },
  macro: { color: '#888', fontSize: 12 },
});
