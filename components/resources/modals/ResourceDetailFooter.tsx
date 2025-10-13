import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Resource, ResourceTransaction } from '@/types/Resource';

interface ResourceDetailFooterProps {
  resource: Resource;
  activeTransactions: ResourceTransaction[];
  onBorrow: () => void;
  onReturn: () => void;
}

export function ResourceDetailFooter({ 
  resource, 
  activeTransactions, 
  onBorrow, 
  onReturn 
}: ResourceDetailFooterProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const isExternalResource = resource.resourceType === 'external';
  const isBorrowable = resource.isBorrowable !== false; // Default to true for backward compatibility
  const hasUserTransaction = activeTransactions.some(t => t.userId === 'current-user'); // TODO: Get actual user ID

  // Don't show any borrow/return actions for external resources
  if (isExternalResource || !isBorrowable) {
    return (
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={[styles.unavailableButton, { backgroundColor: colors.border }]}>
          <Ionicons name="business-outline" size={20} color={colors.text} />
          <ThemedText style={[styles.unavailableButtonText, { color: colors.text }]}>
            {isExternalResource ? 'External Resource - Not Borrowable' : 'Not Borrowable'}
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.footer, { borderTopColor: colors.border }]}>
      {resource.availableQuantity > 0 ? (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={onBorrow}
        >
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <ThemedText style={styles.actionButtonText}>Borrow</ThemedText>
        </TouchableOpacity>
      ) : hasUserTransaction ? (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.success }]}
          onPress={onReturn}
        >
          <Ionicons name="return-down-back-outline" size={20} color="#fff" />
          <ThemedText style={styles.actionButtonText}>Return</ThemedText>
        </TouchableOpacity>
      ) : (
        <View style={[styles.unavailableButton, { backgroundColor: colors.border }]}>
          <Ionicons name="close-circle-outline" size={20} color={colors.text} />
          <ThemedText style={[styles.unavailableButtonText, { color: colors.text }]}>
            Not Available
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  unavailableButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  unavailableButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
