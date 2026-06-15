import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { searchFood, lookupBarcode } from '../../utils/nutritionApi';
import { cacheFoodItem, logFood } from '../../db/foodDb';

interface FoodResult {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  source: string;
  externalId?: string;
}

export default function FoodSearchScreen() {
  const { mealType } = useLocalSearchParams<{ mealType: string }>();
  const selectedMealType = mealType || 'snack';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodResult | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const foods = await searchFood(query);
        setResults(foods);
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [query]);

  // Barcode scanner permission
  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = useCallback(async ({ data }: { data: string }) => {
    setScanning(false);
    setLoading(true);
    try {
      const result = await lookupBarcode(data);
      if (result) {
        setSelectedFood(result);
      } else {
        Alert.alert('Not Found', 'No nutrition data found for this barcode.');
      }
    } catch (e) {
      console.error('Barcode lookup failed:', e);
      Alert.alert('Error', 'Failed to lookup barcode.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogFood = async () => {
    if (!selectedFood) return;
    const qty = parseFloat(quantity) || 100;

    try {
      const foodId = await cacheFoodItem({
        externalId: selectedFood.externalId,
        name: selectedFood.name,
        caloriesPer100g: selectedFood.caloriesPer100g,
        proteinPer100g: selectedFood.proteinPer100g,
        carbsPer100g: selectedFood.carbsPer100g,
        fatPer100g: selectedFood.fatPer100g,
        source: selectedFood.source,
      });

      const today = new Date().toISOString().split('T')[0];
      await logFood(today, foodId, selectedMealType, qty);

      setSelectedFood(null);
      setQuantity('100');
      router.back();
    } catch (e) {
      console.error('Failed to log food:', e);
      Alert.alert('Error', 'Failed to log food.');
    }
  };

  const calculatedCalories = selectedFood ? (selectedFood.caloriesPer100g / 100) * parseFloat(quantity || '0') : 0;
  const calculatedProtein = selectedFood ? (selectedFood.proteinPer100g / 100) * parseFloat(quantity || '0') : 0;
  const calculatedCarbs = selectedFood ? (selectedFood.carbsPer100g / 100) * parseFloat(quantity || '0') : 0;
  const calculatedFat = selectedFood ? (selectedFood.fatPer100g / 100) * parseFloat(quantity || '0') : 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#888" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search food or brand..."
            placeholderTextColor="#555"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
              <Ionicons name="close-circle" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        {/* Barcode Scan Button */}
        <TouchableOpacity style={styles.scanButton} onPress={() => setScanning(true)}>
          <Ionicons name="barcode" size={20} color="#fff" />
          <Text style={styles.scanButtonText}>Scan Barcode</Text>
        </TouchableOpacity>

        {/* Results */}
        {loading && <Text style={styles.loadingText}>Searching...</Text>}

        {results.length > 0 && (
          <View style={styles.resultsContainer}>
            {results.map((result, index) => (
              <TouchableOpacity
                key={index}
                style={styles.resultItem}
                onPress={() => setSelectedFood(result)}
              >
                <Text style={styles.resultName}>{result.name}</Text>
                <View style={styles.resultMeta}>
                  <Text style={styles.resultCalories}>{Math.round(result.caloriesPer100g)} kcal / 100g</Text>
                  <View style={[styles.sourceBadge, result.source === 'usda' ? styles.sourceUSDA : styles.sourceOFF]}>
                    <Text style={styles.sourceText}>{result.source === 'usda' ? 'USDA' : 'OFF'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <Text style={styles.noResults}>No results found</Text>
        )}
      </ScrollView>

      {/* Barcode Scanner Modal */}
      <Modal visible={scanning} animationType="slide">
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>Scan Barcode</Text>
            <TouchableOpacity onPress={() => setScanning(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          {hasPermission === false ? (
            <Text style={styles.noPermission}>Camera permission is required to scan barcodes.</Text>
          ) : (
            <BarCodeScanner
              onBarCodeScanned={handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
              barCodeTypes={[BarCodeScanner.Constants.BarCodeType.ean13, BarCodeScanner.Constants.BarCodeType.ean8, BarCodeScanner.Constants.BarCodeType.upc_e]}
            />
          )}
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerTarget} />
          </View>
        </View>
      </Modal>

      {/* Quantity Input Modal */}
      <Modal visible={!!selectedFood} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedFood?.name}</Text>
              <TouchableOpacity onPress={() => { setSelectedFood(null); setQuantity('100'); }}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>{selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)}</Text>

            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity (grams)</Text>
              <TextInput
                style={styles.quantityInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                placeholder="100"
                placeholderTextColor="#555"
                autoFocus
              />
            </View>

            {/* Live Preview */}
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>Nutrition Preview</Text>
              <View style={styles.previewRow}>
                <View style={styles.previewItem}>
                  <Text style={styles.previewValue}>{Math.round(calculatedCalories)}</Text>
                  <Text style={styles.previewLabel}>kcal</Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={styles.previewValue}>{Math.round(calculatedProtein)}g</Text>
                  <Text style={styles.previewLabel}>Protein</Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={styles.previewValue}>{Math.round(calculatedCarbs)}g</Text>
                  <Text style={styles.previewLabel}>Carbs</Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={styles.previewValue}>{Math.round(calculatedFat)}g</Text>
                  <Text style={styles.previewLabel}>Fat</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.logButton} onPress={handleLogFood}>
              <Text style={styles.logButtonText}>Log Food</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2a2a3e',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    color: '#888',
    textAlign: 'center',
    padding: 20,
  },
  resultsContainer: {
    gap: 8,
  },
  resultItem: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  resultName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  resultCalories: {
    color: '#888',
    fontSize: 13,
  },
  sourceBadge: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sourceUSDA: {
    backgroundColor: '#1E64FF33',
  },
  sourceOFF: {
    backgroundColor: '#00C85333',
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '700',
  },
  noResults: {
    color: '#555',
    textAlign: 'center',
    padding: 40,
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#000',
    zIndex: 10,
  },
  scannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  noPermission: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 100,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerTarget: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: '#1E64FF',
    borderRadius: 12,
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
    marginBottom: 8,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  modalSubtitle: {
    color: '#1E64FF',
    fontSize: 14,
    marginBottom: 20,
    textTransform: 'capitalize',
  },
  quantitySection: {
    marginBottom: 20,
  },
  quantityLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  quantityInput: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  previewSection: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  previewTitle: {
    color: '#888',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  previewItem: {
    alignItems: 'center',
  },
  previewValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  previewLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  logButton: {
    backgroundColor: '#1E64FF',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  logButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
