import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
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
import { useResources } from '@/contexts/ResourceContext';
import { useBorrowerCalculations } from '@/hooks/useBorrowerCalculations';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';
import { BorrowerProfile, MultiResourceTransaction, ResourceTransaction } from '@/types/Resource';
import { ActiveBorrowedTab } from './tabs/ActiveBorrowedTab';
import { HistoryBorrowedTab } from './tabs/HistoryBorrowedTab';

interface BorrowerDashboardProps {
  visible: boolean;
  borrowerName?: string;
  onClose?: () => void;
}

export function BorrowerDashboard({ visible, borrowerName, onClose }: BorrowerDashboardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { 
    getBorrowerProfile, 
    getAllBorrowers, 
    getBorrowerTransactions,
    getBorrowerStats,
    returnResource,
    returnMultiResourceItem,
    getResource
  } = useResources();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBorrower, setSelectedBorrower] = useState<string>(borrowerName || '');
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [borrowers, setBorrowers] = useState<BorrowerProfile[]>([]);
  const [borrowerProfile, setBorrowerProfile] = useState<BorrowerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Hybrid RAMP (Responsive Animated Modal Pattern)
  const {
    isWeb,
    fadeAnim,
    scaleAnim,
    slideAnim,
    handleClose,
  } = useHybridRamp({ visible, onClose: onClose || (() => {}) });

  // Load borrowers on component mount
  useEffect(() => {
    const loadBorrowers = async () => {
      try {
        setIsLoading(true);
        const allBorrowers = await getAllBorrowers();
        setBorrowers(allBorrowers);
      } catch (error) {
        console.error('Failed to load borrowers:', error);
        setBorrowers([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (visible) {
      loadBorrowers();
    }
  }, [visible, getAllBorrowers]);

  // Load borrower profile when selected borrower changes
  useEffect(() => {
    const loadBorrowerProfile = async () => {
      if (selectedBorrower) {
        try {
          const profile = await getBorrowerProfile(selectedBorrower);
          setBorrowerProfile(profile);
        } catch (error) {
          console.error('Failed to load borrower profile:', error);
          setBorrowerProfile(null);
        }
      } else {
        setBorrowerProfile(null);
      }
    };

    loadBorrowerProfile();
  }, [selectedBorrower, getBorrowerProfile]);

  const transactions = selectedBorrower ? getBorrowerTransactions(selectedBorrower) : { single: [], multi: [] };

  // Deduplicate borrowers by name to avoid duplicate keys
  const uniqueBorrowers = borrowers.reduce((acc, current) => {
    const existingBorrower = acc.find(borrower => borrower.name === current.name);
    if (!existingBorrower) {
      acc.push(current);
    }
    return acc;
  }, [] as BorrowerProfile[]);

  // Filter borrowers to only show those with active transactions for active tab
  const borrowersWithActiveTransactions = uniqueBorrowers.filter(borrower => {
    const borrowerTransactions = getBorrowerTransactions(borrower.name);
    const hasActiveSingle = borrowerTransactions.single.some(t => t.status === 'active');
    const hasActiveMulti = borrowerTransactions.multi.some(t => t.status === 'active');
    return hasActiveSingle || hasActiveMulti;
  });

  const filteredBorrowers = searchQuery 
    ? uniqueBorrowers.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : uniqueBorrowers;

  const filteredActiveBorrowers = searchQuery 
    ? borrowersWithActiveTransactions.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : borrowersWithActiveTransactions;

  // Use optimized calculations hook
  const borrowerCalculations = useBorrowerCalculations({
    singleTransactions: transactions.single,
    multiTransactions: transactions.multi,
  });

  // Get all active transactions across all borrowers for the tab count (optimized)
  const allBorrowersActiveTransactions = useMemo(() => {
    return borrowersWithActiveTransactions.reduce((total, borrower) => {
      const borrowerTransactions = getBorrowerTransactions(borrower.name);
      const activeSingle = borrowerTransactions.single.filter(t => t.status === 'active').length;
      const activeMulti = borrowerTransactions.multi.filter(t => t.status === 'active').length;
      return total + activeSingle + activeMulti;
    }, 0);
  }, [borrowersWithActiveTransactions, getBorrowerTransactions]);


  const handleReturnSingle = (transaction: ResourceTransaction) => {
    // This will now be handled by the ReturnResourceModal in ActiveBorrowedTab
    // Keep this function for backward compatibility but it should not be called
    console.warn('handleReturnSingle should be handled by ReturnResourceModal');
  };

  const handleReturnMultiItem = (multiTransaction: MultiResourceTransaction, itemId: string) => {
    // This will now be handled by the ReturnResourceModal in ActiveBorrowedTab
    // Keep this function for backward compatibility but it should not be called
    console.warn('handleReturnMultiItem should be handled by ReturnResourceModal');
  };

  const renderBorrowerSelector = () => {
    // Use different filtered lists based on active tab
    const currentFilteredBorrowers = activeTab === 'active' ? filteredActiveBorrowers : filteredBorrowers;
    
    return (
      <View style={styles.section}>
        <View style={styles.selectorHeader}>
          <ThemedText style={styles.sectionTitle}>Select Borrower</ThemedText>
          {selectedBorrower && (
            <ThemedText style={[styles.hintText, { color: colors.text + '70' }]}>
              Tap again to deselect
            </ThemedText>
          )}
        </View>
        
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.text + '60'} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
              color: colors.text 
            }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search borrowers..."
            placeholderTextColor={colors.text + '60'}
          />
        </View>

        {currentFilteredBorrowers.length === 0 ? (
          <View style={styles.emptyBorrowersState}>
            <Ionicons 
              name={activeTab === 'active' ? "checkmark-circle-outline" : "search-outline"} 
              size={32} 
              color={colors.text + '60'} 
            />
            <ThemedText style={[styles.emptyBorrowersText, { color: colors.text + '70' }]}>
              {activeTab === 'active' 
                ? 'No borrowers with active borrowings' 
                : 'No borrowers found'
              }
            </ThemedText>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.borrowersScroll}>
            {currentFilteredBorrowers.map((borrower, index) => (
          <TouchableOpacity
            key={`${borrower.id}-${index}`}
            style={[
              styles.borrowerCard,
              { 
                backgroundColor: selectedBorrower === borrower.name ? colors.primary : colors.surface,
                borderColor: selectedBorrower === borrower.name ? colors.primary : colors.border
              }
            ]}
            onPress={() => {
              // Toggle selection - if same borrower is tapped, deselect
              if (selectedBorrower === borrower.name) {
                setSelectedBorrower('');
              } else {
                setSelectedBorrower(borrower.name);
              }
            }}
          >
            {borrower.picture ? (
              <Image source={{ uri: borrower.picture }} style={styles.borrowerImage} />
            ) : (
              <View style={[styles.borrowerImagePlaceholder, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="person-outline" size={24} color={colors.primary} />
              </View>
            )}
            <ThemedText style={[
              styles.borrowerName,
              { color: selectedBorrower === borrower.name ? '#fff' : colors.text }
            ]}>
              {borrower.name}
            </ThemedText>
            <ThemedText style={[
              styles.borrowerStats,
              { color: selectedBorrower === borrower.name ? '#fff' : colors.text }
            ]}>
              {(() => {
                const borrowerTransactions = getBorrowerTransactions(borrower.name);
                const activeCount = borrowerTransactions.single.filter(t => t.status === 'active').length + 
                                  borrowerTransactions.multi.filter(t => t.status === 'active').length;
                const totalCount = borrowerTransactions.single.length + borrowerTransactions.multi.length;
                return `${activeCount}/${totalCount} active`;
              })()}
            </ThemedText>
            {selectedBorrower === borrower.name && (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  const renderBorrowerProfile = () => {
    if (!borrowerProfile) return null;

    return (
      <View style={styles.section}>
        <View style={styles.profileHeaderSection}>
          <ThemedText style={styles.sectionTitle}>Borrower Profile</ThemedText>
          <TouchableOpacity
            style={[styles.closeProfileButton, { backgroundColor: colors.error + '20' }]}
            onPress={() => setSelectedBorrower('')}
          >
            <Ionicons name="close" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
        
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.profileHeader}>
            {borrowerProfile.picture ? (
              <Image source={{ uri: borrowerProfile.picture }} style={styles.profileImage} />
            ) : (
              <View style={[styles.profileImagePlaceholder, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="person-outline" size={32} color={colors.primary} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <ThemedText style={styles.profileName}>{borrowerProfile.name}</ThemedText>
              {borrowerProfile.department && (
                <ThemedText style={styles.profileDepartment}>{borrowerProfile.department}</ThemedText>
              )}
              {borrowerProfile.contact && (
                <ThemedText style={styles.profileContact}>{borrowerProfile.contact}</ThemedText>
              )}
            </View>
          </View>
          
          <View style={styles.profileStats}>
            {/* Optimized transaction-based metrics with icons */}
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="list-outline" size={16} color={colors.primary} />
              </View>
              <ThemedText style={styles.statValue}>
                {isCalculating ? '...' : borrowerCalculations.totalTransactions}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Total</ThemedText>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.success} />
              </View>
              <ThemedText style={[styles.statValue, { color: colors.success }]}>
                {isCalculating ? '...' : borrowerCalculations.activeTransactions}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Active</ThemedText>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="checkmark-done-outline" size={16} color={colors.primary} />
              </View>
              <ThemedText style={[styles.statValue, { color: colors.primary }]}>
                {isCalculating ? '...' : borrowerCalculations.completedTransactions}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Completed</ThemedText>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: colors.error + '15' }]}>
                <Ionicons name="warning-outline" size={16} color={colors.error} />
              </View>
              <ThemedText style={[styles.statValue, { color: colors.error }]}>
                {isCalculating ? '...' : borrowerCalculations.overdueTransactions}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Overdue</ThemedText>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType={isWeb ? 'none' : 'slide'}
      transparent={isWeb}
      presentationStyle={isWeb ? 'overFullScreen' : getMobileModalConfig().presentationStyle}
      onRequestClose={handleClose}
    >
      {/* Backdrop for web */}
      {isWeb && (
        <Animated.View
          style={[styles.backdrop, { opacity: fadeAnim }]}
        >
          <TouchableOpacity style={styles.backdropTouchable} activeOpacity={1} onPress={handleClose} />
        </Animated.View>
      )}

      {/* Centered animated panel on web; full screen on mobile */}
      <Animated.View
        style={[
          isWeb ? styles.webPanelContainer : styles.mobilePanelContainer,
          isWeb && {
            transform: [
              { scale: scaleAnim },
              { translateY: slideAnim },
            ],
          },
        ]}
      >
      {isWeb ? (
        <ThemedView style={[styles.container, styles.webPanel]}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <ThemedText type="subtitle" style={styles.headerTitle}>Borrower Dashboard</ThemedText>
          {onClose && (
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && { borderBottomColor: colors.primary }]}
            onPress={() => setActiveTab('active')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'active' && { color: colors.primary }]}>
              Active ({allBorrowersActiveTransactions})
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && { borderBottomColor: colors.primary }]}
            onPress={() => setActiveTab('history')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'history' && { color: colors.primary }]}>
              History
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ThemedText style={styles.loadingText}>Loading borrowers...</ThemedText>
          </View>
        ) : (
          <>
            {renderBorrowerSelector()}
            {selectedBorrower && renderBorrowerProfile()}
            {selectedBorrower && activeTab === 'active' && (
              <ActiveBorrowedTab
                selectedBorrower={selectedBorrower}
                onReturnSingle={handleReturnSingle}
                onReturnMultiItem={handleReturnMultiItem}
              />
            )}
            {selectedBorrower && activeTab === 'history' && (
              <HistoryBorrowedTab selectedBorrower={selectedBorrower} />
            )}
          </>
        )}
      </ScrollView>
        </ThemedView>
      ) : (
        <MobileModalSafeAreaWrapper>
          <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <ThemedText type="subtitle" style={styles.headerTitle}>Borrower Dashboard</ThemedText>
          {onClose && (
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && { borderBottomColor: colors.primary }]}
            onPress={() => setActiveTab('active')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'active' && { color: colors.primary }]}>
              Active ({allBorrowersActiveTransactions})
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && { borderBottomColor: colors.primary }]}
            onPress={() => setActiveTab('history')}
          >
            <ThemedText style={[styles.tabText, activeTab === 'history' && { color: colors.primary }]}>
              History
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ThemedText style={styles.loadingText}>Loading borrowers...</ThemedText>
          </View>
        ) : (
          <>
            {renderBorrowerSelector()}
            {selectedBorrower && renderBorrowerProfile()}
            {selectedBorrower && activeTab === 'active' && (
              <ActiveBorrowedTab
                selectedBorrower={selectedBorrower}
                onReturnSingle={handleReturnSingle}
                onReturnMultiItem={handleReturnMultiItem}
              />
            )}
            {selectedBorrower && activeTab === 'history' && (
              <HistoryBorrowedTab selectedBorrower={selectedBorrower} />
            )}
          </>
        )}
      </ScrollView>
          </ThemedView>
        </MobileModalSafeAreaWrapper>
      )}
      </Animated.View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Mobile full-screen container placeholder
  mobilePanelContainer: {
    flex: 1,
  },
  // Web: centered panel container with no flex growth to allow centering
  webPanelContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100000,
    pointerEvents: 'box-none',
  },
  webPanel: {
    width: '90%',
    maxWidth: 1100,
    maxHeight: '90%',
    borderRadius: 16,
    overflow: 'hidden',
    // simple elevation/shadow across platforms
    ...StyleSheet.create({ shadow: {
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16,
    }}).shadow,
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 99999,
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  profileHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  closeProfileButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  hintText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  searchContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 40,
    paddingRight: 12,
    paddingVertical: 10,
    fontSize: 16,
    width: '100%',
  },
  borrowersScroll: {
    marginBottom: 16,
  },
  borrowerCard: {
    width: 120,
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  borrowerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  borrowerImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  borrowerName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  borrowerStats: {
    fontSize: 10,
    opacity: 0.7,
    textAlign: 'center',
  },
  profileCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  profileDepartment: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  profileContact: {
    fontSize: 13,
    opacity: 0.6,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  emptyBorrowersState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyBorrowersText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
});
