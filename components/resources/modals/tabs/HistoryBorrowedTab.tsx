import { Ionicons } from '@expo/vector-icons';
import {
    ScrollView,
    StyleSheet,
    View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useResources } from '@/contexts/ResourceContext';
import { useBorrowerCalculations } from '@/hooks/useBorrowerCalculations';
import { useColorScheme } from '@/hooks/useColorScheme';

interface HistoryBorrowedTabProps {
  selectedBorrower: string;
}

export function HistoryBorrowedTab({ selectedBorrower }: HistoryBorrowedTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { 
    getBorrowerTransactions,
    getResource
  } = useResources();

  const transactions = selectedBorrower ? getBorrowerTransactions(selectedBorrower) : { single: [], multi: [] };
  
  // Use the updated calculations hook to get all transactions
  const borrowerCalculations = useBorrowerCalculations({
    singleTransactions: transactions.single,
    multiTransactions: transactions.multi,
  });
  
  const { allTransactions } = borrowerCalculations;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      case 'active': return colors.primary;
      default: return colors.text;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      case 'active': return 'time-outline';
      default: return 'help-circle-outline';
    }
  };

  if (allTransactions.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="time-outline" size={48} color={colors.text} style={{ opacity: 0.5 }} />
        <ThemedText style={styles.emptyText}>No transactions found</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.transactionsList} showsVerticalScrollIndicator={false}>
      {/* All Transactions - Single and Multi */}
      {allTransactions.map((transaction) => {
        // Check if it's a single transaction or multi transaction
        const isMultiTransaction = 'items' in transaction;
        
        if (isMultiTransaction) {
          // Handle multi-resource transactions
          const multiTransaction = transaction as any;
          return (
            <View key={multiTransaction.id} style={[styles.multiTransactionCard, { 
              backgroundColor: colors.surface, 
              borderColor: colors.border 
            }]}>
              <View style={styles.multiTransactionHeader}>
                <Ionicons name="list-outline" size={20} color={colors.primary} />
                <View style={styles.multiTransactionInfo}>
                  <ThemedText style={styles.multiTransactionTitle}>
                    Multi-Resource Borrowing ({multiTransaction.items.length} items)
                  </ThemedText>
                  <ThemedText style={styles.multiTransactionDate}>
                    {multiTransaction.createdAt ? new Date(multiTransaction.createdAt).toLocaleDateString() : 'Unknown'}
                  </ThemedText>
                </View>
                <View style={styles.transactionActions}>
                  <View style={[styles.statusBadge, { 
                    backgroundColor: getStatusColor(multiTransaction.status) + '20' 
                  }]}>
                    <Ionicons 
                      name={getStatusIcon(multiTransaction.status) as any} 
                      size={12} 
                      color={getStatusColor(multiTransaction.status)} 
                      style={{ marginRight: 4 }}
                    />
                    <ThemedText style={[styles.statusText, { 
                      color: getStatusColor(multiTransaction.status) 
                    }]}>
                      {multiTransaction.status.charAt(0).toUpperCase() + multiTransaction.status.slice(1)}
                    </ThemedText>
                  </View>
                </View>
              </View>

              {multiTransaction.items.map((item: any) => {
                const resource = getResource(item.resourceId);
                if (!resource) return null;

                return (
                  <View key={item.id} style={styles.multiItemCard}>
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
                          backgroundColor: getStatusColor(item.status) + '20' 
                        }]}>
                          <ThemedText style={[styles.statusText, { 
                            color: getStatusColor(item.status) 
                          }]}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                    
                    {item.dueDate && (
                      <View style={styles.multiItemDetails}>
                        <ThemedText style={styles.multiItemDueDate}>
                          Due: {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Unknown'}
                        </ThemedText>
                        {item.returnedAt && (
                          <ThemedText style={styles.multiItemReturnedDate}>
                            Returned: {item.returnedAt ? new Date(item.returnedAt).toLocaleDateString() : 'Unknown'}
                          </ThemedText>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        } else {
          // Handle single resource transactions
          const singleTransaction = transaction as any;
          const resource = getResource(singleTransaction.resourceId);
          if (!resource) return null;

          return (
            <View key={singleTransaction.id} style={[styles.transactionCard, { 
              backgroundColor: colors.surface, 
              borderColor: colors.border 
            }]}>
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
                    backgroundColor: getStatusColor(singleTransaction.status) + '20' 
                  }]}>
                    <Ionicons 
                      name={getStatusIcon(singleTransaction.status) as any} 
                      size={12} 
                      color={getStatusColor(singleTransaction.status)} 
                      style={{ marginRight: 4 }}
                    />
                    <ThemedText style={[styles.statusText, { 
                      color: getStatusColor(singleTransaction.status) 
                    }]}>
                      {singleTransaction.status.charAt(0).toUpperCase() + singleTransaction.status.slice(1)}
                    </ThemedText>
                  </View>
                </View>
              </View>
              
              <View style={styles.transactionDetails}>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Quantity:</ThemedText>
                  <ThemedText style={styles.detailValue}>{singleTransaction.quantity}</ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>Borrowed:</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {singleTransaction.createdAt ? new Date(singleTransaction.createdAt).toLocaleDateString() : 'Unknown'}
                  </ThemedText>
                </View>
                {singleTransaction.returnedAt && (
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Returned:</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {singleTransaction.returnedAt ? new Date(singleTransaction.returnedAt).toLocaleDateString() : 'Unknown'}
                    </ThemedText>
                  </View>
                )}
                {singleTransaction.dueDate && (
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Due Date:</ThemedText>
                    <ThemedText style={styles.detailValue}>
                      {singleTransaction.dueDate ? new Date(singleTransaction.dueDate).toLocaleDateString() : 'Unknown'}
                    </ThemedText>
                  </View>
                )}
                {singleTransaction.notes && (
                  <View style={styles.detailRow}>
                    <ThemedText style={styles.detailLabel}>Notes:</ThemedText>
                    <ThemedText style={styles.detailValue}>{singleTransaction.notes}</ThemedText>
                  </View>
                )}
              </View>
            </View>
          );
        }
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  transactionsList: {
    marginTop: 8,
  },
  transactionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  multiTransactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  multiTransactionInfo: {
    flex: 1,
    marginLeft: 8,
  },
  multiTransactionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  multiTransactionDate: {
    fontSize: 12,
    opacity: 0.7,
  },
  multiItemCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
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
  multiItemReturnedDate: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    color: '#666',
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
