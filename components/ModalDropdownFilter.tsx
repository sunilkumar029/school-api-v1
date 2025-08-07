
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface DropdownItem {
  id: number;
  name: string;
  [key: string]: any;
}

interface ModalDropdownFilterProps {
  label: string;
  items: DropdownItem[];
  selectedValue: number | null;
  onValueChange: (value: number) => void;
  loading?: boolean;
  placeholder?: string;
  compact?: boolean;
}

export const ModalDropdownFilter: React.FC<ModalDropdownFilterProps> = ({
  label,
  items,
  selectedValue,
  onValueChange,
  loading = false,
  placeholder = "Select option",
  compact = false,
}) => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedItem = items.find(item => item.id === selectedValue);
  const displayText = selectedItem ? selectedItem.name : placeholder;

  return (
    <View style={compact ? styles.compactContainer : styles.container}>
      {!compact && (
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      )}
      
      <TouchableOpacity
        style={[
          compact ? styles.compactButton : styles.button,
          { borderColor: colors.border, backgroundColor: colors.surface }
        ]}
        onPress={() => setModalVisible(true)}
        disabled={loading}
      >
        <Text
          style={[
            compact ? styles.compactButtonText : styles.buttonText,
            { color: colors.textPrimary }
          ]}
          numberOfLines={1}
        >
          {compact && displayText.length > 12 ? displayText.slice(0, 12) + '...' : displayText}
        </Text>
        <Text style={[styles.dropdownIcon, { color: colors.textSecondary }]}>
          ▼
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Select {label}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: colors.primary }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {loading ? (
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                  style={styles.loading}
                />
              ) : (
                items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.modalItem,
                      {
                        backgroundColor:
                          selectedValue === item.id
                            ? colors.primary + '20'
                            : 'transparent',
                        borderBottomColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      onValueChange(item.id);
                      setModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        {
                          color:
                            selectedValue === item.id
                              ? colors.primary
                              : colors.textPrimary,
                          fontWeight:
                            selectedValue === item.id ? 'bold' : 'normal',
                        },
                      ]}
                    >
                      {item.name}
                    </Text>
                    {selectedValue === item.id && (
                      <Text style={[styles.checkmark, { color: colors.primary }]}>
                        ✓
                      </Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  compactContainer: {
    marginHorizontal: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 44,
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 6,
    minWidth: 80,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  compactButtonText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 10,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    borderRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    maxHeight: 300,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
    flex: 1,
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loading: {
    padding: 20,
  },
});
