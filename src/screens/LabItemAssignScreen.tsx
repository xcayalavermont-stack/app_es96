import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CartItem, LabAssignments, RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LabItemAssign'>;
  route: RouteProp<RootStackParamList, 'LabItemAssign'>;
};

const CRIMSON = '#a62035';

export default function LabItemAssignScreen({ navigation, route }: Props) {
  const { cartItems, selectedLabs, currentLabIndex, labAssignments, memberName } = route.params;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const insets = useSafeAreaInsets();

  const currentLab = selectedLabs[currentLabIndex];

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedItems = cartItems.filter((item) => selectedIds.has(item.id));
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleNext = () => {
    const updatedAssignments: LabAssignments = {
      ...labAssignments,
      [currentLab]: selectedItems,
    };

    const remainingItems = cartItems.filter((item) => !selectedIds.has(item.id));
    const nextLabIndex = currentLabIndex + 1;

    if (nextLabIndex < selectedLabs.length && remainingItems.length > 0) {
      navigation.push('LabItemAssign', {
        cartItems: remainingItems,
        selectedLabs,
        currentLabIndex: nextLabIndex,
        labAssignments: updatedAssignments,
        memberName,
      });
    } else {
      // Assign any leftover items to the last lab if we ran out of labs
      if (remainingItems.length > 0) {
        updatedAssignments[currentLab] = [
          ...(updatedAssignments[currentLab] ?? []),
          ...remainingItems,
        ];
      }
      const allItems = Object.values(updatedAssignments).flat();
      navigation.navigate('Checkout', {
        items: allItems,
        memberName,
        labAssignments: updatedAssignments,
      });
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => {
    const isSelected = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardSelected]}
        onPress={() => toggleItem(item.id)}
        activeOpacity={0.8}
      >
        <View style={styles.cardLeft}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardBarcode}>{item.barcode}</Text>
          <Text style={styles.cardPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
        </View>
        <View style={styles.cardRight}>
          {isSelected ? (
            <View style={styles.checkBox}>
              <Text style={styles.checkBoxText}>✓</Text>
            </View>
          ) : (
            <View style={styles.emptyBox} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Select Items For {currentLab}
        </Text>
        <Text style={styles.headerName}>{memberName}</Text>
      </View>

      <Text style={styles.subtitle}>Tap The Items For This Lab</Text>

      {/* Item list */}
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        style={{ flex: 1 }}
      />

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>${selectedTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  header: {
    backgroundColor: CRIMSON,
    paddingHorizontal: 16,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 20,
    color: '#fff',
    flex: 1,
    marginRight: 12,
  },
  headerName: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
  },
  subtitle: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 16,
    color: '#222',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: CRIMSON,
  },
  cardLeft: {
    flex: 1,
    marginRight: 12,
  },
  cardName: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 16,
    color: '#222',
  },
  cardBarcode: {
    fontFamily: 'Oswald_400Regular',
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  cardPrice: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 14,
    color: CRIMSON,
    marginTop: 6,
  },
  cardRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
  },
  checkBox: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: CRIMSON,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: {
    fontFamily: 'Oswald_600SemiBold',
    fontSize: 18,
    color: '#222',
  },
  totalAmount: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 18,
    color: CRIMSON,
  },
  nextBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 40,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: {
    fontFamily: 'Oswald_700Bold',
    fontSize: 18,
    color: '#fff',
  },
});
