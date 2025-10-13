import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MultiResourceTransaction, MultiResourceTransactionItem, Resource, ResourceTransaction } from '@/types/Resource';

interface ReturnResourceModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (data: ReturnData) => Promise<void>;
  transaction?: ResourceTransaction;
  multiTransaction?: MultiResourceTransaction;
  item?: MultiResourceTransactionItem;
  resource: Resource;
  loading?: boolean;
}

interface ReturnData {
  quantity: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'needs_repair';
  notes?: string;
  statusCheck: boolean;
}

export function ReturnResourceModal({
  visible,
  onClose,
  onConfirm,
  transaction,
  multiTransaction,
  item,
  resource,
  loading = false,
}: ReturnResourceModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [returnData, setReturnData] = useState<ReturnData>({
    quantity: 0,
    condition: 'good',
    notes: '',
    statusCheck: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get the borrowed quantity from transaction or item (memoized to prevent infinite loops)
  const borrowedQuantity = useMemo(() => {
    return transaction?.quantity || item?.quantity || 0;
  }, [transaction?.quantity, item?.quantity]);
  
  const isMultiResource = !!multiTransaction && !!item;

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setReturnData({
        quantity: borrowedQuantity, // Default to full quantity
        condition: 'good',
        notes: '',
        statusCheck: false,
      });
      setErrors({});
    }
  }, [visible, borrowedQuantity]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (returnData.quantity <= 0) {
      newErrors.quantity = 'Return quantity must be greater than 0';
    } else if (returnData.quantity > borrowedQuantity) {
      newErrors.quantity = `Cannot return more than borrowed (${borrowedQuantity})`;
    }

    if (!returnData.statusCheck) {
      newErrors.statusCheck = 'Please confirm status check before returning';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onConfirm(returnData);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to return resource. Please try again.');
    }
  };

  const handleQuantityChange = (text: string) => {
    const quantity = parseInt(text) || 0;
    setReturnData(prev => ({ ...prev, quantity }));
  };

  const handleConditionChange = (condition: ReturnData['condition']) => {
    setReturnData(prev => ({ ...prev, condition }));
  };

  const handleNotesChange = (text: string) => {
    setReturnData(prev => ({ ...prev, notes: text }));
  };

  const toggleStatusCheck = () => {
    setReturnData(prev => ({ ...prev, statusCheck: !prev.statusCheck }));
  };

  const getConditionColor = (condition: ReturnData['condition']) => {
    switch (condition) {
      case 'excellent': return colors.success;
      case 'good': return colors.primary;
      case 'fair': return '#FFA500';
      case 'poor': return '#FF6B35';
      case 'needs_repair': return colors.error;
      default: return colors.primary;
    }
  };

  const getConditionIcon = (condition: ReturnData['condition']) => {
    switch (condition) {
      case 'excellent': return 'checkmark-circle';
      case 'good': return 'checkmark';
      case 'fair': return 'warning';
      case 'poor': return 'alert-circle';
      case 'needs_repair': return 'alert';
      default: return 'checkmark';
    }
  };

  const conditionOptions: Array<{ value: ReturnData['condition']; label: string; description: string }> = [
    { value: 'excellent', label: 'Excellent', description: 'Like new condition' },
    { value: 'good', label: 'Good', description: 'Minor wear, fully functional' },
    { value: 'fair', label: 'Fair', description: 'Some wear, needs attention' },
    { value: 'poor', label: 'Poor', description: 'Significant wear or damage' },
    { value: 'needs_repair', label: 'Needs Repair', description: 'Requires maintenance' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Return Resource</ThemedText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
           {/* Resource Information */}
           <View style={[styles.section, { backgroundColor: colors.surface }]}>
             <View style={styles.resourceInfo}>
               <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
                 <Ionicons name="cube-outline" size={20} color={colors.primary} />
               </View>
               <View style={styles.resourceDetails}>
                 <ThemedText style={styles.resourceName}>{resource.name}</ThemedText>
                 <View style={styles.resourceMeta}>
                   <ThemedText style={styles.resourceCategory}>{resource.category}</ThemedText>
                   <ThemedText style={[styles.borrowedQuantity, { color: colors.primary }]}>
                     {borrowedQuantity} units
                   </ThemedText>
                 </View>
               </View>
             </View>
           </View>

           {/* Return Quantity */}
           <View style={[styles.section, { backgroundColor: colors.surface }]}>
             <ThemedText style={styles.sectionTitle}>Return Quantity</ThemedText>
             <View style={styles.quantityContainer}>
               <View style={styles.quantityControls}>
                 <TouchableOpacity
                   style={[
                     styles.quantityButton,
                     { 
                       borderColor: colors.border,
                       backgroundColor: colors.background,
                     }
                   ]}
                   onPress={() => {
                     const newQuantity = Math.max(1, returnData.quantity - 1);
                     setReturnData(prev => ({ ...prev, quantity: newQuantity }));
                   }}
                   disabled={returnData.quantity <= 1}
                 >
                   <Ionicons 
                     name="remove" 
                     size={20} 
                     color={returnData.quantity <= 1 ? colors.text + '40' : colors.text} 
                   />
                 </TouchableOpacity>
                 
                 <TextInput
                   style={[
                     styles.quantityInput,
                     { 
                       borderColor: errors.quantity ? colors.error : colors.border,
                       backgroundColor: colors.background,
                       color: colors.text,
                     }
                   ]}
                   value={returnData.quantity.toString()}
                   onChangeText={handleQuantityChange}
                   keyboardType="numeric"
                   placeholder="Enter quantity"
                   placeholderTextColor={colors.text + '60'}
                 />
                 
                 <TouchableOpacity
                   style={[
                     styles.quantityButton,
                     { 
                       borderColor: colors.border,
                       backgroundColor: colors.background,
                     }
                   ]}
                   onPress={() => {
                     const newQuantity = Math.min(borrowedQuantity, returnData.quantity + 1);
                     setReturnData(prev => ({ ...prev, quantity: newQuantity }));
                   }}
                   disabled={returnData.quantity >= borrowedQuantity}
                 >
                   <Ionicons 
                     name="add" 
                     size={20} 
                     color={returnData.quantity >= borrowedQuantity ? colors.text + '40' : colors.text} 
                   />
                 </TouchableOpacity>
               </View>
               
               <ThemedText style={styles.quantityLabel}>
                 / {borrowedQuantity} units
               </ThemedText>
             </View>
            {errors.quantity && (
              <ThemedText style={[styles.errorText, { color: colors.error }]}>
                {errors.quantity}
              </ThemedText>
            )}
            {returnData.quantity < borrowedQuantity && (
              <ThemedText style={[styles.partialReturnNote, { color: colors.text + '80' }]}>
                Partial return - {borrowedQuantity - returnData.quantity} units will remain borrowed
              </ThemedText>
            )}
          </View>

          {/* Condition Assessment */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <ThemedText style={styles.sectionTitle}>Condition Assessment</ThemedText>
            <ThemedText style={[styles.sectionSubtitle, { color: colors.text + '80' }]}>
              Select the condition of the returned items
            </ThemedText>
            
            <View style={styles.conditionOptions}>
              {conditionOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.conditionOption,
                    { 
                      borderColor: returnData.condition === option.value ? getConditionColor(option.value) : colors.border,
                      backgroundColor: returnData.condition === option.value ? getConditionColor(option.value) + '10' : 'transparent',
                    }
                  ]}
                  onPress={() => handleConditionChange(option.value)}
                >
                  <View style={styles.conditionOptionContent}>
                    <Ionicons 
                      name={getConditionIcon(option.value) as any} 
                      size={20} 
                      color={getConditionColor(option.value)} 
                    />
                    <View style={styles.conditionOptionText}>
                      <ThemedText style={[
                        styles.conditionOptionLabel,
                        { color: returnData.condition === option.value ? getConditionColor(option.value) : colors.text }
                      ]}>
                        {option.label}
                      </ThemedText>
                      <ThemedText style={[styles.conditionOptionDescription, { color: colors.text + '60' }]}>
                        {option.description}
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Status Check */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <ThemedText style={styles.sectionTitle}>Status Verification</ThemedText>
            <TouchableOpacity 
              style={styles.statusCheckContainer}
              onPress={toggleStatusCheck}
            >
              <View style={[
                styles.checkbox,
                { 
                  borderColor: returnData.statusCheck ? colors.success : colors.border,
                  backgroundColor: returnData.statusCheck ? colors.success : 'transparent',
                }
              ]}>
                {returnData.statusCheck && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <View style={styles.statusCheckText}>
                <ThemedText style={styles.statusCheckLabel}>
                  I have verified the condition and quantity of the returned items
                </ThemedText>
                <ThemedText style={[styles.statusCheckDescription, { color: colors.text + '60' }]}>
                  Please ensure all items are accounted for and in the stated condition
                </ThemedText>
              </View>
            </TouchableOpacity>
            {errors.statusCheck && (
              <ThemedText style={[styles.errorText, { color: colors.error }]}>
                {errors.statusCheck}
              </ThemedText>
            )}
          </View>

          {/* Return Notes */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <ThemedText style={styles.sectionTitle}>Return Notes (Optional)</ThemedText>
            <TextInput
              style={[
                styles.notesInput,
                { 
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.text,
                }
              ]}
              value={returnData.notes}
              onChangeText={handleNotesChange}
              placeholder="Add any notes about the return..."
              placeholderTextColor={colors.text + '60'}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={onClose}
            disabled={loading}
          >
            <ThemedText style={[styles.cancelButtonText, { color: colors.text }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.confirmButton,
              { 
                backgroundColor: loading ? colors.text + '30' : colors.success,
                opacity: loading ? 0.6 : 1,
              }
            ]}
            onPress={handleConfirm}
            disabled={loading}
          >
            <ThemedText style={styles.confirmButtonText}>
              {loading ? 'Processing...' : `Return ${returnData.quantity} Unit${returnData.quantity !== 1 ? 's' : ''}`}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
   resourceInfo: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   iconContainer: {
     width: 36,
     height: 36,
     borderRadius: 18,
     justifyContent: 'center',
     alignItems: 'center',
     marginRight: 10,
   },
   resourceDetails: {
     flex: 1,
   },
   resourceName: {
     fontSize: 15,
     fontWeight: '600',
     marginBottom: 4,
   },
   resourceMeta: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 12,
   },
   resourceCategory: {
     fontSize: 12,
     opacity: 0.7,
     textTransform: 'capitalize',
   },
   borrowedQuantity: {
     fontSize: 12,
     fontWeight: '500',
   },
   quantityContainer: {
     alignItems: 'center',
     marginBottom: 8,
   },
   quantityControls: {
     flexDirection: 'row',
     alignItems: 'center',
     marginBottom: 8,
   },
   quantityButton: {
     width: 40,
     height: 40,
     borderRadius: 8,
     borderWidth: 1,
     justifyContent: 'center',
     alignItems: 'center',
   },
   quantityInput: {
     borderWidth: 1,
     borderRadius: 8,
     paddingHorizontal: 12,
     paddingVertical: 8,
     fontSize: 16,
     minWidth: 80,
     textAlign: 'center',
     marginHorizontal: 8,
   },
  quantityLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  partialReturnNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  conditionOptions: {
    gap: 8,
  },
  conditionOption: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  conditionOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  conditionOptionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  conditionOptionDescription: {
    fontSize: 12,
  },
  statusCheckContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  statusCheckText: {
    flex: 1,
  },
  statusCheckLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  statusCheckDescription: {
    fontSize: 12,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 80,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
