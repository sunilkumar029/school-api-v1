
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { TopBar } from '@/components/TopBar';
import { SideDrawer } from '@/components/SideDrawer';
import { Picker } from '@react-native-picker/picker';
import { 
  useBranches, 
  useAcademicYears 
} from '@/hooks/useApi';
import { apiService } from '@/api/apiService';

interface HostelProduct {
  id: number;
  branch_name: string;
  academic_year_name: string;
  name: string;
  price: string;
  quantity: number;
  purchase_date: string;
  expiry_date: string;
  shop_name: string;
  vendor_phone: string;
  availability: string;
  bill_photo?: string;
  product_photo?: string;
  buyer_name: string;
  buyer_phone: string;
  product_use: string;
  branch: number;
  academic_year: number;
}

export default function HostelInventoryScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [products, setProducts] = useState<HostelProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<number>(1);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(1);
  const [stockFilter, setStockFilter] = useState<'All' | 'In-stock' | 'Out-of-stock' | 'Not-in-use'>('All');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<HostelProduct | null>(null);
  const [editingProduct, setEditingProduct] = useState<HostelProduct | null>(null);

  // Form State
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    quantity: '',
    purchase_date: '',
    expiry_date: '',
    shop_name: '',
    vendor_phone: '',
    availability: 'In Stock',
    buyer_name: '',
    buyer_phone: '',
    product_use: '',
  });

  const { data: branches } = useBranches({ is_active: true });
  const { data: academicYears } = useAcademicYears();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        branch: selectedBranch,
        academic_year: selectedAcademicYear,
      };
      const response = await apiService.getHostelProducts(params);
      setProducts(response.results || []);
    } catch (error) {
      console.error('Error fetching hostel products:', error);
      Alert.alert('Error', 'Failed to fetch hostel products');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProducts();
  }, [selectedBranch, selectedAcademicYear]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.buyer_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStock = 
        stockFilter === 'All' ||
        (stockFilter === 'In-stock' && product.availability === 'In Stock') ||
        (stockFilter === 'Out-of-stock' && product.availability === 'Out of Stock') ||
        (stockFilter === 'Not-in-use' && product.availability === 'Not in Use');

      return matchesSearch && matchesStock;
    });
  }, [products, searchQuery, stockFilter]);

  const handleCreateProduct = async () => {
    try {
      if (!productForm.name || !productForm.price || !productForm.quantity) {
        Alert.alert('Error', 'Please fill all required fields');
        return;
      }

      const productData = {
        ...productForm,
        price: parseFloat(productForm.price),
        quantity: parseInt(productForm.quantity),
        branch: selectedBranch,
        academic_year: selectedAcademicYear,
      };

      if (editingProduct) {
        await apiService.updateHostelProduct?.(editingProduct.id, productData);
        Alert.alert('Success', 'Product updated successfully');
      } else {
        await apiService.createHostelProduct(productData);
        Alert.alert('Success', 'Product created successfully');
      }

      setModalVisible(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      Alert.alert('Error', 'Failed to save product');
    }
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      price: '',
      quantity: '',
      purchase_date: '',
      expiry_date: '',
      shop_name: '',
      vendor_phone: '',
      availability: 'In Stock',
      buyer_name: '',
      buyer_phone: '',
      product_use: '',
    });
    setEditingProduct(null);
  };

  const handleProductPress = (product: HostelProduct) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStockColor = (availability: string) => {
    switch (availability) {
      case 'In Stock': return '#10B981';
      case 'Out of Stock': return '#EF4444';
      case 'Not in Use': return '#F59E0B';
      default: return colors.textSecondary;
    }
  };

  const renderProduct = (product: HostelProduct) => (
    <TouchableOpacity
      key={product.id}
      style={[styles.productCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => handleProductPress(product)}
    >
      <View style={styles.productHeader}>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.textPrimary }]}>
            {product.name}
          </Text>
          <Text style={[styles.productPrice, { color: colors.textSecondary }]}>
            ₹{product.price}
          </Text>
        </View>
        <View style={[
          styles.stockBadge,
          { backgroundColor: getStockColor(product.availability) }
        ]}>
          <Text style={styles.stockText}>{product.availability}</Text>
        </View>
      </View>

      <View style={styles.productDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Quantity:</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{product.quantity}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Purchase Date:</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
            {formatDate(product.purchase_date)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Vendor:</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{product.shop_name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Vendor Phone:</Text>
          <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{product.vendor_phone}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderAddProductModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                resetForm();
              }}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Product Name *</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Enter product name"
                placeholderTextColor={colors.textSecondary}
                value={productForm.name}
                onChangeText={(text) => setProductForm(prev => ({...prev, name: text}))}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Price *</Text>
                <TextInput
                  style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  value={productForm.price}
                  onChangeText={(text) => setProductForm(prev => ({...prev, price: text}))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.formGroupHalf}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Quantity *</Text>
                <TextInput
                  style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  value={productForm.quantity}
                  onChangeText={(text) => setProductForm(prev => ({...prev, quantity: text}))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Purchase Date</Text>
                <TextInput
                  style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                  value={productForm.purchase_date}
                  onChangeText={(text) => setProductForm(prev => ({...prev, purchase_date: text}))}
                />
              </View>
              <View style={styles.formGroupHalf}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Expiry Date</Text>
                <TextInput
                  style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                  value={productForm.expiry_date}
                  onChangeText={(text) => setProductForm(prev => ({...prev, expiry_date: text}))}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Shop Name</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Enter shop name"
                placeholderTextColor={colors.textSecondary}
                value={productForm.shop_name}
                onChangeText={(text) => setProductForm(prev => ({...prev, shop_name: text}))}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Vendor Phone</Text>
              <TextInput
                style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Enter vendor phone"
                placeholderTextColor={colors.textSecondary}
                value={productForm.vendor_phone}
                onChangeText={(text) => setProductForm(prev => ({...prev, vendor_phone: text}))}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formGroupHalf}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Buyer Name</Text>
                <TextInput
                  style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Enter buyer name"
                  placeholderTextColor={colors.textSecondary}
                  value={productForm.buyer_name}
                  onChangeText={(text) => setProductForm(prev => ({...prev, buyer_name: text}))}
                />
              </View>
              <View style={styles.formGroupHalf}>
                <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Buyer Phone</Text>
                <TextInput
                  style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="Enter buyer phone"
                  placeholderTextColor={colors.textSecondary}
                  value={productForm.buyer_phone}
                  onChangeText={(text) => setProductForm(prev => ({...prev, buyer_phone: text}))}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textPrimary }]}>Product Purpose</Text>
              <TextInput
                style={[styles.formTextArea, { borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Enter product use case or purpose"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                value={productForm.product_use}
                onChangeText={(text) => setProductForm(prev => ({...prev, product_use: text}))}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateProduct}
            >
              <Text style={styles.submitButtonText}>
                {editingProduct ? 'Update Product' : 'Add Product'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderDetailModal = () => (
    <Modal
      visible={detailModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setDetailModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Product Details
            </Text>
            <TouchableOpacity
              onPress={() => setDetailModalVisible(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {selectedProduct && (
            <ScrollView style={styles.modalBody}>
              <View style={styles.productProfile}>
                <Text style={[styles.profileName, { color: colors.textPrimary }]}>
                  {selectedProduct.name}
                </Text>
                <Text style={[styles.profilePrice, { color: colors.primary }]}>
                  ₹{selectedProduct.price}
                </Text>
              </View>

              <View style={styles.detailsSection}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Product Information
                </Text>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                    Quantity:
                  </Text>
                  <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                    {selectedProduct.quantity}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                    Availability:
                  </Text>
                  <Text style={[styles.detailItemValue, { color: getStockColor(selectedProduct.availability) }]}>
                    {selectedProduct.availability}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                    Purchase Date:
                  </Text>
                  <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                    {formatDate(selectedProduct.purchase_date)}
                  </Text>
                </View>
                {selectedProduct.expiry_date && (
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                      Expiry Date:
                    </Text>
                    <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                      {formatDate(selectedProduct.expiry_date)}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.detailsSection}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Vendor Information
                </Text>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                    Shop Name:
                  </Text>
                  <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                    {selectedProduct.shop_name}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                    Phone:
                  </Text>
                  <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                    {selectedProduct.vendor_phone}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsSection}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  Buyer Information
                </Text>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                    Name:
                  </Text>
                  <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                    {selectedProduct.buyer_name}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                    Phone:
                  </Text>
                  <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                    {selectedProduct.buyer_phone}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailItemLabel, { color: colors.textSecondary }]}>
                    Purpose:
                  </Text>
                  <Text style={[styles.detailItemValue, { color: colors.textPrimary }]}>
                    {selectedProduct.product_use}
                  </Text>
                </View>
              </View>

              {selectedProduct.product_photo && (
                <View style={styles.detailsSection}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Product Photo
                  </Text>
                  <Image
                    source={{ uri: selectedProduct.product_photo }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                </View>
              )}

              {selectedProduct.bill_photo && (
                <View style={styles.detailsSection}>
                  <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                    Bill Photo
                  </Text>
                  <Image
                    source={{ uri: selectedProduct.bill_photo }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TopBar
        title="Hostel Inventory"
        onMenuPress={() => setDrawerVisible(true)}
        onNotificationsPress={() => router.push('/(tabs)/notifications')}
        onSettingsPress={() => router.push('/(tabs)/settings')}
      />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Filters */}
      <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
        {/* Search */}
        <TextInput
          style={[
            styles.searchInput,
            { 
              backgroundColor: colors.background, 
              borderColor: colors.border, 
              color: colors.textPrimary 
            }
          ]}
          placeholder="Search products..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Filter Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          <TouchableOpacity style={[styles.compactFilterButton, { borderColor: colors.border }]}>
            <Text style={[styles.compactFilterText, { color: colors.textPrimary }]}>
              {branches?.find(b => b.id === selectedBranch)?.name || 'Branch'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.compactFilterButton, { borderColor: colors.border }]}>
            <Text style={[styles.compactFilterText, { color: colors.textPrimary }]}>
              {academicYears?.find(ay => ay.id === selectedAcademicYear)?.name || 'Year'}
            </Text>
          </TouchableOpacity>

          {['All', 'In-stock', 'Out-of-stock', 'Not-in-use'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.compactFilterButton,
                { borderColor: colors.border },
                stockFilter === filter && { backgroundColor: colors.primary }
              ]}
              onPress={() => setStockFilter(filter as any)}
            >
              <Text style={[
                styles.compactFilterText,
                { color: stockFilter === filter ? '#FFFFFF' : colors.textPrimary }
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {user?.is_staff && (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+ Add Product</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading products...
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchProducts} />
          }
        >
          {filteredProducts.length > 0 ? (
            filteredProducts.map(renderProduct)
          ) : (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {searchQuery ? 'No products match your search' : 'No products found'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {renderAddProductModal()}
      {renderDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    fontSize: 14,
  },
  filtersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  compactFilterButton: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 70,
  },
  compactFilterText: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  productCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  productDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    maxHeight: 500,
  },
  formGroup: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  formGroupHalf: {
    flex: 1,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  formTextArea: {
    height: 80,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  productProfile: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profilePrice: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItemLabel: {
    fontSize: 14,
    flex: 1,
  },
  detailItemValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
});
