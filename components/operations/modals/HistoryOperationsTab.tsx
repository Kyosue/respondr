import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { OperationCard } from './OperationCard';

interface HistoryOperationsTabProps {
  operations: any[];
}

export function HistoryOperationsTab({ operations }: HistoryOperationsTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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
      <View style={styles.content}>
        {operations && operations.length > 0 ? (
          <View>
            {operations.map((operation, index) => (
              <View key={operation.id} style={styles.operationItem}>
                <OperationCard 
                  operation={operation} 
                  onConclude={undefined} // No action buttons for history
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
    flex: 1,
  },
  operationItem: {
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
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
