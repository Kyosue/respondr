import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useResources } from '@/contexts/ResourceContext';
import { useBorrowerCalculations } from '@/hooks/useBorrowerCalculations';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MultiResourceTransaction, MultiResourceTransactionItem, Resource, ResourceCondition, ResourceTransaction } from '@/types/Resource';
import { ReturnResourceModal } from '../ReturnResourceModal';

interface ActiveBorrowedTabProps {
  selectedBorrower: string;
  onReturnSingle: (transaction: ResourceTransaction) => void;
  onReturnMultiItem: (multiTransaction: MultiResourceTransaction, itemId: string) => void;
}

export function ActiveBorrowedTab({ 
  selectedBorrower, 
  onReturnSingle, 
  onReturnMultiItem 
}: ActiveBorrowedTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { 
    getBorrowerTransactions,
    getResource,
    returnResource,
    returnMultiResourceItem
  } = useResources();

  // Return modal state
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<ResourceTransaction | null>(null);
  const [selectedMultiTransaction, setSelectedMultiTransaction] = useState<MultiResourceTransaction | null>(null);
  const [selectedItem, setSelectedItem] = useState<MultiResourceTransactionItem | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isReturning, setIsReturning] = useState(false);

  const transactions = selectedBorrower ? getBorrowerTransactions(selectedBorrower) : { single: [], multi: [] };
  
  // Use optimized calculations hook
  const borrowerCalculations = useBorrowerCalculations({
    singleTransactions: transactions.single,
    multiTransactions: transactions.multi,
  });
  
  const { activeSingleTransactions, activeMultiTransactions, allActiveTransactions } = borrowerCalculations;

  // Handle return modal opening
  const handleReturnSingle = (transaction: ResourceTransaction) => {
    const resource = getResource(transaction.resourceId);
    if (!resource) return;
    
    setSelectedTransaction(transaction);
    setSelectedMultiTransaction(null);
    setSelectedItem(null);
    setSelectedResource(resource);
    setReturnModalVisible(true);
  };

  const handleReturnMultiItem = (multiTransaction: MultiResourceTransaction, itemId: string) => {
    const item = multiTransaction.items.find(i => i.id === itemId);
    if (!item) return;
    
    const resource = getResource(item.resourceId);
    if (!resource) return;
    
    setSelectedTransaction(null);
    setSelectedMultiTransaction(multiTransaction);
    setSelectedItem(item);
    setSelectedResource(resource);
    setReturnModalVisible(true);
  };

  // Handle return confirmation
  const handleReturnConfirm = async (returnData: {
    quantity: number;
    condition: ResourceCondition;
    notes?: string;
  }) => {
    if (!selectedResource) return;

    try {
      setIsReturning(true);
      
      if (selectedTransaction) {
        // Single resource return
        await returnResource(selectedTransaction.id, returnData);
        onReturnSingle(selectedTransaction);
      } else if (selectedMultiTransaction && selectedItem) {
        // Multi-resource return
        await returnMultiResourceItem(selectedMultiTransaction.id, selectedItem.id, returnData);
        onReturnMultiItem(selectedMultiTransaction, selectedItem.id);
      }
      
      setReturnModalVisible(false);
    } catch (error) {
      console.error('Error returning resource:', error);
      // Error handling is done in the context
    } finally {
      setIsReturning(false);
    }
  };

  const handleReturnModalClose = () => {
    setReturnModalVisible(false);
    setSelectedTransaction(null);
    setSelectedMultiTransaction(null);
    setSelectedItem(null);
    setSelectedResource(null);
  };

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

  const isOverdue = (dueDate?: Date) => {
    if (!dueDate) return false;
    
    // Handle Firestore Timestamp objects
    if (dueDate && typeof dueDate === 'object' && 'toDate' in dueDate) {
      const firestoreDate = (dueDate as any).toDate();
      if (firestoreDate instanceof Date && !isNaN(firestoreDate.getTime())) {
        return firestoreDate < new Date();
      }
    }
    
    // Handle regular Date objects or date strings
    const date = dueDate instanceof Date ? dueDate : new Date(dueDate);
    return !isNaN(date.getTime()) && date < new Date();
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Unknown';
    
    // Handle Firestore Timestamp objects
    if (date && typeof date === 'object' && 'toDate' in date) {
      const firestoreDate = (date as any).toDate();
      if (firestoreDate instanceof Date && !isNaN(firestoreDate.getTime())) {
        return firestoreDate.toLocaleDateString();
      }
    }
    
    // Handle regular Date objects or date strings
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date received:', date, 'Type:', typeof date);
      return 'Invalid Date';
    }
    return dateObj.toLocaleDateString();
  };

  if (allActiveTransactions.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
        <ThemedText style={styles.emptyText}>No active borrowings</ThemedText>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
      {/* Single Resource Transactions */}
      {activeSingleTransactions.map((transaction) => {
        const resource = getResource(transaction.resourceId);
        if (!resource) return null;

        return (
          <View key={transaction.id} style={styles.transactionCard}>
            <View style={styles.transactionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name={getCategoryIcon(resource.category) as any} size={20} color={colors.primary} />
              </View>
              <View style={styles.transactionInfo}>
                <ThemedText style={styles.transactionName}>{resource.name}</ThemedText>
                <ThemedText style={styles.transactionCategory}>{resource.category}</ThemedText>
              </View>
              <View style={styles.transactionActions}>
                <View style={[styles.statusBadge, { 
                  backgroundColor: isOverdue(transaction.dueDate) ? colors.error + '20' : colors.success + '20' 
                }]}>
                  <ThemedText style={[styles.statusText, { 
                    color: isOverdue(transaction.dueDate) ? colors.error : colors.success 
                  }]}>
                    {isOverdue(transaction.dueDate) ? 'Overdue' : 'Active'}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={[styles.returnButton, { backgroundColor: colors.success }]}
                  onPress={() => handleReturnSingle(transaction)}
                >
                  <Ionicons name="return-down-back-outline" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.transactionDetails}>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Quantity:</ThemedText>
                <ThemedText style={styles.detailValue}>{transaction.quantity}</ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Borrowed:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {formatDate(transaction.createdAt)}
                </ThemedText>
              </View>
              {transaction.dueDate && (
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Due Date:</ThemedText>
                  <ThemedText style={[
                    styles.detailValue,
                    isOverdue(transaction.dueDate) && { color: colors.error }
                  ]}>
                    {formatDate(transaction.dueDate)}
                  </ThemedText>
                </View>
              )}
              {transaction.notes && (
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Notes:</ThemedText>
                  <ThemedText style={styles.detailValue}>{transaction.notes}</ThemedText>
                </View>
              )}
            </View>
          </View>
        );
      })}

      {/* Multi-Resource Transactions */}
      {activeMultiTransactions.map((multiTransaction) => {
        const activeItems = multiTransaction.items.filter(item => item.status === 'active');
        const completedItems = multiTransaction.items.filter(item => item.status === 'completed');
        const allItems = [...activeItems, ...completedItems];
        const overdueCount = activeItems.filter(item => isOverdue(item.dueDate)).length;
        
        return (
          <View key={multiTransaction.id} style={styles.multiTransactionCard}>
            <View style={styles.multiTransactionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="list-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.multiTransactionInfo}>
                <ThemedText style={styles.multiTransactionTitle}>
                  Multi-Resource Borrowing
                </ThemedText>
                <ThemedText style={styles.multiTransactionSubtitle}>
                  {activeItems.length} active, {completedItems.length} returned
                  {overdueCount > 0 && ` • ${overdueCount} overdue`}
                </ThemedText>
              </View>
              <View style={styles.multiTransactionMeta}>
                <ThemedText style={styles.multiTransactionDate}>
                  {formatDate(multiTransaction.createdAt)}
                </ThemedText>
                {multiTransaction.notes && (
                  <ThemedText style={styles.multiTransactionNotes} numberOfLines={1}>
                    {multiTransaction.notes}
                  </ThemedText>
                )}
              </View>
            </View>

            {allItems.map((item) => {
              const resource = getResource(item.resourceId);
              if (!resource) return null;

              return (
                <View key={`${multiTransaction.id}-${item.id}`} style={styles.multiItemCard}>
                  <View style={styles.multiItemHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
                      <Ionicons name={getCategoryIcon(resource.category) as any} size={16} color={colors.primary} />
                    </View>
                    <View style={styles.multiItemInfo}>
                      <ThemedText style={styles.multiItemName}>{resource.name}</ThemedText>
                      <ThemedText style={styles.multiItemQuantity}>Qty: {item.quantity}</ThemedText>
                    </View>
                    <View style={styles.multiItemActions}>
                      <View style={[styles.statusBadge, { 
                        backgroundColor: item.status === 'completed' 
                          ? colors.success + '20' 
                          : isOverdue(item.dueDate) 
                            ? colors.error + '20' 
                            : colors.primary + '20'
                      }]}>
                        <ThemedText style={[styles.statusText, { 
                          color: item.status === 'completed' 
                            ? colors.success 
                            : isOverdue(item.dueDate) 
                              ? colors.error 
                              : colors.primary
                        }]}>
                          {item.status === 'completed' 
                            ? 'Returned' 
                            : isOverdue(item.dueDate) 
                              ? 'Overdue' 
                              : 'Active'}
                        </ThemedText>
                      </View>
                      {item.status !== 'completed' && (
                        <TouchableOpacity
                          style={[styles.returnButton, { backgroundColor: colors.success }]}
                          onPress={() => handleReturnMultiItem(multiTransaction, item.id)}
                        >
                          <Ionicons name="return-down-back-outline" size={16} color="#fff" />
                        </TouchableOpacity>
                      )}
                      {item.status === 'completed' && (
                        <View style={[styles.completedStatus, { backgroundColor: colors.success + '20' }]}>
                          <Ionicons name="checkmark-outline" size={16} color={colors.success} />
                        </View>
                      )}
                    </View>
                  </View>
                  
                  {item.dueDate && (
                    <View style={styles.multiItemDetails}>
                      <ThemedText style={[
                        styles.multiItemDueDate,
                        isOverdue(item.dueDate) && { color: colors.error }
                      ]}>
                        Due: {formatDate(item.dueDate)}
                      </ThemedText>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        );
      })}
      </ScrollView>

      {/* Return Resource Modal */}
      {selectedResource && (
        <ReturnResourceModal
          visible={returnModalVisible}
          onClose={handleReturnModalClose}
          onConfirm={handleReturnConfirm}
          transaction={selectedTransaction || undefined}
          multiTransaction={selectedMultiTransaction || undefined}
          item={selectedItem || undefined}
          resource={selectedResource}
          loading={isReturning}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  transactionsList: {
    marginTop: 8,
  },
  transactionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 12,
    opacity: 0.7,
    textTransform: 'capitalize',
  },
  transactionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  returnButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  completedStatus: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  transactionDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    opacity: 0.7,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  multiTransactionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  multiTransactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  multiTransactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  multiTransactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  multiTransactionSubtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  multiTransactionMeta: {
    alignItems: 'flex-end',
  },
  multiTransactionDate: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  multiTransactionNotes: {
    fontSize: 11,
    opacity: 0.6,
    fontStyle: 'italic',
    maxWidth: 120,
  },
  multiItemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  multiItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  multiItemInfo: {
    flex: 1,
    marginLeft: 8,
  },
  multiItemName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  multiItemQuantity: {
    fontSize: 12,
    opacity: 0.7,
  },
  multiItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  multiItemDetails: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  multiItemDueDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
});
