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
import { DashboardMetrics } from './DashboardMetrics';
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

  // Calculate metrics
  const activeOperations = operations.filter(op => op.status === 'active').length;
  
  // Calculate resource utilization from total quantities, not resource count
  const totalQuantity = resourceState.resources.reduce((sum, r) => sum + (r.totalQuantity || 0), 0);
  const borrowedQuantity = resourceState.resources.reduce((sum, r) => sum + ((r.totalQuantity || 0) - (r.availableQuantity || 0)), 0);
  const resourceUtilization = totalQuantity > 0
    ? Math.round((borrowedQuantity / totalQuantity) * 100)
    : 0;

  // Recent documents (last 7 days) - deduplicate by ID first
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  // Deduplicate documents by ID to prevent counting duplicates
  const uniqueDocuments = Array.from(
    new Map(documents.map(doc => [doc.id, doc])).values()
  );
  
  const recentDocuments = uniqueDocuments.filter(doc => {
    const uploadDate = typeof doc.uploadedAt === 'string' || typeof doc.uploadedAt === 'number'
      ? new Date(doc.uploadedAt)
      : doc.uploadedAt;
    return uploadDate >= sevenDaysAgo;
  }).length;

  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={dashboardStyles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
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
            <ThemedText style={[dashboardStyles.subtitle, { color: colors.text, opacity: 0.7 }]}>
              Overview of your operations, resources, and activities
            </ThemedText>
          </View>
        </View>

        {/* Metrics Section */}
        <DashboardMetrics
          activeOperations={activeOperations}
          resourceUtilization={resourceUtilization}
          recentDocuments={recentDocuments}
        />

        {/* System Alerts */}
        <SystemAlerts />

        {/* Main Content Grid */}
        {isMobile ? (
          <View style={dashboardStyles.mobileLayout}>
            <RecentOperations 
              operations={operations}
              onViewAll={() => handleNavigate('operations')}
              onNavigate={handleNavigate}
            />
            <ResourceOverview />
            <ActivityStream
              operations={operations}
              documents={documents}
              transactions={resourceState.transactions}
            />
          </View>
        ) : (
          <View style={dashboardStyles.desktopLayout}>
            <View style={dashboardStyles.desktopFullWidth}>
              <RecentOperations 
                operations={operations}
                onViewAll={() => handleNavigate('operations')}
                onNavigate={handleNavigate}
              />
              <ResourceOverview />
              <ActivityStream
                operations={operations}
                documents={documents}
                transactions={resourceState.transactions}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}