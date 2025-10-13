import { Colors } from '@/constants/Colors';
import { useNetwork } from '@/contexts/NetworkContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NetworkStatusIndicatorProps {
  showDetails?: boolean;
  onRetry?: () => void;
}

export function NetworkStatusIndicator({ showDetails = false, onRetry }: NetworkStatusIndicatorProps) {
  const { isOnline, isSlowConnection, isSyncing, pendingOperationsCount, retryConnection, forceSync } = useNetwork();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getStatusColor = () => {
    if (isSyncing) return colors.warning || '#FFA500';
    if (!isOnline) return colors.error;
    if (isSlowConnection) return colors.warning || '#FFA500';
    return colors.success || '#4CAF50';
  };

  const getStatusText = () => {
    if (isSyncing) return 'Syncing...';
    if (!isOnline) return 'Offline';
    if (isSlowConnection) return 'Slow Connection';
    return 'Online';
  };

  const getStatusIcon = () => {
    if (isSyncing) return 'sync';
    if (!isOnline) return 'cloud-offline';
    if (isSlowConnection) return 'warning';
    return 'cloud-done';
  };

  const handleRetry = async () => {
    if (onRetry) {
      onRetry();
    } else {
      try {
        const success = await retryConnection();
        if (success) {
          await forceSync();
        }
      } catch (error) {
        Alert.alert('Connection Error', 'Failed to retry connection. Please check your network settings.');
      }
    }
  };

  const handleSync = async () => {
    try {
      await forceSync();
    } catch (error) {
      Alert.alert('Sync Error', 'Failed to sync data. Please try again later.');
    }
  };

  if (!showDetails && isOnline && !isSlowConnection && !isSyncing) {
    return null; // Don't show indicator when everything is working fine
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.statusRow}>
        <View style={styles.statusInfo}>
          <Ionicons 
            name={getStatusIcon() as any} 
            size={16} 
            color={getStatusColor()} 
          />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          {pendingOperationsCount > 0 && (
            <Text style={[styles.pendingText, { color: colors.text }]}>
              ({pendingOperationsCount} pending)
            </Text>
          )}
        </View>
        
        <View style={styles.actionButtons}>
          {!isOnline && (
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleRetry}
            >
              <Ionicons name="refresh" size={14} color={colors.buttonText} />
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                Retry
              </Text>
            </TouchableOpacity>
          )}
          
          {isOnline && pendingOperationsCount > 0 && (
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleSync}
            >
              <Ionicons name="sync" size={14} color={colors.buttonText} />
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                Sync
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {showDetails && (
        <View style={styles.detailsRow}>
          <Text style={[styles.detailsText, { color: colors.text }]}>
            {!isOnline 
              ? 'Working offline. Changes will sync when connection is restored.'
              : isSlowConnection 
                ? 'Slow connection detected. Some features may be limited.'
                : 'All systems operational.'
            }
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  pendingText: {
    fontSize: 12,
    marginLeft: 8,
    opacity: 0.7,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailsRow: {
    marginTop: 4,
  },
  detailsText: {
    fontSize: 12,
    opacity: 0.7,
    lineHeight: 16,
  },
});
