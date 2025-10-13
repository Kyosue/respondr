import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePlatform } from '@/hooks/usePlatform';
import { HistoryAction, ResourceHistory } from '@/types/Resource';
import { SyncManager } from '@/utils/syncManager';

interface ResourceHistoryTabProps {
  resourceId: string;
  history: ResourceHistory[];
}

export function ResourceHistoryTab({ history }: ResourceHistoryTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isWeb } = usePlatform();
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const itemsPerPage = 20; // Load 20 items at a time (more compact design)
  
  // Expansion state for individual history entries
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  // Reset pagination when history changes (new entries added)
  useEffect(() => {
    setCurrentPage(1);
  }, [history.length]);

  // Fetch user names for all unique user IDs in history
  useEffect(() => {
    const fetchUserNames = async () => {
      if (history.length === 0) {
        setLoading(false);
        return;
      }

      const uniqueUserIds = [...new Set(history.map(entry => entry.userId))];
      const syncManager = SyncManager.getInstance();
      const userNamesMap: Record<string, string> = {};

      try {
        // Fetch user data for each unique user ID
        await Promise.all(
          uniqueUserIds.map(async (userId) => {
            try {
              const userData = await syncManager.getUserData(userId);
              if (userData) {
                userNamesMap[userId] = userData.fullName || userData.username;
              } else {
                userNamesMap[userId] = userId; // Fallback to ID if user not found
              }
            } catch (error) {
              console.warn(`Failed to fetch user data for ${userId}:`, error);
              userNamesMap[userId] = userId; // Fallback to ID on error
            }
          })
        );

        setUserNames(userNamesMap);
      } catch (error) {
        console.error('Error fetching user names:', error);
        // Set fallback names
        uniqueUserIds.forEach(userId => {
          userNamesMap[userId] = userId;
        });
        setUserNames(userNamesMap);
      } finally {
        setLoading(false);
      }
    };

    fetchUserNames();
  }, [history]);

  if (history.length === 0) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color={colors.text} style={{ opacity: 0.5 }} />
          <ThemedText style={[styles.emptyText, { color: colors.text }]}>No history available</ThemedText>
        </View>
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <SectionHeader icon="time" title="Resource History" />
        <View style={styles.loadingState}>
          <ThemedText style={[styles.loadingText, { color: colors.text }]}>Loading user information...</ThemedText>
        </View>
      </ScrollView>
    );
  }

  // Calculate pagination
  const totalItems = history.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasMore = currentPage < totalPages;
  
  // Get paginated history (first N items)
  const paginatedHistory = history.slice(0, currentPage * itemsPerPage);

  // Group paginated history by date
  const groupedHistory = groupHistoryByDate(paginatedHistory);

  // Sort date groups by date (newest first)
  const sortedDateGroups = Object.entries(groupedHistory).sort(([dateA], [dateB]) => {
    // Handle 'Unknown' dates by putting them at the end
    if (dateA === 'Unknown') return 1;
    if (dateB === 'Unknown') return -1;
    
    // Compare dates (newest first)
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  // Handle load more
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setCurrentPage(prev => prev + 1);
    setIsLoadingMore(false);
  };

  // Handle entry expansion toggle
  const toggleEntryExpansion = (entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={[styles.contentWrapper, isWeb && styles.webContentWrapper]}>
        <SectionHeader icon="time" title="Resource History" />
        {sortedDateGroups.map(([date, entries]) => (
          <DateGroup 
            key={date} 
            date={date} 
            entries={entries} 
            userNames={userNames}
            expandedEntries={expandedEntries}
            onToggleExpansion={toggleEntryExpansion}
          />
        ))}
        
        {/* Load More Button */}
        {hasMore && (
          <LoadMoreButton
            onPress={handleLoadMore}
            loading={isLoadingMore}
            hasMore={hasMore}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            loadedItems={paginatedHistory.length}
          />
        )}
        
        {/* Show total count when all items are loaded */}
        {!hasMore && totalItems > 0 && (
          <View style={styles.allLoadedIndicator}>
            <ThemedText style={[styles.allLoadedText, { color: colors.text }]} numberOfLines={1}>
              All {totalItems} history entries loaded
            </ThemedText>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// Helper function to group history by date
function groupHistoryByDate(history: ResourceHistory[]) {
  const grouped = history.reduce((groups, entry) => {
    const date = entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : 'Unknown';
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {} as Record<string, ResourceHistory[]>);

  // Sort entries within each date group by timestamp (newest first)
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  });

  return grouped;
}

interface SectionHeaderProps {
  icon: string;
  title: string;
}

function SectionHeader({ icon, title }: SectionHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon as any} size={18} color={colors.primary} />
      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>{title}</ThemedText>
    </View>
  );
}

interface DateGroupProps {
  date: string;
  entries: ResourceHistory[];
  userNames: Record<string, string>;
  expandedEntries: Set<string>;
  onToggleExpansion: (entryId: string) => void;
}

function DateGroup({ date, entries, userNames, expandedEntries, onToggleExpansion }: DateGroupProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.dateGroup}>
      <View style={[styles.dateHeader, { backgroundColor: colors.surface }]}>
        <ThemedText style={[styles.dateText, { color: colors.text }]}>{date}</ThemedText>
        <ThemedText style={[styles.entryCount, { color: colors.text }]}>{entries.length} entries</ThemedText>
      </View>
      <View style={styles.entriesContainer}>
        {entries.map((entry, index) => (
          <HistoryItem 
            key={entry.id} 
            entry={entry} 
            isLast={index === entries.length - 1} 
            userName={userNames[entry.userId] || entry.userId}
            isExpanded={expandedEntries.has(entry.id)}
            onToggleExpansion={() => onToggleExpansion(entry.id)}
          />
        ))}
      </View>
    </View>
  );
}

