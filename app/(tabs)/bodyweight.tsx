import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { format, parseISO, subDays, isAfter, isBefore } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import {
  getAllWeights,
  upsertWeight,
  deleteWeight,
  getWeightStats,
  BodyWeightLog,
} from '../../db/bodyweightDb';

const TIME_RANGES = [
  { label: '1W', days: 7 },
  { label: '1M', days: 30 },
  { label: '3M', days: 90 },
  { label: 'All', days: null },
] as const;

export default function BodyWeightScreen() {
  const [weights, setWeights] = useState<BodyWeightLog[]>([]);
  const [stats, setStats] = useState({
    current: null as number | null,
    starting: null as number | null,
    change: null as number | null,
    sevenDayAvg: null as number | null,
  });
  const [selectedRange, setSelectedRange] = useState<string>('1M');
  const [showLogModal, setShowLogModal] = useState(false);
  const [logWeight, setLogWeight] = useState('');
  const [logBodyFat, setLogBodyFat] = useState('');
  const [logNotes, setLogNotes] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [allWeights, weightStats] = await Promise.all([
        getAllWeights(100),
        getWeightStats(),
      ]);
      setWeights(allWeights);
      setStats(weightStats);
    } catch (e) {
      console.error('Failed to load weight data:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleDelete = async (id: number) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this weight entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteWeight(id);
            await loadData();
          } catch (e) {
            console.error('Failed to delete weight entry:', e);
          }
        },
      },
    ]);
  };

  const handleLogWeight = async () => {
    const weight = parseFloat(logWeight);
    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight');
      return;
    }

    const bodyFat = logBodyFat ? parseFloat(logBodyFat) : undefined;
    if (bodyFat !== undefined && (isNaN(bodyFat) || bodyFat < 0 || bodyFat > 100)) {
      Alert.alert('Invalid Body Fat', 'Please enter a valid body fat percentage (0-100)');
      return;
    }

    try {
      await upsertWeight({
        date: format(new Date(), 'yyyy-MM-dd'),
        weightKg: weight,
        bodyFatPct: bodyFat,
        notes: logNotes || undefined,
      });
      setShowLogModal(false);
      setLogWeight('');
      setLogBodyFat('');
      setLogNotes('');
      await loadData();
    } catch (e) {
      console.error('Failed to log weight:', e);
      Alert.alert('Error', 'Failed to save weight entry');
    }
  };

  // Filter weights by selected range
  const filteredWeights = weights.filter((w) => {
    const range = TIME_RANGES.find((r) => r.label === selectedRange);
    if (!range || range.days === null) return true;

    const entryDate = parseISO(w.date);
    const cutoffDate = subDays(new Date(), range.days);
    return isAfter(entryDate, cutoffDate) || format(entryDate, 'yyyy-MM-dd') === format(cutoffDate, 'yyyy-MM-dd');
  });

  // Prepare chart data
  const chartData = filteredWeights
    .slice()
    .reverse()
    .map((w) => ({
      value: w.weight_kg,
      label: format(parseISO(w.date), 'MM/dd'),
    }));

  const todayWeight = weights.find((w) => w.date === format(new Date(), 'yyyy-MM-dd'));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Today's Entry */}
      <View style={styles.todayCard}>
        <Text style={styles.todayTitle}>Today</Text>
        {todayWeight ? (
          <View style={styles.todayContent}>
            <Text style={styles.todayWeight}>{todayWeight.weight_kg.toFixed(1)} kg</Text>
            {todayWeight.body_fat_pct && (
              <Text style={styles.todayBodyFat}>{todayWeight.body_fat_pct.toFixed(1)}% body fat</Text>
            )}
            <TouchableOpacity style={styles.editButton} onPress={() => setShowLogModal(true)}>
              <Ionicons name="create-outline" size={16} color="#1E64FF" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.logButton} onPress={() => setShowLogModal(true)}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.logButtonText}>Log Today's Weight</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Row */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Current</Text>
          <Text style={styles.statValue}>{stats.current?.toFixed(1) ?? '--'}</Text>
          <Text style={styles.statUnit}>kg</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Starting</Text>
          <Text style={styles.statValue}>{stats.starting?.toFixed(1) ?? '--'}</Text>
          <Text style={styles.statUnit}>kg</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Change</Text>
          <Text style={[styles.statValue, styles.changeValue]}>
            {stats.change !== null ? (stats.change > 0 ? '+' : '') + stats.change.toFixed(1) : '--'}
          </Text>
          <Text style={styles.statUnit}>kg</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>7-Day Avg</Text>
          <Text style={styles.statValue}>{stats.sevenDayAvg?.toFixed(1) ?? '--'}</Text>
          <Text style={styles.statUnit}>kg</Text>
        </View>
      </View>

      {/* Time Range Filter */}
      <View style={styles.rangeFilter}>
        {TIME_RANGES.map((range) => (
          <TouchableOpacity
            key={range.label}
            style={[styles.rangeButton, selectedRange === range.label && styles.rangeButtonActive]}
            onPress={() => setSelectedRange(range.label)}
          >
            <Text style={[styles.rangeText, selectedRange === range.label && styles.rangeTextActive]}>
              {range.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Weight Chart */}
      {chartData.length > 1 ? (
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            height={220}
            showVerticalLines
            spacing={chartData.length > 10 ? 30 : 50}
            initialSpacing={10}
            color="#1E64FF"
            thickness={2}
            dataPointsColor="#1E64FF"
            dataPointsRadius={4}
            xAxisColor="#2a2a3e"
            yAxisColor="#2a2a3e"
            xAxisLabelTextStyle={styles.chartLabel}
            yAxisTextStyle={styles.chartLabel}
            yAxisLabelSuffix=" kg"
            backgroundColor="#1a1a2e"
            curved
          />
        </View>
      ) : (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>Need at least 2 entries to show chart</Text>
        </View>
      )}

      {/* Weight History */}
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>History</Text>
        {filteredWeights.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="body-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No weight entries yet</Text>
          </View>
        ) : (
          filteredWeights.map((entry) => (
            <View key={entry.id} style={styles.historyItem}>
              <View style={styles.historyInfo}>
                <Text style={styles.historyDate}>{format(parseISO(entry.date), 'MMM d, yyyy')}</Text>
                <Text style={styles.historyDay}>{format(parseISO(entry.date), 'EEEE')}</Text>
              </View>
              <View style={styles.historyData}>
                <Text style={styles.historyWeight}>{entry.weight_kg.toFixed(1)} kg</Text>
                {entry.body_fat_pct && (
                  <Text style={styles.historyBodyFat}>{entry.body_fat_pct.toFixed(1)}%</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => handleDelete(entry.id)}>
                <Ionicons name="trash-outline" size={18} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Log Weight Modal */}
      <Modal visible={showLogModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Weight</Text>
              <TouchableOpacity onPress={() => setShowLogModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Weight (kg) *</Text>
              <TextInput
                style={styles.input}
                value={logWeight}
                onChangeText={setLogWeight}
                placeholder="70.5"
                placeholderTextColor="#555"
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Body Fat %</Text>
              <TextInput
                style={styles.input}
                value={logBodyFat}
                onChangeText={setLogBodyFat}
                placeholder="15.2"
                placeholderTextColor="#555"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={logNotes}
                onChangeText={setLogNotes}
                placeholder="Optional notes..."
                placeholderTextColor="#555"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleLogWeight}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  todayCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  todayTitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
  },
  todayContent: {
    alignItems: 'center',
  },
  todayWeight: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  todayBodyFat: {
    color: '#1E64FF',
    fontSize: 16,
    marginTop: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  editButtonText: {
    color: '#1E64FF',
    fontSize: 14,
    fontWeight: '600',
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1E64FF',
    padding: 14,
    borderRadius: 12,
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: '#888',
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  changeValue: {
    color: '#1E64FF',
  },
  statUnit: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  rangeFilter: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  rangeButton: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  rangeButtonActive: {
    backgroundColor: '#1E64FF',
  },
  rangeText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  rangeTextActive: {
    color: '#fff',
  },
  chartContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  chartLabel: {
    color: '#888',
    fontSize: 10,
  },
  emptyChart: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyChartText: {
    color: '#555',
    fontSize: 14,
  },
  historySection: {
    marginTop: 8,
  },
  historyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  historyDay: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  historyData: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  historyWeight: {
    color: '#1E64FF',
    fontSize: 16,
    fontWeight: '700',
  },
  historyBodyFat: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
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
    marginBottom: 24,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#1E64FF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
