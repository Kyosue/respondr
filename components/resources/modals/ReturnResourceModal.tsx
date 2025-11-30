import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MobileModalSafeAreaWrapper, getMobileModalConfig } from '@/components/ui/MobileModalWrapper';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';
import { MultiResourceTransaction, MultiResourceTransactionItem, Resource, ResourceTransaction } from '@/types/Resource';
import { getModalConfig } from '@/utils/modalUtils';

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

  // Hybrid RAMP hook
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose: rampHandleClose } = useHybridRamp({
    visible,
    onClose,
  });

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vehicles': return 'car-outline';
      case 'medical': return 'medkit-outline';
      case 'equipment': return 'construct-outline';
      case 'communication': return 'radio-outline';
      case 'personnel': return 'people-outline';
      case 'tools': return 'hammer-outline';
      case 'supplies': return 'cube-outline';
      default: return 'cube-outline';
    }
  };

  const handleClose = rampHandleClose;

  if (!visible) return null;

  // Render modal content (shared between web and mobile)
  const renderModalContent = () => (
    <View style={styles.mobileContentContainer}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: colors.surface }]}>
            <Ionicons name="close" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <ThemedText type="subtitle" style={styles.title}>
              Return Resource
            </ThemedText>
          </View>
          <View style={styles.headerButton} />
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Resource Information */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Resource Information</ThemedText>
          <View style={[styles.resourceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.resourceHeader}>
              <View style={styles.resourceImageContainer}>
                {resource.images && resource.images.length > 0 ? (
                  <Image 
                    source={{ uri: resource.images[0] }} 
                    style={styles.resourceImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
                    <Ionicons name={getCategoryIcon(resource.category) as any} size={32} color={colors.primary} />
                  </View>
                )}
              </View>
              <View style={styles.resourceDetails}>
                <ThemedText style={styles.resourceName}>{resource.name}</ThemedText>
                <View style={styles.resourceCategoryContainer}>
                  <Ionicons name={getCategoryIcon(resource.category) as any} size={14} color={colors.primary} />
                  <ThemedText style={[styles.resourceCategory, { color: colors.primary }]}>
                    {resource.category.charAt(0).toUpperCase() + resource.category.slice(1)}
                  </ThemedText>
                </View>
                <View style={[styles.availabilityInfo, { backgroundColor: colors.background }]}>
                  <View style={styles.availabilityItem}>
                    <View style={[styles.availabilityIcon, { backgroundColor: colors.primary + '20' }]}>
                      <Ionicons name="cube" size={16} color={colors.primary} />
                    </View>
                    <View>
                      <ThemedText style={styles.availabilityLabel}>Borrowed</ThemedText>
                      <ThemedText style={[styles.availabilityValue, { color: colors.primary }]}>
                        {borrowedQuantity} units
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Return Quantity */}
        <View style={styles.section}>
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
        <View style={styles.section}>
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
        <View style={styles.section}>
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
        <View style={styles.section}>
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
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.cancelButton, { borderColor: colors.border }]}
          onPress={handleClose}
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
    </View>
  );

  // Platform-specific modal rendering
  if (isWeb) {
    // Hybrid RAMP implementation for web
    return (
      <Modal
        visible={visible}
        {...getModalConfig()}
        onRequestClose={handleClose}
        transparent={true}
        animationType="fade"
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={styles.overlayCloseButton} 
            onPress={handleClose}
            activeOpacity={0.7}
          />
          <Animated.View style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ]
            }
          ]}>
            <ThemedView style={styles.modalContent}>
              {renderModalContent()}
            </ThemedView>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }

  // Mobile implementation
  return (
    <Modal
      visible={visible}
      {...getMobileModalConfig()}
      onRequestClose={handleClose}
      statusBarTranslucent={false}
    >
      <MobileModalSafeAreaWrapper backgroundColor={colors.background}>
        <ThemedView style={styles.mobileContainer}>
          {renderModalContent()}
        </ThemedView>
      </MobileModalSafeAreaWrapper>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  overlayCloseButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  container: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2,
  },
  modalContent: {
    flex: 1,
  },
  mobileContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  mobileContentContainer: {
    flex: 1,
    ...Platform.select({
      default: {
        flexDirection: 'column',
      },
    }),
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerButton: {
    minWidth: 80,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    ...Platform.select({
      ios: {
        overflow: 'visible',
      },
      default: {
        overflow: 'hidden',
      },
    }),
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  resourceCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resourceImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  resourceImage: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceDetails: {
    flex: 1,
  },
  resourceName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  resourceCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceCategory: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  availabilityInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
    borderRadius: 8,
  },
  availabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  availabilityLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  availabilityValue: {
    fontSize: 16,
    fontWeight: '600',
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
    gap: 10,
  },
  conditionOption: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    ...Platform.select({
      web: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      default: {
        

      },
    }),
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
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  conditionOptionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  statusCheckContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
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
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusCheckDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 90,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
    ...Platform.select({
      web: {
        paddingBottom: 16,
      },
      default: {
        paddingBottom: 12,
        minHeight: 75,
      },
    }),
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
