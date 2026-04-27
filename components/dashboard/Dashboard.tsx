import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useResources } from '@/contexts/ResourceContext';
import { OperationRecord, operationsService } from '@/firebase/operations';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useDocumentDownload } from '@/hooks/useDocumentDownload';
import { useScreenSize } from '@/hooks/useScreenSize';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { ActivityStream } from './ActivityStream';
import { RecentOperations } from './RecentOperations';
import { ResourceOverview } from './ResourceOverview';
import { SystemAlerts } from './SystemAlerts';
import { dashboardStyles } from './styles';

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps = {}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();
  const { state: resourceState } = useResources();
  const { documents, loadDocuments } = useDocumentDownload();
  
  const [operations, setOperations] = useState<OperationRecord[]>([]);
  const [isOperationsLoading, setIsOperationsLoading] = useState(true);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(true);
  const [operationsError, setOperationsError] = useState<string | null>(null);
  const [documentsError, setDocumentsError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const isMountedRef = useRef(true);
  const loadDocumentsRef = useRef(loadDocuments);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    loadDocumentsRef.current = loadDocuments;
  }, [loadDocuments]);

  // Load operations with better timeout and explicit error handling
  useEffect(() => {
    setIsOperationsLoading(true);
    setOperationsError(null);

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let didReceiveSnapshot = false;

    // Longer timeout avoids false failures on slower mobile starts.
    timeoutId = setTimeout(() => {
      if (!didReceiveSnapshot && isMountedRef.current) {
        setIsOperationsLoading(false);
        setOperationsError('Operations are taking longer than expected. Tap retry.');
      }
    }, 8000);

    const unsubscribe = operationsService.onAllOperations(
      (ops: OperationRecord[]) => {
        didReceiveSnapshot = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (!isMountedRef.current) return;
        setOperations(ops);
        setOperationsError(null);
        setIsOperationsLoading(false);
      },
      (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (!isMountedRef.current) return;
        console.error('Dashboard operations subscription failed:', error);
        setIsOperationsLoading(false);
        setOperationsError('Failed to load operations. Tap retry.');
      }
    );

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      unsubscribe();
    };
  }, [retryKey]);

  // Load documents with refresh and explicit failure state
  useEffect(() => {
    let cancelled = false;
    setIsDocumentsLoading(true);
    setDocumentsError(null);

    const run = async () => {
      try {
        await loadDocumentsRef.current(undefined, true); // refresh: true to replace, not append
      } catch (error) {
        if (cancelled || !isMountedRef.current) return;
        console.error('Dashboard documents load failed:', error);
        setDocumentsError('Failed to load documents. Tap retry.');
      } finally {
        if (!cancelled && isMountedRef.current) {
          setIsDocumentsLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  const handleRetry = useCallback(() => {
    setRetryKey(prev => prev + 1);
  }, []);

  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  if (isOperationsLoading && operations.length === 0) {
    return (
      <ThemedView style={dashboardStyles.container}>
        <View
          style={[
            { flex: 1, justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={{ marginTop: 16, opacity: 0.7 }}>
            Loading dashboard...
          </ThemedText>
          {!!operationsError && (
            <>
              <ThemedText style={{ marginTop: 8, opacity: 0.75 }}>
                {operationsError}
              </ThemedText>
              <Pressable
                onPress={handleRetry}
                style={{
                  marginTop: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: `${colors.primary}20`,
                }}
              >
                <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>
                  Retry
                </ThemedText>
              </Pressable>
            </>
          )}
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={dashboardStyles.container}>
      <View
        style={[
          { flex: 1 },
        ]}
      >
        <ScrollView
          style={dashboardStyles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={dashboardStyles.scrollContent}
        >
          {/* Header */}
          <View style={dashboardStyles.header}>
            <View>
              <ThemedText style={[dashboardStyles.title, { color: colors.text }]}>
                Dashboard
              </ThemedText>
              {(operationsError || documentsError) && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <ThemedText style={{ opacity: 0.75 }}>
                    {operationsError || documentsError}
                  </ThemedText>
                  <Pressable onPress={handleRetry}>
                    <ThemedText style={{ color: colors.primary, fontWeight: '700' }}>
                      Retry
                    </ThemedText>
                  </Pressable>
                </View>
              )}
              {isDocumentsLoading && (
                <ThemedText style={{ marginTop: 6, opacity: 0.65 }}>
                  Refreshing documents...
                </ThemedText>
              )}
            </View>
          </View>

          {/* Main Content Grid */}
          {isMobile ? (
            <View style={dashboardStyles.mobileLayout}>
              <SystemAlerts />
              <ResourceOverview />
              <RecentOperations 
                operations={operations}
                onViewAll={() => handleNavigate('operations')}
                onNavigate={handleNavigate}
              />
              <ActivityStream
                operations={operations}
                documents={documents}
                transactions={resourceState.transactions}
                onNavigate={handleNavigate}
              />
            </View>
          ) : (
            <View style={dashboardStyles.bentoGrid}>
              <View style={dashboardStyles.bentoTileFull}>
                <ResourceOverview />
              </View>

              <View style={dashboardStyles.bentoMainRow}>
                <View style={dashboardStyles.bentoTileTall}>
                  <ActivityStream
                    operations={operations}
                    documents={documents}
                    transactions={resourceState.transactions}
                    onNavigate={handleNavigate}
                  />
                </View>

                <View style={dashboardStyles.bentoRightColumn}>
                  <View style={dashboardStyles.bentoTileTopRight}>
                    <RecentOperations 
                      operations={operations}
                      onViewAll={() => handleNavigate('operations')}
                      onNavigate={handleNavigate}
                    />
                  </View>

                  <View style={dashboardStyles.bentoTileBottomRight}>
                    <SystemAlerts />
                  </View>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </ThemedView>
  );
}