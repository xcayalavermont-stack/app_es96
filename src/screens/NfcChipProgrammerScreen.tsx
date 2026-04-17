import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Product, loadProducts, filterProducts } from '../data/productStore';
import { useNfcWrite } from '../hooks/useNfcWrite';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'NfcChipProgrammer'>;
};

type ProgramStatus = 'idle' | 'waiting' | 'success' | 'error';

export default function NfcChipProgrammerScreen({ navigation }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Product | null>(null);
  const [status, setStatus] = useState<ProgramStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const { writeBarcode, cancel } = useNfcWrite();

  useEffect(() => {
    loadProducts()
      .then(setProducts)
      .catch(() => Alert.alert('Error', 'Could not load products from Supabase.'))
      .finally(() => setLoadingProducts(false));
  }, []);

  const filtered = filterProducts(search, products);

  const handleSelectItem = (item: Product) => {
    setSelected(item);
    setStatus('idle');
    setErrorMessage('');
  };

  const handleProgram = async () => {
    if (!selected) return;
    setStatus('waiting');
    setErrorMessage('');
    try {
      await writeBarcode(selected.barcode);
      setStatus('success');
    } catch (e: any) {
      const msg = e?.message ?? 'Write failed. Make sure the chip is held steady.';
      setErrorMessage(msg);
      setStatus('error');
    }
  };

  const handleCancel = () => {
    cancel();
    setStatus('idle');
  };

  const handleProgramAnother = () => {
    setStatus('idle');
  };

  const handleClearSelection = () => {
    setSelected(null);
    setStatus('idle');
    setErrorMessage('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.replace('Login')}
          style={styles.exitBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.exitBtnText}>← Exit</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NFC Chip Programmer</Text>
        {/* spacer to center title */}
        <View style={{ width: 60 }} />
      </View>

      {/* ── Selected item banner ── */}
      {selected && (
        <View style={styles.selectedBanner}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedLabel}>SELECTED ITEM</Text>
            <Text style={styles.selectedName} numberOfLines={1}>{selected.name}</Text>
            <Text style={styles.selectedBarcode}>{selected.barcode}</Text>
          </View>
          <TouchableOpacity onPress={handleClearSelection} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Program section ── */}
      {selected && (
        <View style={styles.programSection}>
          {status === 'idle' && (
            <TouchableOpacity style={styles.programBtn} onPress={handleProgram}>
              <Text style={styles.programBtnText}>Program NFC Chip</Text>
            </TouchableOpacity>
          )}

          {status === 'waiting' && (
            <View style={styles.waitingBox}>
              <ActivityIndicator color={CRIMSON} size="large" />
              <Text style={styles.waitingTitle}>
                {Platform.OS === 'ios'
                  ? 'Follow the iOS NFC prompt...'
                  : 'Hold phone to NFC chip...'}
              </Text>
              <Text style={styles.waitingItem}>{selected.name}</Text>
              <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {status === 'success' && (
            <View style={styles.resultBox}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successTitle}>Chip programmed!</Text>
              <Text style={styles.resultItem}>{selected.name}</Text>
              <Text style={styles.resultNote}>
                Tap this chip in the Cart screen to instantly add this item.
              </Text>
              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.programBtn} onPress={handleProgramAnother}>
                  <Text style={styles.programBtnText}>Program Another Chip</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.changeItemBtn} onPress={handleClearSelection}>
                  <Text style={styles.changeItemBtnText}>Change Item</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {status === 'error' && (
            <View style={styles.resultBox}>
              <Text style={styles.errorIcon}>✕</Text>
              <Text style={styles.errorTitle}>Write Failed</Text>
              <Text style={styles.resultItem} numberOfLines={2}>{errorMessage}</Text>
              <TouchableOpacity style={styles.programBtn} onPress={handleProgram}>
                <Text style={styles.programBtnText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ── Item search ── */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search items by name or barcode..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
        />
      </View>

      {/* ── Product list ── */}
      {loadingProducts ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={CRIMSON} size="large" />
          <Text style={styles.loadingText}>Loading inventory...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSelected = selected?.id === item.id;
            return (
              <TouchableOpacity
                style={[styles.productRow, isSelected && styles.productRowSelected]}
                onPress={() => handleSelectItem(item)}
                activeOpacity={0.75}
              >
                <View style={styles.productInfo}>
                  <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.productBarcode}>{item.barcode}</Text>
                </View>
                <Text style={[styles.productPrice, isSelected && { color: '#fff' }]}>
                  ${item.price.toFixed(2)}
                </Text>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.checkBadgeText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {search ? 'No items match your search.' : 'No items found in inventory.'}
            </Text>
          }
          keyboardShouldPersistTaps="handled"
        />
      )}
    </SafeAreaView>
  );
}

const CRIMSON = '#a62035';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },

  // Header
  header: {
    backgroundColor: CRIMSON,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingTop: Platform.OS === 'android' ? 14 : 14,
  },
  exitBtn: {
    minWidth: 60,
  },
  exitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },

  // Selected banner
  selectedBanner: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectedInfo: {
    flex: 1,
    marginRight: 12,
  },
  selectedLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: CRIMSON,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  selectedBarcode: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  clearBtn: {
    backgroundColor: '#fee2e2',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearBtnText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 13,
  },

  // Program section
  programSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  programBtn: {
    backgroundColor: CRIMSON,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
  },
  programBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Waiting state
  waitingBox: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    width: '100%',
  },
  waitingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  waitingItem: {
    fontSize: 13,
    color: '#666',
  },
  cancelBtn: {
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: CRIMSON,
  },
  cancelBtnText: {
    color: CRIMSON,
    fontSize: 14,
    fontWeight: '600',
  },

  // Result states (success / error)
  resultBox: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  successIcon: {
    fontSize: 36,
    color: '#16a34a',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
  },
  errorIcon: {
    fontSize: 36,
    color: '#dc2626',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
  },
  resultItem: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
  },
  resultNote: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 6,
  },
  resultActions: {
    width: '100%',
    gap: 8,
  },
  changeItemBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: CRIMSON,
  },
  changeItemBtnText: {
    color: CRIMSON,
    fontSize: 14,
    fontWeight: '600',
  },

  // Search
  searchRow: {
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fafafa',
  },

  // Loading
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },

  // Product list
  list: {
    padding: 12,
  },
  productRow: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  productRowSelected: {
    backgroundColor: CRIMSON,
    borderColor: CRIMSON,
  },
  productInfo: {
    flex: 1,
    marginRight: 10,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  productBarcode: {
    fontSize: 12,
    color: '#888',
    marginTop: 3,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: CRIMSON,
    marginRight: 8,
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeText: {
    color: CRIMSON,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
    fontSize: 14,
  },
});
