import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { OperationRecord } from '@/firebase/operations';
import { SitRepDocument } from '@/types/Document';
import { ResourceTransaction } from '@/types/Resource';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View, ScrollView } from 'react-native';

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

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

export function ActivityStream({ operations, documents, transactions }: ActivityStreamProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();

  // Build activity items with unique IDs
  // Use Sets to track seen source IDs to prevent duplicates
  const activities: ActivityItem[] = [];
  const seenOpIds = new Set<string>();
  const seenDocIds = new Set<string>();
  const seenTransIds = new Set<string>();

  // Helper to safely convert to Date
  const toDate = (date: Date | string | number | undefined | null): Date => {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    if (typeof date === 'string' || typeof date === 'number') return new Date(date);
    return new Date();
  };

  // Add operations (recent active ones) - deduplicate by operation ID
  operations
    .filter(op => op.status === 'active')
    .slice(0, 5)
    .forEach((op) => {
      if (!seenOpIds.has(op.id)) {
        seenOpIds.add(op.id);
        activities.push({
          id: `op-${op.id}`,
          type: 'operation',
          message: `Operation: ${op.title}`,
          timestamp: toDate(op.createdAt),
          icon: 'location',
        });
      }
    });

  // Add recent documents - deduplicate by document ID
  documents.slice(0, 5).forEach((doc) => {
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

  // Add recent resource transactions - deduplicate by transaction ID
  transactions
    .filter(t => t.status === 'active')
    .slice(0, 5)
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

  // Take top 15
  const recentActivities = activities.slice(0, 15);

  // Group by time
  const groupedActivities = groupByTime(recentActivities);

  if (recentActivities.length === 0) {
    return (
      <ThemedView style={[styles.card, isMobile && styles.cardMobile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headerSection}>
          <View style={styles.titleContainer}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.accent}15` }]}>
              <Ionicons name="time" size={20} color={colors.accent} />
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
    <ThemedView style={[styles.card, isMobile && styles.cardMobile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headerSection}>
        <View style={styles.titleContainer}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.accent}15` }]}>
            <Ionicons name="time" size={20} color={colors.accent} />
          </View>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
            Recent Activity
          </ThemedText>
        </View>
      </View>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {groupedActivities.map((group) => (
          <View key={group.label} style={styles.group}>
            <ThemedText style={[styles.groupLabel, { color: colors.text, opacity: 0.7 }]}>
              {group.label}
            </ThemedText>
            {group.items.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
                  <Ionicons name={activity.icon} size={18} color={colors.primary} />
                </View>
                <View style={styles.activityContent}>
                  <ThemedText style={[styles.activityMessage, { color: colors.text }]} numberOfLines={2}>
                    {activity.message}
                  </ThemedText>
                  <ThemedText style={[styles.activityTime, { color: colors.text, opacity: 0.6 }]}>
                    {formatTimeAgo(activity.timestamp instanceof Date ? activity.timestamp : new Date(activity.timestamp))}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardMobile: {
    padding: 16,
    marginBottom: 16,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Gabarito',
  },
  scrollView: {
    flex: 1,
  },
  group: {
    marginBottom: 24,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    fontFamily: 'Gabarito',
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 13,
    marginBottom: 4,
    fontFamily: 'Gabarito',
    lineHeight: 18,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 11,
    fontFamily: 'Gabarito',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 40,
    fontFamily: 'Gabarito',
  },
});

