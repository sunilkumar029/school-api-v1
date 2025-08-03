
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useTheme, fontSizes } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FoodItem {
  id: string;
  name: string;
  price: number;
  category: 'veg' | 'non-veg' | 'snacks' | 'beverages';
  available: boolean;
  image: string;
  description: string;
}

interface Order {
  id: string;
  items: { item: FoodItem; quantity: number }[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'served';
  customerName: string;
  orderTime: string;
  qrCode: string;
}

export default function FoodCourtScreen() {
  const { colors, fontSize } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'orders' | 'menu'>('list');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'veg' | 'non-veg' | 'snacks' | 'beverages'>('all');
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [addItemModal, setAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'veg', description: '' });

  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    {
      id: '1',
      name: 'Vegetable Biryani',
      price: 120,
      category: 'veg',
      available: true,
      image: '🍛',
      description: 'Aromatic basmati rice with mixed vegetables',
    },
    {
      id: '2',
      name: 'Chicken Sandwich',
      price: 80,
      category: 'non-veg',
      available: true,
      image: '🥪',
      description: 'Grilled chicken sandwich with fresh vegetables',
    },
    {
      id: '3',
      name: 'Samosa',
      price: 25,
      category: 'snacks',
      available: true,
      image: '🥟',
      description: 'Crispy fried pastry with spiced potato filling',
    },
    {
      id: '4',
      name: 'Fresh Lime Soda',
      price: 30,
      category: 'beverages',
      available: true,
      image: '🥤',
      description: 'Refreshing lime soda with mint',
    },
    {
      id: '5',
      name: 'Paneer Wrap',
      price: 90,
      category: 'veg',
      available: false,
      image: '🌯',
      description: 'Grilled paneer wrap with vegetables',
    },
  ]);

  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ORD001',
      items: [
        { item: foodItems[0], quantity: 1 },
        { item: foodItems[3], quantity: 2 },
      ],
      total: 180,
      status: 'pending',
      customerName: 'John Doe',
      orderTime: '2:30 PM',
      qrCode: 'QR001',
    },
    {
      id: 'ORD002',
      items: [
        { item: foodItems[1], quantity: 2 },
        { item: foodItems[2], quantity: 3 },
      ],
      total: 235,
      status: 'preparing',
      customerName: 'Jane Smith',
      orderTime: '2:15 PM',
      qrCode: 'QR002',
    },
  ]);

  const filteredItems = foodItems.filter(item =>
    selectedCategory === 'all' || item.category === selectedCategory
  );

  const addToCart = (itemId: string) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
      return newCart;
    });
  };

  const addNewFoodItem = () => {
    if (!newItem.name || !newItem.price) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const item: FoodItem = {
      id: (foodItems.length + 1).toString(),
      name: newItem.name,
      price: parseFloat(newItem.price),
      category: newItem.category as any,
      available: true,
      image: '🍽️',
      description: newItem.description,
    };

    setFoodItems(prev => [...prev, item]);
    setNewItem({ name: '', price: '', category: 'veg', description: '' });
    setAddItemModal(false);
    Alert.alert('Success', 'Food item added successfully!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'preparing': return '#007AFF';
      case 'ready': return '#34C759';
      case 'served': return '#8E8E93';
      default: return colors.textSecondary;
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, status: newStatus } : order
    ));
  };

  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <View style={[styles.foodCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.foodHeader}>
        <Text style={styles.foodImage}>{item.image}</Text>
        <View style={styles.foodInfo}>
          <Text style={[styles.foodName, { color: colors.textPrimary }]}>{item.name}</Text>
          <Text style={[styles.foodDescription, { color: colors.textSecondary }]}>
            {item.description}
          </Text>
          <Text style={[styles.foodPrice, { color: colors.primary }]}>₹{item.price}</Text>
        </View>
      </View>

      <View style={styles.foodActions}>
        <View style={[
          styles.availabilityBadge,
          { backgroundColor: item.available ? '#34C759' : '#FF3B30' }
        ]}>
          <Text style={styles.availabilityText}>
            {item.available ? 'Available' : 'Out of Stock'}
          </Text>
        </View>

        {item.available && (
          <View style={styles.cartControls}>
            {cart[item.id] > 0 ? (
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={[styles.quantityButton, { backgroundColor: colors.border }]}
                  onPress={() => removeFromCart(item.id)}
                >
                  <Text style={[styles.quantityButtonText, { color: colors.textPrimary }]}>-</Text>
                </TouchableOpacity>
                <Text style={[styles.quantity, { color: colors.textPrimary }]}>
                  {cart[item.id]}
                </Text>
                <TouchableOpacity
                  style={[styles.quantityButton, { backgroundColor: colors.primary }]}
                  onPress={() => addToCart(item.id)}
                >
                  <Text style={[styles.quantityButtonText, { color: '#FFFFFF' }]}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={() => addToCart(item.id)}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.orderHeader}>
        <Text style={[styles.orderId, { color: colors.textPrimary }]}>#{item.id}</Text>
        <TouchableOpacity style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.customerName, { color: colors.textPrimary }]}>
        {item.customerName}
      </Text>
      <Text style={[styles.orderTime, { color: colors.textSecondary }]}>
        Ordered at {item.orderTime}
      </Text>

      <View style={styles.orderItems}>
        {item.items.map((orderItem, index) => (
          <Text key={index} style={[styles.orderItem, { color: colors.textSecondary }]}>
            {orderItem.quantity}x {orderItem.item.name}
          </Text>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <Text style={[styles.orderTotal, { color: colors.primary }]}>
          Total: ₹{item.total}
        </Text>
        <View style={styles.orderActions}>
          {user?.is_staff && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                const statuses: Order['status'][] = ['pending', 'preparing', 'ready', 'served'];
                const currentIndex = statuses.indexOf(item.status);
                if (currentIndex < statuses.length - 1) {
                  updateOrderStatus(item.id, statuses[currentIndex + 1]);
                }
              }}
            >
              <Text style={styles.actionButtonText}>Update Status</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.qrButton, { backgroundColor: colors.border }]}>
            <Text style={[styles.qrButtonText, { color: colors.textPrimary }]}>QR Code</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderCategoryFilter = () => (
    <View style={[styles.categoryFilter, { backgroundColor: colors.surface }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {['all', 'veg', 'non-veg', 'snacks', 'beverages'].map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              { borderColor: colors.border },
              selectedCategory === category && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setSelectedCategory(category as any)}
          >
            <Text style={[
              styles.categoryButtonText,
              { color: selectedCategory === category ? '#FFFFFF' : colors.textPrimary }
            ]}>
              {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderMenuManagement = () => (
    <ScrollView style={styles.menuManagement}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Menu Management</Text>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.primary }]}
        onPress={() => setAddItemModal(true)}
      >
        <Text style={styles.actionButtonText}>+ Add New Item</Text>
      </TouchableOpacity>

      <View style={styles.dailySpecials}>
        <Text style={[styles.subsectionTitle, { color: colors.textPrimary }]}>Daily Specials</Text>
        <View style={[styles.specialCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.specialName, { color: colors.textPrimary }]}>Today's Special</Text>
          <Text style={[styles.specialDescription, { color: colors.textSecondary }]}>
            Rajma Rice with Raita - ₹100
          </Text>
          <TouchableOpacity style={[styles.editButton, { borderColor: colors.primary }]}>
            <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit Special</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.analytics}>
        <Text style={[styles.subsectionTitle, { color: colors.textPrimary }]}>Today's Analytics</Text>
        <View style={styles.analyticsGrid}>
          <View style={[styles.analyticsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.analyticsValue, { color: colors.primary }]}>25</Text>
            <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Orders</Text>
          </View>
          <View style={[styles.analyticsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.analyticsValue, { color: colors.primary }]}>₹2,340</Text>
            <Text style={[styles.analyticsLabel, { color: colors.textSecondary }]}>Revenue</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Food Court"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'list' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('list')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'list' ? colors.primary : colors.textSecondary }
          ]}>
            Food List
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'orders' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[
            styles.tabText,
            { color: activeTab === 'orders' ? colors.primary : colors.textSecondary }
          ]}>
            Orders
          </Text>
        </TouchableOpacity>
        {user?.is_staff && (
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'menu' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab('menu')}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === 'menu' ? colors.primary : colors.textSecondary }
            ]}>
              Menu
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {activeTab === 'list' && (
        <View style={styles.foodListContainer}>
          {renderCategoryFilter()}
          <FlatList
            data={filteredItems}
            renderItem={renderFoodItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        </View>
      )}

      {activeTab === 'orders' && (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}

      {activeTab === 'menu' && renderMenuManagement()}

      {/* Add Item Modal */}
      <Modal
        visible={addItemModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAddItemModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add New Food Item</Text>

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Item Name"
              placeholderTextColor={colors.textSecondary}
              value={newItem.name}
              onChangeText={(text) => setNewItem(prev => ({ ...prev, name: text }))}
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Price"
              placeholderTextColor={colors.textSecondary}
              value={newItem.price}
              onChangeText={(text) => setNewItem(prev => ({ ...prev, price: text }))}
              keyboardType="numeric"
            />

            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.textPrimary, height: 80 }]}
              placeholder="Description"
              placeholderTextColor={colors.textSecondary}
              value={newItem.description}
              onChangeText={(text) => setNewItem(prev => ({ ...prev, description: text }))}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.border }]}
                onPress={() => setAddItemModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={addNewFoodItem}
              >
                <Text style={styles.modalButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  foodListContainer: {
    flex: 1,
  },
  categoryFilter: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  foodCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  foodHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  foodImage: {
    fontSize: 40,
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  foodDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  foodPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  foodActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cartControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  orderCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 14,
    marginBottom: 8,
  },
  orderItems: {
    marginBottom: 12,
  },
  orderItem: {
    fontSize: 14,
    marginBottom: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  qrButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  qrButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuManagement: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dailySpecials: {
    marginBottom: 24,
  },
  specialCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  specialName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  specialDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  analytics: {
    marginBottom: 24,
  },
  analyticsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  analyticsCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
