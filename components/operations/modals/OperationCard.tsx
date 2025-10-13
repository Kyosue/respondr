import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { OperationCompleteModal } from './index';

interface OperationCardProps {
  operation: {
    id: string;
    title: string;
    description: string;
    operationType: string;
    priority: 'low' | 'medium' | 'high';
    startDate: string;
    endDate?: string;
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
    createdAt: string;
    updatedAt: string;
  };
  onConclude?: (operationId: string) => void;
}

export function OperationCard({ operation, onConclude }: OperationCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
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


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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

  const handleConcludeOperation = () => {
    setShowCompleteModal(true);
  };

  const handleConfirmConclude = () => {
    // Close the modal and notify parent to remove the operation
    setShowCompleteModal(false);
    onConclude?.(operation.id);
  };

  const handleUpdateOperation = () => {
    // TODO: Implement update operation logic
    Alert.alert('Update Operation', 'Update functionality will be implemented soon.');
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
      
      {/* Details in two columns */}
      <View style={styles.operationDetails}>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={14} color={colors.text} style={styles.detailIcon} />
            <ThemedText style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
              {formatDate(operation.startDate)}
            </ThemedText>
          </View>
          
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
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.updateButton, { borderColor: colors.primary }]}
          onPress={handleUpdateOperation}
        >
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <ThemedText style={[styles.actionButtonText, { color: colors.primary }]}>
            Update
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.completeButton, { backgroundColor: colors.success }]}
          onPress={handleConcludeOperation}
        >
          <Ionicons name="checkmark-circle-outline" size={16} color="white" />
          <ThemedText style={[styles.actionButtonText, { color: 'white' }]}>
            Conclude
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Footer - compact */}
      <View style={styles.operationFooter}>
        <ThemedText style={[styles.operationId, { color: colors.text, opacity: 0.6 }]} numberOfLines={1}>
          ID: {operation.id}
        </ThemedText>
        <ThemedText style={[styles.operationDate, { color: colors.text, opacity: 0.6 }]} numberOfLines={1}>
          {formatDate(operation.createdAt)}
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
