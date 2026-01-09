import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { OperationRecord } from '@/firebase/operations';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { SitRepDocument } from '@/types/Document';
import { ResourceTransaction } from '@/types/Resource';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, View } from 'react-native';

interface ActivityItem {
  id: string;
  type: 'operation' | 'resource' | 'document';
  message: string;
  timestamp: Date;
  icon: keyof typeof Ionicons.glyphMap;
}

interface ActivityStreamProps {
  operations: OperationRecord[];
  documents: SitRepDocument[];
  transactions: ResourceTransaction[];
}

function formatTimeAgo(date: Date | string | number | undefined | null): string {
  if (!date) return 'Recently';
  
  const d = date instanceof Date 
    ? date 
    : typeof date === 'string' || typeof date === 'number'
      ? new Date(date)
      : new Date();
  
  // Check if date is valid
  if (isNaN(d.getTime())) return 'Recently';
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Format time with hours and minutes in 12-hour format with AM/PM
  const timeString = d.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  // Show "Just now" for activities less than 5 minutes old
  if (diffMins < 5) return `Just now (${timeString})`;
  
  // Round down to nearest 5-minute interval for activities less than an hour old
  // This ensures updates only show: 5m, 10m, 15m, 20m, 25m, 30m, 35m, 40m, 45m, 50m, 55m
  if (diffMins < 60) {
    const roundedMins = Math.floor(diffMins / 5) * 5;
    return `${roundedMins}m ago (${timeString})`;
  }
  if (diffHours < 24) return `${diffHours}h ago (${timeString})`;
  if (diffDays === 1) return `Yesterday at ${timeString}`;
  if (diffDays < 7) return `${diffDays}d ago (${timeString})`;
  
  // For older dates, show full date with time
  const dateString = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${dateString} at ${timeString}`;
}

function groupByTime(activities: ActivityItem[]): { label: string; items: ActivityItem[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);

  const groups: { [key: string]: ActivityItem[] } = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    Older: [],
  };

  activities.forEach((activity) => {
    // Ensure timestamp is a Date object
    const activityDate = activity.timestamp instanceof Date 
      ? activity.timestamp 
      : new Date(activity.timestamp);
    
    // Skip invalid dates
    if (isNaN(activityDate.getTime())) return;
    
    if (activityDate >= today) {
      groups.Today.push(activity);
    } else if (activityDate >= yesterday) {
      groups.Yesterday.push(activity);
    } else if (activityDate >= thisWeek) {
      groups['This Week'].push(activity);
    } else {
      groups.Older.push(activity);
    }
  });

  return Object.entries(groups)
    .filter(([_, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

// Animated Activity Item Component
interface AnimatedActivityItemProps {
  children: React.ReactNode;
  index: number;
}

function AnimatedActivityItem({ children, index }: AnimatedActivityItemProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    // Stagger animation: each item appears 80ms after the previous one (slower, smoother)
    const delay = index * 80;
    
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        delay,
        tension: 40,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateX]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateX }],
      }}
    >
      {children}
    </Animated.View>
  );
}

// Animated Group Label Component
interface AnimatedGroupLabelProps {
  children: React.ReactNode;
  index: number;
}

function AnimatedGroupLabel({ children, index }: AnimatedGroupLabelProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;

  useEffect(() => {
    // Group labels appear before their items with smooth animation
    const delay = index * 300; // Groups appear with more delay between them
    
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        tension: 40,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, opacity, translateY]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
      }}
    >
      {children}
    </Animated.View>
  );
}

export function ActivityStream({ operations, documents, transactions }: ActivityStreamProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();
  
  // State to trigger periodic updates for recent activities
  const [updateTick, setUpdateTick] = useState(0);

  // Helper to safely convert to Date
  const toDate = (date: Date | string | number | undefined | null): Date => {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    if (typeof date === 'string' || typeof date === 'number') return new Date(date);
    return new Date();
  };

  // Build activity items with unique IDs - memoized to prevent unnecessary recalculations
  const recentActivities = useMemo(() => {
    const activities: ActivityItem[] = [];
    const seenOpIds = new Set<string>();
    const seenDocIds = new Set<string>();
    const seenTransIds = new Set<string>();

    // Add operations (recent active ones) - limit to 3 most recent
    operations
      .filter(op => op.status === 'active')
      .slice(0, 3)
      .forEach((op) => {
        if (!seenOpIds.has(op.id)) {
          seenOpIds.add(op.id);
          // Use startDate for operations (when it actually started) or fallback to createdAt
          const opTimestamp = op.startDate || op.createdAt;
          if (opTimestamp) {
            activities.push({
              id: `op-${op.id}`,
              type: 'operation',
              message: `Operation: ${op.title}`,
              timestamp: toDate(opTimestamp),
              icon: 'location',
            });
          }
        }
      });

    // Add recent documents - limit to 3 most recent
    documents.slice(0, 3).forEach((doc) => {
      if (!seenDocIds.has(doc.id)) {
        seenDocIds.add(doc.id);
        activities.push({
          id: `doc-${doc.id}`,
          type: 'document',
          message: `Document uploaded: ${doc.title}`,
          timestamp: toDate(doc.uploadedAt),
          icon: 'document-text',
        });
      }
    });

    // Add recent resource transactions - limit to 3 most recent
    transactions
      .filter(t => t.status === 'active')
      .slice(0, 3)
      .forEach((transaction) => {
        if (!seenTransIds.has(transaction.id)) {
          seenTransIds.add(transaction.id);
          activities.push({
            id: `trans-${transaction.id}`,
            type: 'resource',
            message: `Resource borrowed: ${transaction.borrowerName}`,
            timestamp: toDate(transaction.createdAt),
            icon: 'cube',
          });
        }
      });

    // Sort by timestamp (most recent first)
    // All timestamps are already Date objects from toDate() helper
    activities.sort((a, b) => {
      const timeA = a.timestamp.getTime();
      const timeB = b.timestamp.getTime();
      return timeB - timeA;
    });

    // Limit to top 8 activities for compact display
    return activities.slice(0, 8);
  }, [operations, documents, transactions]);

  // Check if there are any activities that would benefit from updates (less than 24 hours old)
  // Recalculates when updateTick changes to check if activities are still recent
  const hasRecentActivities = useMemo(() => {
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    return recentActivities.some(activity => {
      const activityTime = activity.timestamp.getTime();
      return activityTime > twentyFourHoursAgo;
    });
  }, [recentActivities, updateTick]);

  // Efficient update strategy: only update recent activities (less than 24 hours old)
  // Use 5-minute interval to reduce battery drain and unnecessary re-renders
  useEffect(() => {
    // Only set up interval if there are recent activities that need updates
    if (!hasRecentActivities) return;

    const intervalId = setInterval(() => {
      // Simply update the tick - the useMemo will recalculate hasRecentActivities
      // and if there are no more recent activities, the interval will be cleared
      setUpdateTick(prev => prev + 1);
    }, 5 * 60 * 1000); // Update every 5 minutes

    // Cleanup interval on unmount or when dependencies change
    return () => clearInterval(intervalId);
  }, [hasRecentActivities]);

  // Memoize formatted time strings to prevent recalculation on every render
  // Only updates when updateTick changes (every 5 minutes) or activities change
  const activityTimeStrings = useMemo(() => {
    const timeMap = new Map<string, string>();
    recentActivities.forEach(activity => {
      const timestamp = activity.timestamp instanceof Date 
        ? activity.timestamp 
        : new Date(activity.timestamp);
      timeMap.set(activity.id, formatTimeAgo(timestamp));
    });
    return timeMap;
  }, [recentActivities, updateTick]);

  // Group by time
  const groupedActivities = groupByTime(recentActivities);

  if (recentActivities.length === 0) {
    return (
      <ThemedView style={[
        styles.card, 
        isMobile && styles.cardMobile,
        !isMobile && styles.cardDesktop,
        { backgroundColor: colors.surface, borderColor: colors.border }
      ]}>
        <View style={styles.headerSection}>
          <View style={styles.titleContainer}>
            <View style={[styles.headerIconContainer, { backgroundColor: `${colors.accent}15` }]}>
              <Ionicons name="time" size={18} color={colors.accent} />
            </View>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Activity
            </ThemedText>
          </View>
        </View>
        <ThemedText style={[styles.emptyText, { color: colors.text, opacity: 0.6 }]}>
          No recent activity
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[
      styles.card, 
      isMobile && styles.cardMobile,
      !isMobile && styles.cardDesktop,
      { backgroundColor: colors.surface, borderColor: colors.border }
    ]}>
      <View style={styles.headerSection}>
        <View style={styles.titleContainer}>
          <View style={[styles.headerIconContainer, { backgroundColor: `${colors.accent}15` }]}>
            <Ionicons name="time" size={18} color={colors.accent} />
          </View>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Activity
          </ThemedText>
        </View>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {groupedActivities.map((group, groupIndex) => {
          let itemIndex = 0;
          // Calculate starting index for items in this group
          for (let i = 0; i < groupIndex; i++) {
            itemIndex += groupedActivities[i].items.length;
          }
          
          return (
            <View key={group.label} style={styles.group}>
              <AnimatedGroupLabel index={groupIndex}>
                <ThemedText style={[styles.groupLabel, { color: colors.text, opacity: 0.7 }]}>
                  {group.label}
                </ThemedText>
              </AnimatedGroupLabel>
              {group.items.map((activity, activityIndex) => {
                const currentItemIndex = itemIndex + activityIndex;
                return (
                  <AnimatedActivityItem key={activity.id} index={currentItemIndex}>
                    <View style={styles.activityItem}>
                      <View style={[styles.activityIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                        <Ionicons name={activity.icon} size={16} color={colors.primary} />
                      </View>
                      <View style={styles.activityContent}>
                        <ThemedText style={[styles.activityMessage, { color: colors.text }]} numberOfLines={2}>
                          {activity.message}
                        </ThemedText>
                        <ThemedText style={[styles.activityTime, { color: colors.text, opacity: 0.6 }]}>
                          {activityTimeStrings.get(activity.id) || formatTimeAgo(activity.timestamp instanceof Date ? activity.timestamp : new Date(activity.timestamp))}
                        </ThemedText>
                      </View>
                    </View>
                  </AnimatedActivityItem>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardMobile: {
    padding: 14,
    marginBottom: 16,
    borderRadius: 14,
  },
  cardDesktop: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 0,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    ...(Platform.OS !== 'web' && {
      marginBottom: 10,
      paddingBottom: 8,
    }),
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    ...(Platform.OS !== 'web' && {
      fontSize: 16,
    }),
  },
  scrollView: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      minHeight: 0,
    }),
  },
  group: {
    marginBottom: 16,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    fontFamily: 'Gabarito',
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
    paddingVertical: 2,
  },
  activityIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    marginBottom: 2,
    fontFamily: 'Gabarito',
    lineHeight: 16,
    fontWeight: '500',
    ...(Platform.OS !== 'web' && {
      fontSize: 13,
      lineHeight: 18,
    }),
  },
  activityTime: {
    fontSize: 11,
    fontFamily: 'Gabarito',
    ...(Platform.OS !== 'web' && {
      fontSize: 10,
    }),
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 40,
    fontFamily: 'Gabarito',
  },
});


