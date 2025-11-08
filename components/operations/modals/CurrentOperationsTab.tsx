import { ThemedText } from '@/components/ThemedText';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { Colors } from '@/constants/Colors';
import { operationsService } from '@/firebase/operations';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePermissions } from '@/hooks/usePermissions';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
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
  const [items, setItems] = React.useState(operations);
  const { isAdminOrSupervisor } = usePermissions();
  const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
  const [operationToDelete, setOperationToDelete] = React.useState<any | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

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

  const handleDeleteClick = (operation: any) => {
    setOperationToDelete(operation);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!operationToDelete) return;

    setIsDeleting(true);
    try {
      await operationsService.deleteOperationAndReturnResources(operationToDelete.id);
      // Real-time listener in parent will refresh; optimistically update local list
      setItems(prev => prev.filter(op => op.id !== operationToDelete.id));
      setDeleteModalVisible(false);
      setOperationToDelete(null);
    } catch (e) {
      console.error('Failed to delete operation:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setOperationToDelete(null);
  };

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
      <View style={[styles.content, Platform.OS === 'web' && styles.gridContainer]}>
        {items && items.length > 0 ? (
          <View style={Platform.OS === 'web' ? styles.gridInner : undefined}>
            {items.map((operation, index) => (
              <View key={operation.id} style={[styles.operationItem, Platform.OS === 'web' && styles.operationItemWeb]}>
                <OperationCard 
                  operation={{ ...operation, status: 'active' }} 
                  onConclude={isAdminOrSupervisor ? onConcludeOperation : undefined}
                  onDelete={isAdminOrSupervisor ? () => handleDeleteClick(operation) : undefined}
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={deleteModalVisible}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        title="Delete Operation"
        message={`Are you sure you want to delete "${operationToDelete?.title}"? This will also return any borrowed resources. This action cannot be undone.`}
        variant="danger"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={isDeleting}
      />
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
  emptyMessage: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
});
