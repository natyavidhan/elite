import { View, Text, StyleSheet } from 'react-native';

interface CardioCardProps {
  activityType: string;
  durationSeconds: number;
  distanceKm: number | null;
  date: string;
}

export default function CardioCard({ activityType, durationSeconds, distanceKm, date }: CardioCardProps) {
  const minutes = Math.floor(durationSeconds / 60);
  const pace = distanceKm && distanceKm > 0
    ? `${Math.floor(durationSeconds / 60 / distanceKm)}:${String(Math.round((durationSeconds / 60 / distanceKm) % 1 * 60)).padStart(2, '0')} /km`
    : null;

  return (
    <View style={styles.card}>
      <Text style={styles.type}>{activityType}</Text>
      <Text style={styles.detail}>{minutes} min</Text>
      {distanceKm && <Text style={styles.detail}>{distanceKm.toFixed(2)} km</Text>}
      {pace && <Text style={styles.detail}>{pace}</Text>}
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
  type: { color: '#fff', fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
  detail: { color: '#888', fontSize: 14, marginTop: 4 },
});
