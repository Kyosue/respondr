import { Colors } from '@/constants/Colors';
import { useNetwork } from '@/contexts/NetworkContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useOfflineOperations } from '@/hooks/useOfflineOperations';
import { CacheManager } from '@/utils/cacheManager';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function ResilienceExample() {
  const [cachedData, setCachedData] = useState<any>(null);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const { 
    isOnline, 
    isSlowConnection, 
    isSyncing, 
    pendingOperationsCount,
    forceSync 
  } = useNetwork();
  
  const { 
    pendingOperations, 
    handleSync, 
    queueOperation, 
    getStorageInfo 
  } = useOfflineOperations();

  const cache = CacheManager.getInstance();

  useEffect(() => {
    loadCacheStats();
  }, []);

  const loadCacheStats = async () => {
    const stats = cache.getStats();
    setCacheStats(stats);
  };

  const testCache = async () => {
    try {
      // Test caching data
      const testData = {
        id: Date.now(),
        message: 'This is cached data',
        timestamp: new Date().toISOString(),
      };

      await cache.set('testData', testData, {
        ttl: 5 * 60 * 1000, // 5 minutes
        priority: 'high',
      });

      // Retrieve cached data
      const retrieved = await cache.get('testData');
      setCachedData(retrieved);
      
      Alert.alert('Success', 'Data cached and retrieved successfully!');
      loadCacheStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to cache data: ' + error);
    }
  };

  const testOfflineOperation = async () => {
    try {
      // Queue an operation for offline sync
      await queueOperation('create', 'testCollection', `doc_${Date.now()}`, {
        message: 'This is a test offline operation',
        timestamp: new Date().toISOString(),
      });
      
      Alert.alert('Success', 'Operation queued for offline sync!');
    } catch (error) {
      Alert.alert('Error', 'Failed to queue operation: ' + error);
    }
  };

  const testSync = async () => {
    try {
      await handleSync();
      Alert.alert('Success', 'Sync completed successfully!');
    } catch (error) {
      Alert.alert('Error', 'Sync failed: ' + error);
    }
  };

  const clearCache = () => {
    cache.clear();
    setCachedData(null);
    loadCacheStats();
    Alert.alert('Success', 'Cache cleared!');
  };

  const getStorageInfoData = async () => {
    try {
      const info = await getStorageInfo();
      Alert.alert('Storage Info', `Size: ${info.size} bytes\nKeys: ${info.keys.length}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to get storage info: ' + error);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Resilience Features Demo
      </Text>

      {/* Network Status */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Network Status
        </Text>
        <View style={styles.statusRow}>
          <Ionicons 
            name={isOnline ? "cloud-done" : "cloud-offline"} 
            size={20} 
            color={isOnline ? colors.success : colors.error} 
          />
          <Text style={[styles.statusText, { color: colors.text }]}>
            {isOnline ? 'Online' : 'Offline'}
          </Text>
        </View>
        {isSlowConnection && (
          <Text style={[styles.warningText, { color: colors.warning }]}>
            Slow connection detected
          </Text>
        )}
        {isSyncing && (
          <Text style={[styles.infoText, { color: colors.primary }]}>
            Syncing data...
          </Text>
        )}
        <Text style={[styles.infoText, { color: colors.text }]}>
          Pending operations: {pendingOperationsCount}
        </Text>
      </View>

      {/* Cache Management */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Cache Management
        </Text>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={testCache}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>
            Test Cache
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.secondary }]}
          onPress={clearCache}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>
            Clear Cache
          </Text>
        </TouchableOpacity>

        {cachedData && (
          <View style={styles.dataContainer}>
            <Text style={[styles.dataTitle, { color: colors.text }]}>
              Cached Data:
            </Text>
            <Text style={[styles.dataText, { color: colors.text }]}>
              {JSON.stringify(cachedData, null, 2)}
            </Text>
          </View>
        )}

        {cacheStats && (
          <View style={styles.statsContainer}>
            <Text style={[styles.statsTitle, { color: colors.text }]}>
              Cache Statistics:
            </Text>
            <Text style={[styles.statsText, { color: colors.text }]}>
              Size: {Math.round(cacheStats.size / 1024)} KB
            </Text>
            <Text style={[styles.statsText, { color: colors.text }]}>
              Entries: {cacheStats.count}
            </Text>
            <Text style={[styles.statsText, { color: colors.text }]}>
              Hit Rate: {Math.round(cacheStats.hitRate * 100)}%
            </Text>
          </View>
        )}
      </View>

      {/* Offline Operations */}
      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Offline Operations
        </Text>
        
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={testOfflineOperation}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>
            Queue Offline Operation
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.secondary }]}
          onPress={testSync}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>
            Force Sync
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.accent }]}
          onPress={getStorageInfoData}
        >
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>
            Get Storage Info
          </Text>
        </TouchableOpacity>

        {pendingOperations.length > 0 && (
          <View style={styles.operationsContainer}>
            <Text style={[styles.operationsTitle, { color: colors.text }]}>
              Pending Operations:
            </Text>
            {pendingOperations.map((op, index) => (
              <Text key={index} style={[styles.operationText, { color: colors.text }]}>
                {op.type} {op.collection}/{op.documentId} (retries: {op.retryCount})
              </Text>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dataContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  dataTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  dataText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  statsContainer: {
    marginTop: 12,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  statsText: {
    fontSize: 12,
    marginBottom: 2,
  },
  operationsContainer: {
    marginTop: 12,
  },
  operationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  operationText: {
    fontSize: 12,
    marginBottom: 2,
    fontFamily: 'monospace',
  },
});
