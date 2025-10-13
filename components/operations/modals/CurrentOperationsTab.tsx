import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { OperationCard } from './OperationCard';

interface CurrentOperationsTabProps {
  operations: any[];
  onConcludeOperation?: (operationId: string) => void;
  onAddOperation?: () => void;
}

export function CurrentOperationsTab({ 
  operations, 
  onConcludeOperation, 
  onAddOperation 
}: CurrentOperationsTabProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      {/* Header with Add Button */}
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: colors.text }]}>
          Current Operations
        </ThemedText>
        <View style={styles.buttonContainer}>
          {onAddOperation ? (
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={onAddOperation}
            >
              <Ionicons name="add-circle" size={20} color="white" />
              <ThemedText style={styles.addButtonText}>
                Add Operation
              </ThemedText>
            </TouchableOpacity>
          ) : (
            <View style={styles.buttonPlaceholder} />
          )}
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
                  onConclude={onConcludeOperation}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={48} color={colors.text} style={styles.emptyIcon} />
            <ThemedText style={[styles.emptyMessage, { color: colors.text }]}>
              There are no active operations for this location.
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
  buttonContainer: {
    minWidth: 120,
    alignItems: 'flex-end',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  buttonPlaceholder: {
    width: 120,
    height: 36,
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
  emptyMessage: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
});
