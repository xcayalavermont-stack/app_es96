import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as Battery from 'expo-battery';
import { CartItem, RootStackParamList } from '../types';

type CheckoutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Checkout'>;
type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'Checkout'>;

interface Props {
  navigation: CheckoutScreenNavigationProp;
  route: CheckoutScreenRouteProp;
}

const TIMEOUT_SECONDS = 15 * 60; // 15 minutes

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function SuccessView({
  items,
  total,
  onDone,
}: {
  items: CartItem[];
  total: number;
  onDone: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 15-minute countdown
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          onDone();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Return to login when charging is detected
  useEffect(() => {
    const subscription = Battery.addBatteryStateListener(({ batteryState }) => {
      if (
        batteryState === Battery.BatteryState.CHARGING ||
        batteryState === Battery.BatteryState.FULL
      ) {
        onDone();
      }
    });
    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.successContainer}>
      <Text style={styles.successIcon}>✓</Text>
      <Text style={styles.successTitle}>Order Submitted!</Text>
      <Text style={styles.successSubtitle}>
        {items.reduce((s, i) => s + i.quantity, 0)} items • ${total.toFixed(2)}
      </Text>
      <TouchableOpacity style={styles.doneBtn} onPress={onDone}>
        <Text style={styles.doneBtnText}>Return To Login</Text>
      </TouchableOpacity>
      <Text style={styles.timerText}>
        Returning to login in {formatTime(secondsLeft)}
      </Text>
    </View>
  );
}

export default function CheckoutScreen({ navigation, route }: Props) {
  const { items, memberName } = route.params;

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Text style={{ fontFamily: 'Oswald_400Regular', color: '#fff', fontSize: 15, marginRight: 8 }}>
          {memberName}
        </Text>
      ),
    });
  }, [memberName]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmitted(true);
    } catch (error: any) {
      Alert.alert('Checkout Failed', error.message ?? 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    navigation.replace('Login');
  };

  if (submitted) {
    return <SuccessView items={items} total={total} onDone={handleDone} />;
  }

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.lineItem}>
      <View style={styles.lineLeft}>
        <Text style={styles.lineItemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.lineItemBarcode}>{item.barcode}</Text>
      </View>
      <View style={styles.lineRight}>
        <Text style={styles.lineQty}>×{item.quantity}</Text>
        <Text style={styles.linePrice}>${(item.price * item.quantity).toFixed(2)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.card}>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>

        <View style={styles.totalsCard}>
          <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={submitting}
        >
          <Text style={styles.confirmBtnText}>
            {submitting ? 'Submitting...' : `Confirm Order • $${total.toFixed(2)}`}
          </Text>
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
  scroll: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  lineLeft: {
    flex: 1,
    marginRight: 12,
  },
  lineItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  lineItemBarcode: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  lineRight: {
    alignItems: 'flex-end',
  },
  lineQty: {
    fontSize: 13,
    color: '#888',
  },
  linePrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#a62035',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 14,
  },
  totalsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
    marginBottom: 0,
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
  },
  grandTotalValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#a62035',
  },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  confirmBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  successIcon: {
    fontSize: 72,
    color: '#16a34a',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16a34a',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 40,
  },
  doneBtn: {
    backgroundColor: '#a62035',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginBottom: 32,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  timerText: {
    position: 'absolute',
    bottom: 32,
    fontSize: 12,
    color: '#bbb',
  },
});
