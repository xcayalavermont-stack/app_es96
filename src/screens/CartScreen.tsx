import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { CartItem, RootStackParamList } from '../types';
import {
  Product,
  loadProducts,
  findProductByQuery,
  filterProducts,
} from '../data/productStore';

type CartScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Cart'>;

interface Props {
  navigation: CartScreenNavigationProp;
  route: RouteProp<RootStackParamList, 'Cart'>;
}

export default function CartScreen({ navigation, route }: Props) {
  const { memberName, memberLabs } = route.params;

  React.useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Text style={{ fontFamily: 'Oswald_400Regular', color: '#fff', fontSize: 15, marginRight: 8 }}>
          {memberName}
        </Text>
      ),
    });
  }, [memberName]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const insets = useSafeAreaInsets();

  const loadAvailableProducts = async () => {
    setRefreshing(true);
    try {
      const products = await loadProducts();
      setAvailableProducts(products);
    } catch (error) {
      Alert.alert('Unable to load inventory', 'Try again later.');
    } finally {
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadAvailableProducts();
  }, []);

  // Called when a barcode is submitted (from scanner or manual entry)
  const handleBarcodeSubmit = async () => {
    const query = searchText.trim();
    if (!query) return;

    const matchedProduct = findProductByQuery(query, availableProducts);
    const suggestions = filterProducts(query, availableProducts);

    if (matchedProduct) {
      addProductToCart(matchedProduct);
      return;
    }

    if (suggestions.length === 1) {
      addProductToCart(suggestions[0]);
      return;
    }

    Alert.alert(
      'Item not found',
      'Type more of the item name or barcode and try again.'
    );
  };

  const addProductToCart = (product: Product) => {
    const existing = cartItems.find((item) => item.barcode === product.barcode);
    if (existing) {
      setCartItems((prev) =>
        prev.map((item) =>
          item.barcode === product.barcode
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          barcode: product.barcode,
          name: product.name,
          quantity: 1,
          price: product.price,
        },
      ]);
    }

    setSearchText('');
    inputRef.current?.focus();
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Add items before checking out.');
      return;
    }
    navigation.navigate('LabAssignmentQuestion', { cartItems, memberName, memberLabs });
  };

  // Tracks whether the current swipe passed the full-delete threshold
  const isFullSwipe = useRef<Record<string, boolean>>({});

  const renderRightActions = (
    id: string,
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    dragX.addListener(({ value }) => {
      if (value < -(SCREEN_WIDTH * 0.55)) {
        isFullSwipe.current[id] = true;
      }
    });

    const bgColor = dragX.interpolate({
      inputRange: [-SCREEN_WIDTH, -SCREEN_WIDTH * 0.55, 0],
      outputRange: ['#7f1d1d', '#dc2626', '#dc2626'],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.swipeDelete, { backgroundColor: bgColor }]}>
        <TouchableOpacity style={styles.swipeDeleteInner} onPress={() => removeItem(id)}>
          <Text style={styles.swipeDeleteText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <Swipeable
      renderRightActions={(progress, dragX) => renderRightActions(item.id, progress, dragX)}
      rightThreshold={60}
      overshootRight={false}
      onSwipeableOpen={() => {
        if (isFullSwipe.current[item.id]) {
          removeItem(item.id);
        }
      }}
      onSwipeableClose={() => {
        isFullSwipe.current[item.id] = false;
      }}
    >
      <View style={styles.cartRow}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemBarcode}>{item.barcode}</Text>
          <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
        </View>
        <View style={styles.quantityControls}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, -1)}>
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.id, 1)}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.id)}>
            <Text style={styles.removeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Swipeable>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Barcode / Scanner Input */}
      <View style={styles.scanRow}>
        <TextInput
          ref={inputRef}
          style={styles.scanInput}
          placeholder="Search for an item or scan barcode"
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleBarcodeSubmit}
          returnKeyType="done"
          autoFocus
          autoCorrect={false}
          autoCapitalize="none"
          // Most USB/Bluetooth barcode scanners act as keyboards and
          // automatically press Enter after scanning — this input captures that.
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleBarcodeSubmit}>
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Cart Items */}
      {cartItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyText}>No items yet.</Text>
          <Text style={styles.emptySubtext}>Type an item name or scan a barcode to add it to cart.</Text>
        </View>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>${cartTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.checkoutBtn, cartItems.length === 0 && styles.checkoutBtnDisabled]}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutBtnText}>
            Checkout ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scanRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    gap: 8,
  },
  scanInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#a62035',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  addBtn: {
    backgroundColor: '#a62035',
    borderRadius: 8,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  list: {
    padding: 12,
    gap: 8,
  },
  cartRow: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  itemBarcode: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    color: '#a62035',
    fontWeight: '600',
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e8eeff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {
    fontSize: 18,
    color: '#a62035',
    fontWeight: '600',
    lineHeight: 22,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    minWidth: 24,
    textAlign: 'center',
  },
  removeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  removeBtnText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '600',
  },
  swipeDelete: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  swipeDeleteInner: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDeleteText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a62035',
  },
  checkoutBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  checkoutBtnDisabled: {
    opacity: 0.5,
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeader: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  inventoryRow: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  inventoryInfo: {
    flex: 1,
    paddingRight: 10,
  },
  inventoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  inventoryBarcode: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  inventoryRight: {
    alignItems: 'flex-end',
  },
  inventoryPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#a62035',
  },
  inventoryStock: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});
