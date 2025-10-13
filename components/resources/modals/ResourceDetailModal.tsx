import { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    View
} from 'react-native';

import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useResources } from '@/contexts/ResourceContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Resource } from '@/types/Resource';

import { ResourceDetailFooter } from './ResourceDetailFooter';
import { ResourceDetailHeader } from './ResourceDetailHeader';
import { ResourceDetailTabs } from './ResourceDetailTabs';
import { ResourceBorrowedTab } from './tabs/ResourceBorrowedTab';
import { ResourceDetailsTab } from './tabs/ResourceDetailsTab';
import { ResourceHistoryTab } from './tabs/ResourceHistoryTab';
import { ResourceImagesTab } from './tabs/ResourceImagesTab';

interface ResourceDetailModalProps {
  resource: Resource | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (resource: Resource) => void;
  onBorrow: (resource: Resource) => void;
  onReturn: (resource: Resource) => void;
}

export function ResourceDetailModal({
  resource,
  visible,
  onClose,
  onEdit,
  onBorrow,
  onReturn,
}: ResourceDetailModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { getResourceHistory, getActiveTransactions, cleanupBrokenImages, state } = useResources();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'images' | 'borrowed'>('details');

  // Clean up broken images when modal opens
  useEffect(() => {
    if (resource && visible) {
      cleanupBrokenImages(resource.id);
    }
  }, [resource, visible]);

  if (!resource) return null;

  // Get history for this specific resource - this will automatically update when state.history changes
  // Sort by timestamp (newest first) so recent events appear on top
  const history = state.history
    .filter(h => h.resourceId === resource.id)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const activeTransactions = getActiveTransactions().filter(t => t.resourceId === resource.id);

  const handleBorrow = () => {
    if (resource.availableQuantity === 0) {
      Alert.alert('Not Available', 'This resource is currently not available for borrowing.');
      return;
    }
    onBorrow(resource);
  };

  const handleReturn = () => {
    if (!user?.id) {
      Alert.alert('Authentication Required', 'Please log in to return resources.');
      return;
    }
    
    const userTransaction = activeTransactions.find(t => t.userId === user.id);
    if (!userTransaction) {
      Alert.alert('No Active Transaction', 'You do not have an active transaction for this resource.');
      return;
    }
    onReturn(resource);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        <ResourceDetailHeader
          resource={resource}
          onClose={onClose}
          onEdit={() => onEdit(resource)}
        />

        <ResourceDetailTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeTransactionsCount={activeTransactions.length}
        />

        <View style={styles.tabContent}>
          {activeTab === 'details' && (
            <ResourceDetailsTab resource={resource} />
          )}
          {activeTab === 'history' && (
            <ResourceHistoryTab resourceId={resource.id} history={history} />
          )}
          {activeTab === 'images' && (
            <ResourceImagesTab resource={resource} />
          )}
          {activeTab === 'borrowed' && (
            <ResourceBorrowedTab resourceId={resource.id} />
          )}
        </View>

        <ResourceDetailFooter
          resource={resource}
          activeTransactions={activeTransactions}
          onBorrow={handleBorrow}
          onReturn={handleReturn}
        />
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
  },
});
