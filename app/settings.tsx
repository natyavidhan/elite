import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getSettings, updateSettings, Settings } from '../db/settingsDb';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const s = await getSettings();
      setSettings(s);
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      await updateSettings(settings);
      Alert.alert('Saved', 'Settings updated successfully');
      router.back();
    } catch (e) {
      console.error('Failed to save settings:', e);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  if (loading || !settings) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Unit System */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Units</Text>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Unit System</Text>
          <View style={styles.toggleGroup}>
            <TouchableOpacity
              style={[styles.toggleButton, settings.unit_system === 'metric' && styles.toggleButtonActive]}
              onPress={() => setSettings({ ...settings, unit_system: 'metric' })}
            >
              <Text style={[styles.toggleText, settings.unit_system === 'metric' && styles.toggleTextActive]}>
                Metric
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, settings.unit_system === 'imperial' && styles.toggleButtonActive]}
              onPress={() => setSettings({ ...settings, unit_system: 'imperial' })}
            >
              <Text style={[styles.toggleText, settings.unit_system === 'imperial' && styles.toggleTextActive]}>
                Imperial
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>Bodyweight Unit</Text>
          <View style={styles.toggleGroup}>
            <TouchableOpacity
              style={[styles.toggleButton, settings.bodyweight_unit === 'kg' && styles.toggleButtonActive]}
              onPress={() => setSettings({ ...settings, bodyweight_unit: 'kg' })}
            >
              <Text style={[styles.toggleText, settings.bodyweight_unit === 'kg' && styles.toggleTextActive]}>
                kg
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, settings.bodyweight_unit === 'lbs' && styles.toggleButtonActive]}
              onPress={() => setSettings({ ...settings, bodyweight_unit: 'lbs' })}
            >
              <Text style={[styles.toggleText, settings.bodyweight_unit === 'lbs' && styles.toggleTextActive]}>
                lbs
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Daily Goals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Goals</Text>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Calories (kcal)</Text>
          <TextInput
            style={styles.input}
            value={String(settings.daily_calorie_goal)}
            onChangeText={(v) => setSettings({ ...settings, daily_calorie_goal: parseInt(v, 10) || 0 })}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Protein (g)</Text>
          <TextInput
            style={styles.input}
            value={String(settings.daily_protein_goal)}
            onChangeText={(v) => setSettings({ ...settings, daily_protein_goal: parseInt(v, 10) || 0 })}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Carbs (g)</Text>
          <TextInput
            style={styles.input}
            value={String(settings.daily_carb_goal)}
            onChangeText={(v) => setSettings({ ...settings, daily_carb_goal: parseInt(v, 10) || 0 })}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.inputLabel}>Fat (g)</Text>
          <TextInput
            style={styles.input}
            value={String(settings.daily_fat_goal)}
            onChangeText={(v) => setSettings({ ...settings, daily_fat_goal: parseInt(v, 10) || 0 })}
            keyboardType="number-pad"
          />
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Settings</Text>
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
  loadingText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
  section: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionLabel: {
    color: '#888',
    fontSize: 15,
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleButtonActive: {
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
  inputRow: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
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
