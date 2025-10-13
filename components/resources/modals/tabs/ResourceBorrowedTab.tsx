import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useResources } from '@/contexts/ResourceContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePlatform } from '@/hooks/usePlatform';
import { MultiResourceTransaction, ResourceTransaction } from '@/types/Resource';

interface ResourceBorrowedTabProps {
  resourceId: string;
}

export function ResourceBorrowedTab({ resourceId }: ResourceBorrowedTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isWeb } = usePlatform();
  const { getResource, getActiveTransactions, getActiveMultiTransactions } = useResources();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const itemsPerPage = 10; // Load 10 borrowers at a time

  // Get all active transactions for this specific resource
  const allActiveTransactions = getActiveTransactions().filter(t => t.resourceId === resourceId);
  const allActiveMultiTransactions = getActiveMultiTransactions().filter(t => 
    t.items.some(item => item.resourceId === resourceId && item.status === 'active')
  );

  const resource = getResource(resourceId);
  
  // Combine all borrowers into a single array for pagination
  const allBorrowers = [
    ...allActiveTransactions.map(transaction => ({ type: 'single' as const, data: transaction })),
    ...allActiveMultiTransactions.map(multiTransaction => {
      const activeItem = multiTransaction.items.find(item => 
        item.resourceId === resourceId && item.status === 'active'
      );
      return activeItem ? { type: 'multi' as const, data: multiTransaction, item: activeItem } : null;
    }).filter((item): item is { type: 'multi'; data: MultiResourceTransaction; item: any } => item !== null)
  ];
  
  // Calculate pagination
  const totalItems = allBorrowers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasMore = currentPage < totalPages;
  
  // Get paginated borrowers
  const paginatedBorrowers = allBorrowers.slice(0, currentPage * itemsPerPage);

  // Handle load more
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setCurrentPage(prev => prev + 1);
    setIsLoadingMore(false);
  };

  if (totalItems === 0) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={colors.text} style={{ opacity: 0.5 }} />
          <ThemedText style={styles.emptyText}>No active borrowings for this resource</ThemedText>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.contentWrapper, isWeb && styles.webContentWrapper]}>
        {/* Paginated Borrowers */}
        {paginatedBorrowers.map((borrower, index) => {
          if (borrower.type === 'single') {
            return (
              <CompactBorrowerCard 
                key={borrower.data.id} 
                transaction={borrower.data} 
                resource={resource}
                isLast={index === paginatedBorrowers.length - 1}
              />
            );
          } else if (borrower.type === 'multi') {
            return (
              <CompactMultiBorrowerCard 
                key={`${borrower.data.id}-${borrower.item.id}`} 
                multiTransaction={borrower.data} 
                item={borrower.item}
                resource={resource}
                isLast={index === paginatedBorrowers.length - 1}
              />
            );
          }
          return null;
        })}
        
        {/* Load More Button */}
        {hasMore && (
          <LoadMoreButton
            onPress={handleLoadMore}
            loading={isLoadingMore}
            hasMore={hasMore}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            loadedItems={paginatedBorrowers.length}
          />
        )}
        
        {/* Show total count when all items are loaded */}
        {!hasMore && totalItems > 0 && (
          <View style={styles.allLoadedIndicator}>
            <ThemedText style={[styles.allLoadedText, { color: colors.text }]} numberOfLines={1}>
              All {totalItems} borrowers loaded
            </ThemedText>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// Compact Borrower Card for better scalability
interface CompactBorrowerCardProps {
  transaction: ResourceTransaction;
  resource?: any;
  isLast?: boolean;
}

function CompactBorrowerCard({ transaction, resource, isLast = false }: CompactBorrowerCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isOverdue = transaction.dueDate ? transaction.dueDate < new Date() : false;

  return (
    <View style={[styles.compactCard, { backgroundColor: colors.surface, borderColor: colors.border }, isLast && styles.lastCard]}>
      <View style={styles.compactHeader}>
        <View style={styles.compactImageContainer}>
          {transaction.borrowerPicture ? (
            <Image source={{ uri: transaction.borrowerPicture }} style={styles.compactImage} />
          ) : (
            <View style={[styles.compactImagePlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="person-outline" size={16} color={colors.primary} />
            </View>
          )}
        </View>
        
        <View style={styles.compactInfo}>
          <ThemedText style={styles.compactName}>{transaction.borrowerName}</ThemedText>
          <ThemedText style={styles.compactDetails}>
            {transaction.quantity} units • {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'Unknown'}
          </ThemedText>
          {transaction.borrowerDepartment && (
            <ThemedText style={styles.compactDepartment}>{transaction.borrowerDepartment}</ThemedText>
          )}
        </View>
        
        <View style={[styles.compactStatusBadge, { 
          backgroundColor: isOverdue ? colors.error + '20' : colors.success + '20' 
        }]}>
          <ThemedText style={[styles.compactStatusText, { 
            color: isOverdue ? colors.error : colors.success 
          }]}>
            {isOverdue ? 'Overdue' : 'Active'}
          </ThemedText>
        </View>
      </View>
      
      {transaction.dueDate && (
        <View style={styles.compactFooter}>
          <ThemedText style={[styles.dueDateText, { color: colors.text }]}>
            Due: {new Date(transaction.dueDate).toLocaleDateString()}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

// Compact Multi Borrower Card
interface CompactMultiBorrowerCardProps {
  multiTransaction: MultiResourceTransaction;
  item: any;
  resource?: any;
  isLast?: boolean;
}

function CompactMultiBorrowerCard({ multiTransaction, item, resource, isLast = false }: CompactMultiBorrowerCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isOverdue = item.dueDate ? item.dueDate < new Date() : false;

  return (
    <View style={[styles.compactCard, { backgroundColor: colors.surface, borderColor: colors.border }, isLast && styles.lastCard]}>
      <View style={styles.compactHeader}>
        <View style={styles.compactImageContainer}>
          {multiTransaction.borrowerPicture ? (
            <Image source={{ uri: multiTransaction.borrowerPicture }} style={styles.compactImage} />
          ) : (
            <View style={[styles.compactImagePlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="person-outline" size={16} color={colors.primary} />
            </View>
          )}
        </View>
        
        <View style={styles.compactInfo}>
          <ThemedText style={styles.compactName}>{multiTransaction.borrowerName}</ThemedText>
          <ThemedText style={styles.compactDetails}>
            {item.quantity} units • {multiTransaction.createdAt ? new Date(multiTransaction.createdAt).toLocaleDateString() : 'Unknown'}
          </ThemedText>
          {multiTransaction.borrowerDepartment && (
            <ThemedText style={styles.compactDepartment}>{multiTransaction.borrowerDepartment}</ThemedText>
          )}
        </View>
        
        <View style={[styles.compactStatusBadge, { 
          backgroundColor: isOverdue ? colors.error + '20' : colors.success + '20' 
        }]}>
          <ThemedText style={[styles.compactStatusText, { 
            color: isOverdue ? colors.error : colors.success 
          }]}>
            {isOverdue ? 'Overdue' : 'Active'}
          </ThemedText>
        </View>
      </View>
      
      {item.dueDate && (
        <View style={styles.compactFooter}>
          <ThemedText style={[styles.dueDateText, { color: colors.text }]}>
            Due: {new Date(item.dueDate).toLocaleDateString()}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

// Load More Button Component
interface LoadMoreButtonProps {
  onPress: () => void;
  loading: boolean;
  hasMore: boolean;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  loadedItems: number;
}

function LoadMoreButton({ 
  onPress, 
  loading, 
  hasMore, 
  currentPage, 
  totalPages, 
  totalItems, 
  loadedItems 
}: LoadMoreButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.loadMoreContainer}>
      <TouchableOpacity
        style={[
          styles.loadMoreButton,
          { 
            backgroundColor: colors.primary,
            borderColor: colors.primary,
            opacity: loading ? 0.6 : 1,
          }
        ]}
        onPress={onPress}
        disabled={loading || !hasMore}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="refresh" size={16} color="#fff" style={styles.loadingIcon} />
            <ThemedText style={styles.loadMoreButtonText}>Loading...</ThemedText>
          </View>
        ) : (
          <View style={styles.loadMoreContent}>
            <Ionicons name="chevron-down" size={16} color="#fff" />
            <ThemedText style={styles.loadMoreButtonText}>Load More</ThemedText>
          </View>
        )}
      </TouchableOpacity>
      
      <ThemedText style={[styles.loadMoreInfo, { color: colors.text }]}>
        Showing {loadedItems} of {totalItems} borrowers
      </ThemedText>
    </View>
  );
}

interface BorrowerCardProps {
  transaction: ResourceTransaction;
  resource?: any;
}

function BorrowerCard({ transaction, resource }: BorrowerCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const isOverdue = transaction.dueDate ? transaction.dueDate < new Date() : false;

  return (
    <View style={[styles.borrowerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.borrowerHeader}>
        <View style={styles.borrowerImageContainer}>
          {transaction.borrowerPicture ? (
            <Image source={{ uri: transaction.borrowerPicture }} style={styles.borrowerImage} />
          ) : (
            <View style={[styles.borrowerImagePlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="person-outline" size={24} color={colors.primary} />
            </View>
          )}
        </View>
        <View style={styles.borrowerInfo}>
          <ThemedText style={styles.borrowerName}>{transaction.borrowerName}</ThemedText>
          {transaction.borrowerDepartment && (
            <ThemedText style={styles.borrowerDepartment}>{transaction.borrowerDepartment}</ThemedText>
          )}
          {transaction.borrowerContact && (
            <ThemedText style={styles.borrowerContact}>{transaction.borrowerContact}</ThemedText>
          )}
        </View>
        <View style={[styles.statusBadge, { 
          backgroundColor: isOverdue ? colors.error + '20' : colors.success + '20' 
        }]}>
          <ThemedText style={[styles.statusText, { 
            color: isOverdue ? colors.error : colors.success 
          }]}>
            {isOverdue ? 'Overdue' : 'Active'}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.borrowerDetails}>
        <BorrowerDetailRow
          label="Resource"
          value={resource?.name || 'Unknown Resource'}
        />
        <BorrowerDetailRow
          label="Quantity Borrowed"
          value={transaction.quantity.toString()}
        />
        <BorrowerDetailRow
          label="Borrowed Date"
          value={transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString() : 'Unknown'}
        />
        {transaction.dueDate && (
          <BorrowerDetailRow
            label="Due Date"
            value={transaction.dueDate ? new Date(transaction.dueDate).toLocaleDateString() : 'Unknown'}
            isOverdue={isOverdue}
          />
        )}
        {transaction.notes && (
          <View style={styles.borrowerNotes}>
            <ThemedText style={styles.borrowerDetailLabel}>Notes:</ThemedText>
            <ThemedText style={styles.borrowerNotesText}>{transaction.notes}</ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

interface MultiBorrowerCardProps {
  multiTransaction: MultiResourceTransaction;
  item: any;
  resource?: any;
}

function MultiBorrowerCard({ multiTransaction, item, resource }: MultiBorrowerCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const isOverdue = item.dueDate ? item.dueDate < new Date() : false;

  return (
    <View style={[styles.borrowerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.borrowerHeader}>
        <View style={styles.borrowerImageContainer}>
          {multiTransaction.borrowerPicture ? (
            <Image source={{ uri: multiTransaction.borrowerPicture }} style={styles.borrowerImage} />
          ) : (
            <View style={[styles.borrowerImagePlaceholder, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="person-outline" size={24} color={colors.primary} />
            </View>
          )}
        </View>
        <View style={styles.borrowerInfo}>
          <ThemedText style={styles.borrowerName}>{multiTransaction.borrowerName}</ThemedText>
          {multiTransaction.borrowerDepartment && (
            <ThemedText style={styles.borrowerDepartment}>{multiTransaction.borrowerDepartment}</ThemedText>
          )}
          {multiTransaction.borrowerContact && (
            <ThemedText style={styles.borrowerContact}>{multiTransaction.borrowerContact}</ThemedText>
          )}
        </View>
        <View style={[styles.statusBadge, { 
          backgroundColor: isOverdue ? colors.error + '20' : colors.success + '20' 
        }]}>
          <ThemedText style={[styles.statusText, { 
            color: isOverdue ? colors.error : colors.success 
          }]}>
            {isOverdue ? 'Overdue' : 'Active'}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.borrowerDetails}>
        <BorrowerDetailRow
          label="Resource"
          value={resource?.name || 'Unknown Resource'}
        />
        <BorrowerDetailRow
          label="Quantity Borrowed"
          value={item.quantity.toString()}
        />
        <BorrowerDetailRow
          label="Borrowed Date"
          value={multiTransaction.createdAt ? new Date(multiTransaction.createdAt).toLocaleDateString() : 'Unknown'}
        />
        {item.dueDate && (
          <BorrowerDetailRow
            label="Due Date"
            value={item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'Unknown'}
            isOverdue={isOverdue}
          />
        )}
        {item.notes && (
          <View style={styles.borrowerNotes}>
            <ThemedText style={styles.borrowerDetailLabel}>Item Notes:</ThemedText>
            <ThemedText style={styles.borrowerNotesText}>{item.notes}</ThemedText>
          </View>
        )}
        {multiTransaction.notes && (
          <View style={styles.borrowerNotes}>
            <ThemedText style={styles.borrowerDetailLabel}>Transaction Notes:</ThemedText>
            <ThemedText style={styles.borrowerNotesText}>{multiTransaction.notes}</ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

interface BorrowerDetailRowProps {
  label: string;
  value: string;
  isOverdue?: boolean;
}

function BorrowerDetailRow({ label, value, isOverdue }: BorrowerDetailRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.borrowerDetailRow}>
      <ThemedText style={styles.borrowerDetailLabel}>{label}:</ThemedText>
      <ThemedText style={[
        styles.borrowerDetailValue,
        isOverdue && { color: colors.error }
      ]}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  contentWrapper: {
    flex: 1,
  },
  webContentWrapper: {
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    opacity: 0.7,
  },
  
  // Compact card styles
  compactCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  lastCard: {
    marginBottom: 0,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactImageContainer: {
    marginRight: 10,
  },
  compactImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  compactImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactInfo: {
    flex: 1,
    marginRight: 8,
  },
  compactName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  compactDetails: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  compactDepartment: {
    fontSize: 11,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  compactStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  compactStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  compactFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  dueDateText: {
    fontSize: 11,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  
  // Load More styles
  loadMoreContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 140,
  },
  loadMoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingIcon: {
    // Add rotation animation would be nice here
  },
  loadMoreButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadMoreInfo: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 8,
    textAlign: 'center',
  },
  allLoadedIndicator: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    paddingVertical: 12,
  },
  allLoadedText: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  borrowerCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  borrowerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  borrowerImageContainer: {
    marginRight: 12,
  },
  borrowerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  borrowerImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  borrowerInfo: {
    flex: 1,
  },
  borrowerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  borrowerDepartment: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  borrowerContact: {
    fontSize: 13,
    opacity: 0.6,
  },
  borrowerDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  borrowerDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  borrowerDetailLabel: {
    fontSize: 13,
    opacity: 0.7,
    flex: 1,
  },
  borrowerDetailValue: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  borrowerNotes: {
    marginTop: 8,
  },
  borrowerNotesText: {
    fontSize: 13,
    opacity: 0.8,
    marginTop: 4,
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
