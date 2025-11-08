import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { OperationCompleteModal } from './OperationCompleteModal';

interface OperationCardProps {
  operation: {
    id: string;
    title: string;
    description: string;
    operationType: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status?: 'active' | 'concluded';
    startDate: string | Date | number;
    endDate?: string | Date | number;
    exactLocation?: {
      barangay: string;
      purok: string;
      specificAddress?: string;
    };
    resources: Array<{
      resourceId: string;
      resourceName: string;
      quantity: number; 
      category: string;
      status: string;
    }>;
    createdAt: string | Date | number;
    updatedAt: string | Date | number;
    createdBy?: string;
    updatedBy?: string;
  };
  onConclude?: (operationId: string) => void;
  onDelete?: (operationId: string) => void;
}

export function OperationCard({ operation, onConclude, onDelete }: OperationCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [updaterName, setUpdaterName] = useState<string | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return '#7C2D12';
      case 'high':
        return '#F44336';
      case 'medium':
        return '#FFA500';
      case 'low':
        return '#4CAF50';
      default:
        return '#FFA500';
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchCreator = async () => {
      try {
        if (!operation.createdBy) {
          setCreatorName(null);
          return;
        }
        const { db } = await import('@/firebase/config');
        const { doc, getDoc } = await import('firebase/firestore');
        const userRef = doc(db, 'users', operation.createdBy);
        const snap = await getDoc(userRef);
        if (!isMounted) return;
        if (snap.exists()) {
          const data = snap.data() as { fullName?: string; displayName?: string };
          setCreatorName(data.displayName || data.fullName || 'Unknown');
        } else {
          setCreatorName('Unknown');
        }
      } catch (e) {
        setCreatorName('Unknown');
      }
    };
    fetchCreator();
    return () => { isMounted = false; };
  }, [operation.createdBy]);

  useEffect(() => {
    let isMounted = true;
    const fetchUpdater = async () => {
      try {
        if (!operation.updatedBy) {
          setUpdaterName(null);
          return;
        }
        const { db } = await import('@/firebase/config');
        const { doc, getDoc } = await import('firebase/firestore');
        const userRef = doc(db, 'users', operation.updatedBy);
        const snap = await getDoc(userRef);
        if (!isMounted) return;
        if (snap.exists()) {
          const data = snap.data() as { fullName?: string; displayName?: string };
          setUpdaterName(data.displayName || data.fullName || 'Unknown');
        } else {
          setUpdaterName('Unknown');
        }
      } catch (e) {
        setUpdaterName('Unknown');
      }
    };
    fetchUpdater();
    return () => { isMounted = false; };
  }, [operation.updatedBy]);


  const formatDate = (value: string | Date | number) => {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatResources = () => {
    return operation.resources
      .map(resource => `${resource.quantity}x ${resource.resourceName}`)
      .join(', ');
  };

  const canConclude = !!onConclude && operation.status !== 'concluded';
  const canDelete = !!onDelete;

  const handleConcludeOperation = () => {
    if (!canConclude) return;
    setShowCompleteModal(true);
  };

  const handleConfirmConclude = () => {
    // Close the modal and notify parent to remove the operation
    setShowCompleteModal(false);
    onConclude?.(operation.id);
  };

  // Update operation button removed per requirements
  const handleDelete = () => {
    onDelete?.(operation.id);
  };

  return (
    <View style={[styles.operationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header with title and badges */}
      <View style={styles.operationHeader}>
        <View style={styles.operationTitleContainer}>
          <ThemedText style={[styles.operationTitle, { color: colors.text }]} numberOfLines={1}>
            {operation.title}
          </ThemedText>
          <View style={styles.badgeContainer}>
            {operation.status === 'active' && (
              <View style={[styles.statusBadge, { backgroundColor: colors.success || '#4CAF50' }]}>
                <ThemedText style={styles.statusText}>Active</ThemedText>
              </View>
            )}
            {operation.status === 'concluded' && (
              <View style={[styles.statusBadge, { backgroundColor: colors.tabIconDefault || '#8E8E93' }]}>
                <ThemedText style={styles.statusText}>Concluded</ThemedText>
              </View>
            )}
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(operation.priority) }]}>
              <ThemedText style={styles.priorityText}>
                {operation.priority.charAt(0).toUpperCase() + operation.priority.slice(1)}
              </ThemedText>
            </View>
          </View>
        </View>
      </View>
      
      {/* Description - compact */}
      {operation.description && (
        <ThemedText style={[styles.operationDescription, { color: colors.text, opacity: 0.8 }]} numberOfLines={2}>
          {operation.description}
        </ThemedText>
      )}
      
      {/* Details */}
      <View style={styles.operationDetails}>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="construct" size={14} color={colors.text} style={styles.detailIcon} />
            <ThemedText style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
              {operation.operationType}
            </ThemedText>
          </View>
        </View>

        

        {/* Location Information */}
        {operation.exactLocation && (
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="location" size={14} color={colors.text} style={styles.detailIcon} />
              <ThemedText style={[styles.detailValue, { color: colors.text }]} numberOfLines={2}>
                {operation.exactLocation.barangay}, {operation.exactLocation.purok}
                {operation.exactLocation.specificAddress && ` - ${operation.exactLocation.specificAddress}`}
              </ThemedText>
            </View>
          </View>
        )}
        
        {operation.resources.length > 0 && (
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="car" size={14} color={colors.text} style={styles.detailIcon} />
              <ThemedText style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
                {formatResources()}
              </ThemedText>
            </View>
            
            {operation.endDate && (
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={14} color={colors.text} style={styles.detailIcon} />
                <ThemedText style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
                  {formatDate(operation.endDate)}
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </View>
      
      {/* Action Buttons */}
      {(canDelete || canConclude) && (
        <View style={styles.actionButtons}>
          {canDelete && (
            <TouchableOpacity
              style={[
                styles.iconButton,
                { borderColor: colors.border, backgroundColor: colors.surface }
              ]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error || '#EF4444'} />
            </TouchableOpacity>
          )}
          {canConclude && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.completeButton,
                { backgroundColor: colors.success }
              ]}
              onPress={handleConcludeOperation}
              activeOpacity={0.7}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="white" />
              <ThemedText style={[styles.actionButtonText, { color: 'white' }]}>
                Conclude
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Footer - compact */}
      <View style={styles.operationFooter}>
        <View style={{ flex: 1 }}>
          <ThemedText style={[styles.operationId, { color: colors.text, opacity: 0.6 }]} numberOfLines={1}>
            ID: {operation.id}
          </ThemedText>
          {operation.createdBy && (
            <ThemedText style={[styles.operationId, { color: colors.text, opacity: 0.6 }]} numberOfLines={1}>
              {`Created by ${creatorName ?? '…'}`}
            </ThemedText>
          )}
          {operation.status === 'concluded' && operation.updatedBy && (
            <ThemedText style={[styles.operationId, { color: colors.text, opacity: 0.6 }]} numberOfLines={1}>
              {`Concluded by ${updaterName ?? '…'}`}
            </ThemedText>
          )}
        </View>
        <ThemedText style={[styles.operationDate, { color: colors.text, opacity: 0.6 }]} numberOfLines={1}>
          {formatDate(operation.startDate)}
        </ThemedText>
      </View>

      {/* Completion Confirmation Modal */}
      <OperationCompleteModal
        visible={showCompleteModal}
        operation={operation}
        onClose={() => setShowCompleteModal(false)}
        onConfirm={handleConfirmConclude}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  operationCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  operationHeader: {
    marginBottom: 8,
  },
  operationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  operationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  operationDescription: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  operationDetails: {
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  detailIcon: {
    marginRight: 4,
    width: 14,
  },
  detailValue: {
    fontSize: 13,
    flex: 1,
  },
  operationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  operationId: {
    fontSize: 11,
  },
  operationDate: {
    fontSize: 11,
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  updateButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  completeButton: {
    // backgroundColor set dynamically
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
