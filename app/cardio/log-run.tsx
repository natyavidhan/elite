import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { logCardioSession } from '../../db/cardioDb';

const ACTIVITY_TYPES = ['run', 'walk', 'cycle', 'swim', 'other'] as const;

export default function LogCardioScreen() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activityType, setActivityType] = useState<string>('run');
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');

  // Parse duration string (MM:SS or HH:MM:SS)
  const parseDuration = (durationStr: string): number | null => {
    const parts = durationStr.split(':').map((p) => parseInt(p.trim(), 10));
    if (parts.some((p) => isNaN(p))) return null;

    if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return null;
  };

  const handleSave = async () => {
    const durationSeconds = parseDuration(duration);
    if (!durationSeconds || durationSeconds <= 0) {
      Alert.alert('Invalid Duration', 'Please enter a valid duration (MM:SS or HH:MM:SS)');
      return;
    }

    const distanceKm = distance ? parseFloat(distance) : undefined;
    const avgHR = heartRate ? parseInt(heartRate, 10) : undefined;
    const caloriesBurned = calories ? parseInt(calories, 10) : undefined;

    if (distanceKm !== undefined && (isNaN(distanceKm) || distanceKm < 0)) {
      Alert.alert('Invalid Distance', 'Please enter a valid distance in km');
      return;
    }

    try {
      await logCardioSession({
        date,
        activityType,
        durationSeconds,
        distanceKm,
        avgHeartRate: avgHR,
        caloriesBurned,
        notes: notes || undefined,
      });
      router.back();
    } catch (e) {
      console.error('Failed to log cardio session:', e);
      Alert.alert('Error', 'Failed to save cardio session');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#555"
          />
        </View>

        {/* Activity Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Activity Type</Text>
          <View style={styles.activityGrid}>
            {ACTIVITY_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.activityButton, activityType === type && styles.activityButtonActive]}
                onPress={() => setActivityType(type)}
              >
                <Ionicons
                  name={
                    type === 'run'
                      ? 'walk'
                      : type === 'walk'
                        ? 'footsteps'
                        : type === 'cycle'
                          ? 'bicycle'
                          : type === 'swim'
                            ? 'water'
                            : 'fitness'
                  }
                  size={24}
                  color={activityType === type ? '#fff' : '#888'}
                />
                <Text style={[styles.activityText, activityType === type && styles.activityTextActive]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.label}>Duration *</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            placeholder="MM:SS or HH:MM:SS"
            placeholderTextColor="#555"
            keyboardType="default"
          />
        </View>

        {/* Distance */}
        <View style={styles.section}>
          <Text style={styles.label}>Distance (km)</Text>
          <TextInput
            style={styles.input}
            value={distance}
            onChangeText={setDistance}
            placeholder="0.00"
            placeholderTextColor="#555"
            keyboardType="decimal-pad"
          />
        </View>

        {/* Heart Rate */}
        <View style={styles.section}>
          <Text style={styles.label}>Avg Heart Rate (bpm)</Text>
          <TextInput
            style={styles.input}
            value={heartRate}
            onChangeText={setHeartRate}
            placeholder="120"
            placeholderTextColor="#555"
            keyboardType="number-pad"
          />
        </View>

        {/* Calories */}
        <View style={styles.section}>
          <Text style={styles.label}>Calories Burned</Text>
          <TextInput
            style={styles.input}
            value={calories}
            onChangeText={setCalories}
            placeholder="350"
            placeholderTextColor="#555"
            keyboardType="number-pad"
          />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="How did it feel?"
            placeholderTextColor="#555"
            multiline
            numberOfLines={4}
          />
        </View>
      </ScrollView>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Session</Text>
      </TouchableOpacity>
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
  section: {
    marginBottom: 20,
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activityButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  activityButtonActive: {
    backgroundColor: '#1E64FF',
  },
  activityText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  activityTextActive: {
    color: '#fff',
  },
  saveButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#1E64FF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
