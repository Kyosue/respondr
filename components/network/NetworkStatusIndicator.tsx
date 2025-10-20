import { Colors } from '@/constants/Colors';
import { useNetwork } from '@/contexts/NetworkContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Alert, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NetworkStatusIndicatorProps {
  showDetails?: boolean;
  onRetry?: () => void;
}

export function NetworkStatusIndicator({ showDetails = false, onRetry }: NetworkStatusIndicatorProps) {
  const { isOnline, isSlowConnection, isSyncing, pendingOperationsCount, retryConnection, forceSync } = useNetwork();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Animation for syncing state
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (isSyncing) {
      const spin = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      
      spin.start();
      pulse.start();
      
      return () => {
        spin.stop();
        pulse.stop();
      };
    } else {
      spinValue.setValue(0);
      pulseValue.setValue(1);
    }
  }, [isSyncing, spinValue, pulseValue]);
  
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getStatusColor = () => {
    if (isSyncing) return colors.warning;
    if (!isOnline) return colors.error;
    if (isSlowConnection) return colors.warning;
    return colors.success;
  };

  const getStatusText = () => {
    if (isSyncing) return 'Syncing data...';
    if (!isOnline) return 'You\'re offline';
    if (isSlowConnection) return 'Slow connection';
    return 'All systems operational';
  };

  const getStatusIcon = () => {
    if (isSyncing) return 'sync';
    if (!isOnline) return 'cloud-offline';
    if (isSlowConnection) return 'warning';
    return 'cloud-done';
  };

  const getBackgroundColor = () => {
    if (isSyncing) return colors.warning + '15';
    if (!isOnline) return colors.error + '15';
    if (isSlowConnection) return colors.warning + '15';
    return colors.success + '15';
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
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={styles.statusInfo}>
          <Animated.View 
            style={[
              styles.iconContainer, 
              { 
                backgroundColor: getStatusColor(),
                transform: [{ scale: pulseValue }]
              }
            ]}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons 
                name={getStatusIcon() as any} 
                size={14} 
                color={colors.background} 
              />
            </Animated.View>
          </Animated.View>
          <View style={styles.textContainer}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {getStatusText()}
            </Text>
            {pendingOperationsCount > 0 && (
              <Text style={[styles.pendingText, { color: colors.text + '60' }]}>
                {pendingOperationsCount} pending operation{pendingOperationsCount !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          {!isOnline && (
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleRetry}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={12} color={colors.buttonText} />
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                Retry
              </Text>
            </TouchableOpacity>
          )}
          
          {isOnline && pendingOperationsCount > 0 && (
            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={handleSync}
              activeOpacity={0.7}
            >
              <Ionicons name="sync" size={12} color={colors.buttonText} />
              <Text style={[styles.buttonText, { color: colors.buttonText }]}>
                Sync
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {showDetails && (
        <View style={styles.detailsRow}>
          <Text style={[styles.detailsText, { color: colors.text + '70' }]}>
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
    marginHorizontal: 20,
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
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
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 1,
    letterSpacing: 0.1,
    lineHeight: 16,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 14,
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
    borderRadius: 4,
    gap: 4,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
    lineHeight: 14,
  },
  detailsRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  detailsText: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '400',
  },
});
