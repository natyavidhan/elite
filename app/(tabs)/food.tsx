import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { getFoodLogsForDate, getDailyTotals, FoodLogWithItem, deleteFoodLog } from '../../db/foodDb';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export default function FoodScreen() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [logs, setLogs] = useState<FoodLogWithItem[]>([]);
  const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [goals] = useState({ calories: 2500, protein: 180, carbs: 250, fat: 80 });

  const loadData = useCallback(async () => {
    try {
      const [dailyLogs, dailyTotals] = await Promise.all([
        getFoodLogsForDate(today),
        getDailyTotals(today),
      ]);
      setLogs(dailyLogs);
      setTotals(dailyTotals);
    } catch (e) {
      console.error('Failed to load food data:', e);
    }
  }, [today]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDelete = async (logId: number) => {
    try {
      await deleteFoodLog(logId);
      await loadData();
    } catch (e) {
      console.error('Failed to delete food log:', e);
    }
  };

  const mealLogs = (mealType: string) => logs.filter((l) => l.meal_type === mealType);

  const MacroBar = ({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) => {
    const pct = Math.min((value / goal) * 100, 100);
    return (
      <View style={styles.macroBar}>
        <View style={styles.macroHeader}>
          <Text style={styles.macroLabel}>{label}</Text>
          <Text style={styles.macroValue}>
            {Math.round(value)} / {goal}g
          </Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Daily Summary Header */}
      <View style={styles.summaryCard}>
        <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        <View style={styles.calorieRow}>
          <Text style={styles.calorieValue}>{Math.round(totals.calories)}</Text>
          <Text style={styles.calorieLabel}> / {goals.calories} kcal</Text>
        </View>

        <MacroBar label="Protein" value={totals.protein} goal={goals.protein} color="#1E64FF" />
        <MacroBar label="Carbs" value={totals.carbs} goal={goals.carbs} color="#00C853" />
        <MacroBar label="Fat" value={totals.fat} goal={goals.fat} color="#FFAB00" />
      </View>

      {/* Meal Sections */}
      {MEAL_TYPES.map((mealType) => {
        const items = mealLogs(mealType);
        const mealCalories = items.reduce((sum, item) => sum + item.calories, 0);

        return (
          <View key={mealType} style={styles.mealSection}>
            <View style={styles.mealHeader}>
              <View style={styles.mealTitleRow}>
                <Ionicons
                  name={
                    mealType === 'breakfast'
                      ? 'sunny'
                      : mealType === 'lunch'
                        ? 'sunny'
                        : mealType === 'dinner'
                          ? 'moon'
                          : 'cafe'
                  }
                  size={18}
                  color="#1E64FF"
                />
                <Text style={styles.mealTitle}>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</Text>
              </View>
              <View style={styles.mealHeaderRight}>
                <Text style={styles.mealCalories}>{Math.round(mealCalories)} kcal</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() =>
                    router.push({
                      pathname: '/food/search',
                      params: { mealType },
                    })
                  }
                >
                  <Ionicons name="add" size={18} color="#1E64FF" />
                </TouchableOpacity>
              </View>
            </View>

            {items.length === 0 ? (
              <Text style={styles.emptyMeal}>Tap + to add food</Text>
            ) : (
              items.map((item) => (
                <View key={item.id} style={styles.foodItem}>
                  <View style={styles.foodInfo}>
                    <Text style={styles.foodName}>{item.name}</Text>
                    <Text style={styles.foodDetail}>
                      {Math.round(item.quantity_g)}g · {Math.round(item.calories)} kcal
                    </Text>
                    <Text style={styles.foodMacros}>
                      P {Math.round(item.protein)}g · C {Math.round(item.carbs)}g · F {Math.round(item.fat)}g
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={18} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        );
      })}

      <TouchableOpacity style={styles.historyButton} onPress={() => router.push('/food/history')}>
        <Ionicons name="time" size={18} color="#1E64FF" />
        <Text style={styles.historyButtonText}>View Food History</Text>
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
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  date: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  calorieValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  calorieLabel: {
    color: '#888',
    fontSize: 16,
  },
  macroBar: {
    marginBottom: 12,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  macroLabel: {
    color: '#888',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  macroValue: {
    color: '#888',
    fontSize: 12,
  },
  barBg: {
    height: 8,
    backgroundColor: '#2a2a3e',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  mealSection: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
    paddingBottom: 12,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  mealHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealCalories: {
    color: '#888',
    fontSize: 14,
  },
  addButton: {
    padding: 4,
  },
  emptyMeal: {
    color: '#555',
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  foodDetail: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  foodMacros: {
    color: '#555',
    fontSize: 12,
    marginTop: 2,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  historyButtonText: {
    color: '#1E64FF',
    fontSize: 16,
    fontWeight: '600',
  },
});