interface HistoryItemProps {
  entry: ResourceHistory;
  isLast?: boolean;
  userName: string;
  isExpanded: boolean;
  onToggleExpansion: () => void;
}

function HistoryItem({ entry, isLast = false, userName, isExpanded, onToggleExpansion }: HistoryItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.historyItem, isLast && styles.lastHistoryItem]}>
      <TouchableOpacity 
        style={[
          styles.historyItemContent,
          { backgroundColor: isExpanded ? colors.surface + '40' : 'transparent' }
        ]}
        onPress={onToggleExpansion}
        activeOpacity={0.6}
      >
        <View style={[styles.historyIcon, { backgroundColor: getActionColor(entry.action) + '15' }]}>
          <Ionicons 
            name={getHistoryIcon(entry.action)} 
            size={18} 
            color={getActionColor(entry.action)} 
          />
        </View>
        
        <View style={styles.historyContent}>
          {/* Minimized View - Always Visible */}
          <View style={styles.historyHeader}>
            <View style={styles.historyMainInfo}>
              <ThemedText style={[styles.historyAction, { color: colors.text }]}>
                {formatAction(entry.action)}
              </ThemedText>
            </View>
            <View style={styles.historyTimeInfo}>
              <ThemedText style={[styles.historyTime, { color: colors.text }]}>
                {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
              </ThemedText>
              <Ionicons 
                name={isExpanded ? "chevron-up" : "chevron-down"} 
                size={16} 
                color={colors.text + '60'} 
              />
            </View>
          </View>
          
        </View>
      </TouchableOpacity>
      
      {/* Expanded View - Only when expanded */}
      {isExpanded && (
        <View style={[styles.expandedContent, { backgroundColor: colors.surface }]}>
          <View style={styles.expandedDetails}>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.text }]}>Action:</ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                {formatAction(entry.action)}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.text }]}>User:</ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                {userName}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.text }]}>Time:</ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                {entry.timestamp.toLocaleString([], { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  hour12: true 
                })}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={[styles.detailLabel, { color: colors.text }]}>Details:</ThemedText>
              <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                {entry.details}
              </ThemedText>
            </View>
          </View>
        </View>
      )}
      
      {!isLast && <View style={[styles.timeline, { backgroundColor: colors.border }]} />}
    </View>
  );
}

function getHistoryIcon(action: HistoryAction) {
  switch (action) {
    case 'created': return 'add-circle-outline';
    case 'updated': return 'create-outline';
    case 'borrowed': return 'cart-outline';
    case 'returned': return 'return-down-back-outline';
    case 'maintenance': return 'construct-outline';
    case 'transferred': return 'swap-horizontal-outline';
    case 'deleted': return 'trash-outline';
    case 'status_changed': return 'refresh-outline';
    default: return 'ellipse-outline';
  }
}

function getActionColor(action: HistoryAction) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  switch (action) {
    case 'created': return colors.success;
    case 'updated': return colors.primary;
    case 'borrowed': return colors.warning;
    case 'returned': return colors.success;
    case 'maintenance': return colors.text;
    case 'transferred': return colors.primary;
    case 'deleted': return colors.error;
    case 'status_changed': return colors.warning;
    default: return colors.text;
  }
}

function formatAction(action: HistoryAction) {
  return action
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
        Showing {loadedItems} of {totalItems} entries
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
  
  // Section header styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Empty state styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 16,
    opacity: 0.7,
    fontSize: 14,
  },
  
  // Loading state styles
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    opacity: 0.7,
    fontSize: 14,
  },
  
  // Date group styles
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  entryCount: {
    fontSize: 12,
    opacity: 0.6,
  },
  
  // Entries container
  entriesContainer: {
    paddingLeft: 16,
  },
  
  // History item styles
  historyItem: {
    position: 'relative',
    marginBottom: 8,
  },
  lastHistoryItem: {
    marginBottom: 0,
  },
  historyItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  historyContent: {
    flex: 1,
    paddingTop: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  historyMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  historyTimeInfo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  historyAction: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  historyDetails: {
    fontSize: 13,
    opacity: 0.75,
    lineHeight: 19,
    marginTop: 2,
  },
  historyUser: {
    fontSize: 12,
    opacity: 0.6,
    fontStyle: 'italic',
  },
  historyTime: {
    fontSize: 12,
    opacity: 0.6,
    fontWeight: '500',
  },
  
  // Expanded content styles
  expandedContent: {
    marginTop: 10,
    marginLeft: 46,
    marginRight: 4,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  expandedDetails: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 2,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
    flex: 1,
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 12,
    opacity: 0.85,
    flex: 2,
    textAlign: 'right',
    fontWeight: '500',
  },
  
  // Timeline styles
  timeline: {
    position: 'absolute',
    left: 27, // Center of the 32px icon: marginHorizontal(4) + paddingHorizontal(8) + iconCenter(16)
    top: 46, // Start after the icon: marginTop(2) + iconHeight(32)
    width: 2,
    height: 35,
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
});
