import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { operationsService } from '@/firebase/operations';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePermissions } from '@/hooks/usePermissions';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { OperationCard } from './OperationCard';

interface HistoryOperationsTabProps {
  operations: any[];
}

export function HistoryOperationsTab({ operations }: HistoryOperationsTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [items, setItems] = React.useState(operations);
  const { isAdminOrSupervisor } = usePermissions();

  const sortOperations = React.useCallback((list: any[]) => {
    const priorityRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return [...(list || [])].sort((a, b) => {
      const ra = priorityRank[(a.priority || '').toLowerCase()] || 0;
      const rb = priorityRank[(b.priority || '').toLowerCase()] || 0;
      if (rb !== ra) return rb - ra;
      const aTime = new Date(a.startDate || a.createdAt || 0).getTime();
      const bTime = new Date(b.startDate || b.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }, []);

  React.useEffect(() => {
    setItems(sortOperations(operations));
  }, [operations, sortOperations]);


  const handleDelete = async (id: string) => {
    try {
      await operationsService.deleteOperation(id);
      setItems(prev => prev.filter(op => op.id !== id));
    } catch (e) {
      console.error('Failed to delete operation:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: colors.text }]}>
          Operation History
        </ThemedText>
        <View style={styles.countBadge}>
          <ThemedText style={[styles.countText, { color: colors.text }]}>
            {operations.length}
          </ThemedText>
        </View>
      </View>

      {/* Operations List */}
      <View style={[styles.content, Platform.OS === 'web' && styles.gridContainer]}>
        {items && items.length > 0 ? (
          <View style={Platform.OS === 'web' ? styles.gridInner : undefined}>
            {items.map((operation, index) => (
              <View key={operation.id} style={[styles.operationItem, Platform.OS === 'web' && styles.operationItemWeb]}>
                <OperationCard 
                  operation={operation} 
                  onConclude={undefined}
                  onDelete={isAdminOrSupervisor ? handleDelete : undefined}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={48} color={colors.text} style={styles.emptyIcon} />
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
              No Operation History
            </ThemedText>
            <ThemedText style={[styles.emptyMessage, { color: colors.text }]}>
              Concluded operations will appear here for reference and reporting.
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#E9ECEF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C757D',
  },
  content: {
    ...Platform.select({ default: { flex: 1 }, web: {} }),
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    width: '100%',
    justifyContent: 'flex-start',
    gap: 12,
  },
  gridInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  operationItem: {
    marginBottom: 12,
  },
  operationItemWeb: {
    width: 320,
    marginRight: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    width: '100%',
  },
  emptyIcon: {
    opacity: 0.3,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
});
