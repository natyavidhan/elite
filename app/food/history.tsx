import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { format, subDays, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { getFoodLogsForDate, getDailyTotals, FoodLogWithItem } from '../../db/foodDb';

export default function FoodHistoryScreen() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [logs, setLogs] = useState<FoodLogWithItem[]>([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Generate last 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = subDays(new Date(), i);
    return format(d, 'yyyy-MM-dd');
  });

  const loadDate = useCallback(async (date: string) => {
    try {
      const [dailyLogs, dailyTotals] = await Promise.all([
        getFoodLogsForDate(date),
        getDailyTotals(date),
      ]);
      setLogs(dailyLogs);
      setTotals(dailyTotals);
    } catch (e) {
      console.error('Failed to load food history:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDate(selectedDate);
    }, [selectedDate, loadDate])
  );

  const dateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return format(date, 'EEE, MMM d');
  };

  return (
    <View style={styles.container}>
      {/* Date Selector */}
      <FlatList
        data={dates}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateList}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.dateChip, selectedDate === item && styles.dateChipActive]}
            onPress={() => setSelectedDate(item)}
          >
            <Text style={[styles.dateChipText, selectedDate === item && styles.dateChipTextActive]}>
              {dateLabel(item)}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Daily Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Daily Totals</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{Math.round(totals.calories)}</Text>
            <Text style={styles.summaryLabel}>kcal</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{Math.round(totals.protein)}g</Text>
            <Text style={styles.summaryLabel}>Protein</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{Math.round(totals.carbs)}g</Text>
            <Text style={styles.summaryLabel}>Carbs</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{Math.round(totals.fat)}g</Text>
            <Text style={styles.summaryLabel}>Fat</Text>
          </View>
        </View>
      </View>

      {/* Food Log List */}
      <FlatList
        data={logs}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.logList}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No food logged for this day</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.logItem}>
            <View style={styles.logInfo}>
              <Text style={styles.logName}>{item.name}</Text>
              <Text style={styles.logDetail}>
                {Math.round(item.quantity_g)}g · {item.meal_type}
              </Text>
              <Text style={styles.logMacros}>
                P {Math.round(item.protein)}g · C {Math.round(item.carbs)}g · F {Math.round(item.fat)}g
              </Text>
            </View>
            <View style={styles.logCalories}>
              <Text style={styles.logCalValue}>{Math.round(item.calories)}</Text>
              <Text style={styles.logCalLabel}>kcal</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  dateList: {
    padding: 16,
    gap: 8,
  },
  dateChip: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  dateChipActive: {
    backgroundColor: '#1E64FF',
  },
  dateChipText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  dateChipTextActive: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginTop: 0,
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  logList: {
    padding: 16,
    paddingTop: 0,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  logInfo: {
    flex: 1,
  },
  logName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  logDetail: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  logMacros: {
    color: '#555',
    fontSize: 12,
    marginTop: 2,
  },
  logCalories: {
    alignItems: 'center',
  },
  logCalValue: {
    color: '#1E64FF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logCalLabel: {
    color: '#888',
    fontSize: 11,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyText: {
    color: '#555',
    fontSize: 16,
    marginTop: 12,
  },
});
