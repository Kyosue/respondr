import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

interface OperationCompleteModalProps {
  visible: boolean;
  operation: {
    id: string;
    title: string;
    operationType: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
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
  };
  onClose: () => void;
  onConfirm: () => void;
}

export function OperationCompleteModal({ 
  visible, 
  operation, 
  onClose, 
  onConfirm 
}: OperationCompleteModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const formatResources = () => {
    return operation.resources
      .map(resource => `${resource.quantity}x ${resource.resourceName}`)
      .join(', ');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return '#DC2626';
      case 'high':
        return '#EA580C';
      case 'medium':
        return '#D97706';
      case 'low':
        return '#059669';
      default:
        return '#D97706';
    }
  };

  const handleConfirm = () => {
    // Close the modal and trigger the conclusion logic
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.modalHeader}>
            <View style={[styles.modalIconContainer, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="checkmark-circle" size={40} color={colors.success} />
            </View>
            <ThemedText style={[styles.modalTitle, { color: colors.text }]}>
              Conclude Operation
            </ThemedText>
            <ThemedText style={[styles.modalSubtitle, { color: colors.text, opacity: 0.7 }]}>
              Mark this emergency operation as concluded
            </ThemedText>
          </View>
          
          <View style={styles.modalContent}>
            <ThemedText style={[styles.modalMessage, { color: colors.text }]}>
              Please confirm that this emergency operation has been successfully concluded.
            </ThemedText>
            
            <View style={[styles.operationSummary, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.operationSummaryHeader}>
                <Ionicons name="document-text" size={20} color={colors.primary} />
                <ThemedText style={[styles.operationSummaryTitle, { color: colors.text }]}>
                  {operation.title}
                </ThemedText>
              </View>
              
              <View style={styles.operationSummaryDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="construct" size={16} color={colors.text} style={styles.detailIcon} />
                  <ThemedText style={[styles.detailText, { color: colors.text, opacity: 0.8 }]}>
                    {operation.operationType}
                  </ThemedText>
                </View>
                
                <View style={styles.detailRow}>
                  <Ionicons name="flag" size={16} color={getPriorityColor(operation.priority)} style={styles.detailIcon} />
                  <ThemedText style={[styles.detailText, { color: colors.text, opacity: 0.8 }]}>
                    {operation.priority.charAt(0).toUpperCase() + operation.priority.slice(1)} Priority
                  </ThemedText>
                </View>
                
                {operation.exactLocation && (
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color={colors.text} style={styles.detailIcon} />
                    <ThemedText style={[styles.detailText, { color: colors.text, opacity: 0.8 }]}>
                      {operation.exactLocation.barangay}, {operation.exactLocation.purok}
                      {operation.exactLocation.specificAddress && ` - ${operation.exactLocation.specificAddress}`}
                    </ThemedText>
                  </View>
                )}
                
                {operation.resources.length > 0 && (
                  <View style={styles.detailRow}>
                    <Ionicons name="cube" size={16} color={colors.text} style={styles.detailIcon} />
                    <ThemedText style={[styles.detailText, { color: colors.text, opacity: 0.8 }]} numberOfLines={2}>
                      {formatResources()}
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
              onPress={onClose}
            >
              <ThemedText style={[styles.modalButtonText, { color: colors.text }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton, { backgroundColor: colors.success }]}
              onPress={handleConfirm}
            >
              <ThemedText style={[styles.modalButtonText, { color: 'white' }]}>
                Confirm
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalContent: {
    marginBottom: 24,
  },
  modalMessage: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  operationSummary: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  operationSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  operationSummaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  operationSummaryDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailIcon: {
    marginTop: 2,
    width: 16,
  },
  detailText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  confirmButton: {
    // backgroundColor set dynamically
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
