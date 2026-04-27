import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useResources } from '@/contexts/ResourceContext';
import { OperationRecord, operationsService } from '@/firebase/operations';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useDocumentDownload } from '@/hooks/useDocumentDownload';
import { useScreenSize } from '@/hooks/useScreenSize';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
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
  const [isLoading, setIsLoading] = useState(true);

  // Load operations with timeout fallback for slow RN startup
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let hasReceivedData = false;

    // Ensure loading state clears if Firestore is slow to initialize on mobile
    timeoutId = setTimeout(() => {
      if (!hasReceivedData) {
        setIsLoading(false);
        setOperations([]);
      }
    }, 3000);

    const unsubscribe = operationsService.onAllOperations((ops: OperationRecord[]) => {
      hasReceivedData = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      setOperations(ops);
      setIsLoading(false);
    });

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      unsubscribe();
    };
  }, []);

  // Load documents (only once on mount, with refresh to avoid duplicates)
  useEffect(() => {
    loadDocuments(undefined, true); // refresh: true to replace, not append
  }, [loadDocuments]); // Include loadDocuments in dependencies

  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  if (isLoading) {
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