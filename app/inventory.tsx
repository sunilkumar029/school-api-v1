
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';

interface Product {
  id: string;
  name: string;
  category: string;
  stockLevel: number;
  minStockLevel: number;
  price: number;
  supplier: string;
  lastUpdated: string;
  status: 'in-stock' | 'low' | 'out-of-stock';
}

interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  products: string[];
  isActive: boolean;
}

interface Order {
  id: string;
  orderNumber: string;
  supplier: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
  totalAmount: number;
  status: 'draft' | 'ordered' | 'received';
  orderDate: string;
  expectedDate: string;
  receivedDate?: string;
}

export default function InventoryScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'suppliers' | 'orders'>('products');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'product' | 'supplier' | 'order'>('product');

  const [products, setProducts] = useState<Product[]>([
    {
      id: '1',
      name: 'Office Chairs',
      category: 'Furniture',
      stockLevel: 25,
      minStockLevel: 10,
      price: 150.00,
      supplier: 'OfficePro Ltd',
      lastUpdated: '2024-01-15',
      status: 'in-stock',
    },
    {
      id: '2',
      name: 'Whiteboard Markers',
      category: 'Stationery',
      stockLevel: 5,
      minStockLevel: 20,
      price: 2.50,
      supplier: 'StationeryWorld',
      lastUpdated: '2024-01-14',
      status: 'low',
    },
    {
      id: '3',
      name: 'Projectors',
      category: 'Electronics',
      stockLevel: 0,
      minStockLevel: 3,
      price: 500.00,
      supplier: 'TechSupply Co',
      lastUpdated: '2024-01-10',
      status: 'out-of-stock',
    },
  ]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      id: '1',
      name: 'OfficePro Ltd',
      contact: 'John Smith',
      email: 'john@officepro.com',
      phone: '+1-555-0123',
      address: '123 Business St, City',
      products: ['1'],
      isActive: true,
    },
    {
      id: '2',
      name: 'StationeryWorld',
      contact: 'Sarah Johnson',
      email: 'sarah@stationeryworld.com',
      phone: '+1-555-0456',
      address: '456 Supply Ave, City',
      products: ['2'],
      isActive: true,
    },
    {
      id: '3',
      name: 'TechSupply Co',
      contact: 'Mike Wilson',
      email: 'mike@techsupply.com',
      phone: '+1-555-0789',
      address: '789 Tech Blvd, City',
      products: ['3'],
      isActive: false,
    },
  ]);

  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: 'PO-2024-001',
      supplier: 'StationeryWorld',
      items: [{ productId: '2', quantity: 50, unitPrice: 2.50 }],
      totalAmount: 125.00,
      status: 'ordered',
      orderDate: '2024-01-15',
      expectedDate: '2024-01-20',
    },
    {
      id: '2',
      orderNumber: 'PO-2024-002',
      supplier: 'TechSupply Co',
      items: [{ productId: '3', quantity: 5, unitPrice: 500.00 }],
      totalAmount: 2500.00,
      status: 'draft',
      orderDate: '2024-01-16',
      expectedDate: '2024-01-25',
    },
  ]);

  const categories = ['All', 'Furniture', 'Stationery', 'Electronics', 'Cleaning', 'Sports'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return '#4CAF50';
      case 'low': return '#FF9800';
      case 'out-of-stock': return '#F44336';
      case 'draft': return '#9E9E9E';
      case 'ordered': return '#2196F3';
      case 'received': return '#4CAF50';
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in-stock': return '✅';
      case 'low': return '⚠️';
      case 'out-of-stock': return '❌';
      case 'draft': return '📝';
      case 'ordered': return '📦';
      case 'received': return '✅';
      default: return '📄';
    }
  };

  const filteredProducts = selectedCategory === 'All'
    ? products
    : products.filter(product => product.category === selectedCategory);

  const isAdmin = user?.role === 'admin' || user?.role === 'staff';

  const ProductCard = ({ product }: { product: Product }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <Text style={[styles.cardName, { color: colors.textPrimary }]}>
            {product.name}
          </Text>
          <Text style={[styles.cardCategory, { color: colors.textSecondary }]}>
            {product.category}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(product.status) }]}>
          <Text style={styles.statusText}>
            {getStatusIcon(product.status)} {product.status.replace('-', ' ').toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.stockInfo}>
          <Text style={[styles.stockLevel, { color: colors.textPrimary }]}>
            Stock: {product.stockLevel} units
          </Text>
          <Text style={[styles.minStock, { color: colors.textSecondary }]}>
            Min: {product.minStockLevel}
          </Text>
        </View>
        <Text style={[styles.price, { color: colors.primary }]}>
          ${product.price.toFixed(2)}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={[styles.supplier, { color: colors.textSecondary }]}>
          Supplier: {product.supplier}
        </Text>
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
          Updated: {product.lastUpdated}
        </Text>
      </View>

      {isAdmin && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.editButton, { borderColor: colors.primary }]}
            onPress={() => Alert.alert('Edit Product', `Edit ${product.name}`)}
          >
            <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.deleteButton, { borderColor: '#F44336' }]}
            onPress={() => Alert.alert('Delete Product', `Delete ${product.name}?`)}
          >
            <Text style={[styles.deleteButtonText, { color: '#F44336' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const SupplierCard = ({ supplier }: { supplier: Supplier }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <Text style={[styles.cardName, { color: colors.textPrimary }]}>
            {supplier.name}
          </Text>
          <Text style={[styles.cardCategory, { color: colors.textSecondary }]}>
            Contact: {supplier.contact}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: supplier.isActive ? '#4CAF50' : '#F44336' }]}>
          <Text style={styles.statusText}>
            {supplier.isActive ? '✅ ACTIVE' : '❌ INACTIVE'}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.contactInfo, { color: colors.textSecondary }]}>
          📧 {supplier.email}
        </Text>
        <Text style={[styles.contactInfo, { color: colors.textSecondary }]}>
          📞 {supplier.phone}
        </Text>
        <Text style={[styles.contactInfo, { color: colors.textSecondary }]}>
          📍 {supplier.address}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={[styles.productsCount, { color: colors.textSecondary }]}>
          Products: {supplier.products.length}
        </Text>
        {isAdmin && (
          <View style={styles.supplierActions}>
            <TouchableOpacity
              style={[styles.editButton, { borderColor: colors.primary }]}
              onPress={() => Alert.alert('Edit Supplier', `Edit ${supplier.name}`)}
            >
              <Text style={[styles.editButtonText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const OrderCard = ({ order }: { order: Order }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitle}>
          <Text style={[styles.cardName, { color: colors.textPrimary }]}>
            {order.orderNumber}
          </Text>
          <Text style={[styles.cardCategory, { color: colors.textSecondary }]}>
            {order.supplier}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>
            {getStatusIcon(order.status)} {order.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={[styles.orderInfo, { color: colors.textPrimary }]}>
          Items: {order.items.length}
        </Text>
        <Text style={[styles.price, { color: colors.primary }]}>
          Total: ${order.totalAmount.toFixed(2)}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={[styles.orderDate, { color: colors.textSecondary }]}>
          Ordered: {order.orderDate}
        </Text>
        <Text style={[styles.expectedDate, { color: colors.textSecondary }]}>
          Expected: {order.expectedDate}
        </Text>
      </View>

      {isAdmin && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.editButton, { borderColor: colors.primary }]}
            onPress={() => Alert.alert('Order Details', `View ${order.orderNumber} details`)}
          >
            <Text style={[styles.editButtonText, { color: colors.primary }]}>View</Text>
          </TouchableOpacity>
          {order.status === 'ordered' && (
            <TouchableOpacity
              style={[styles.receiveButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => Alert.alert('Mark Received', `Mark ${order.orderNumber} as received?`)}
            >
              <Text style={styles.receiveButtonText}>Mark Received</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Inventory"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
        {(['products', 'suppliers', 'orders'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && { borderBottomColor: colors.primary }
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === tab ? colors.primary : colors.textSecondary,
                  fontWeight: activeTab === tab ? 'bold' : 'normal',
                }
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Filter for Products */}
      {activeTab === 'products' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === category ? colors.primary : colors.surface,
                  borderColor: colors.border,
                }
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: selectedCategory === category ? '#FFFFFF' : colors.textPrimary,
                  }
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Add Button */}
      {isAdmin && (
        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setModalType(activeTab === 'products' ? 'product' : activeTab === 'suppliers' ? 'supplier' : 'order');
              setShowModal(true);
            }}
          >
            <Text style={styles.addButtonText}>
              + Add {activeTab === 'products' ? 'Product' : activeTab === 'suppliers' ? 'Supplier' : 'Order'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'products' && (
          <View>
            {filteredProducts.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  No products found
                </Text>
              </View>
            ) : (
              filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </View>
        )}

        {activeTab === 'suppliers' && (
          <View>
            {suppliers.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </View>
        )}

        {activeTab === 'orders' && (
          <View>
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Modal - Basic placeholder */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Add New {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
            </Text>
            <Text style={[styles.modalContent, { color: colors.textSecondary }]}>
              Add {modalType} form would be implemented here with all necessary fields.
            </Text>
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
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
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addButtonContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  addButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitle: {
    flex: 1,
    marginRight: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stockInfo: {
    flex: 1,
  },
  stockLevel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  minStock: {
    fontSize: 12,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  supplier: {
    fontSize: 12,
    flex: 1,
  },
  lastUpdated: {
    fontSize: 12,
  },
  contactInfo: {
    fontSize: 14,
    marginBottom: 4,
  },
  productsCount: {
    fontSize: 12,
    flex: 1,
  },
  supplierActions: {
    flexDirection: 'row',
  },
  orderInfo: {
    fontSize: 14,
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    flex: 1,
  },
  expectedDate: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 4,
    marginRight: 8,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 4,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  receiveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  receiveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '80%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalContent: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
