import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useResources } from '@/contexts/ResourceContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';
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

  // Hybrid RAMP
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose } = useHybridRamp({ visible, onClose });

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
      animationType={isWeb ? 'none' : 'slide'}
      transparent={isWeb}
      presentationStyle={isWeb ? 'overFullScreen' : 'pageSheet'}
      onRequestClose={handleClose}
    >
      {isWeb && (
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backdropTouchable} activeOpacity={1} onPress={handleClose} />
        </Animated.View>
      )}

      <Animated.View
        style={[
          isWeb ? styles.webPanelContainer : styles.mobilePanelContainer,
          isWeb && { transform: [{ scale: scaleAnim }, { translateY: slideAnim }] },
        ]}
      >
      {isWeb ? (
        <ThemedView style={[styles.container, styles.webPanel]}>
          <ResourceDetailHeader
            resource={resource}
            onClose={handleClose}
            onEdit={() => onEdit(resource)}
          />

          <ResourceDetailTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
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
      ) : (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <ThemedView style={styles.container}>
            <ResourceDetailHeader
              resource={resource}
              onClose={handleClose}
              onEdit={() => onEdit(resource)}
            />

            <ResourceDetailTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
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
        </SafeAreaView>
      )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mobilePanelContainer: {
    flex: 1,
  },
  webPanelContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100000,
    pointerEvents: 'box-none',
  },
  webPanel: {
    width: '90%',
    maxWidth: 1000,
    maxHeight: '90%',
    borderRadius: 16,
    overflow: 'hidden',
    ...StyleSheet.create({ shadow: {
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16,
    }}).shadow,
  },
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 99999,
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabContent: {
    flex: 1,
  },
});
