import { Colors } from '@/constants/Colors';
import { Municipality } from '@/data/davaoOrientalData';
import { useBottomNavHeight } from '@/hooks/useBottomNavHeight';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { DavaoOrientalMap } from './OperationsMap';
import { MunicipalityDetailModal, OperationsModal } from './modals';
import { operationsService, OperationRecord } from '@/firebase/operations';

const Operations = React.memo(() => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const bottomNavHeight = useBottomNavHeight();
  const { isDesktop } = useScreenSize();
  const [selectedMunicipality, setSelectedMunicipality] = useState<Municipality | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showOperationsModal, setShowOperationsModal] = useState(false);
  const [operationsByMunicipality, setOperationsByMunicipality] = useState<Record<string, any[]>>({});
  const [concludedOperationsByMunicipality, setConcludedOperationsByMunicipality] = useState<Record<string, any[]>>({});
  
  // Memoize screen dimensions to prevent unnecessary recalculations
  const screenDimensions = useMemo(() => {
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    
    if (isDesktop) {
      // For desktop, use most of the available space with padding
      const sidebarWidth = 250; // Approximate sidebar width
      const headerHeight = 80; // Approximate header height
      const padding = 10; // Total padding
      
      return {
        width: screenWidth - sidebarWidth - padding,
        height: screenHeight - headerHeight - padding
      };
    } else {
      // For mobile, account for bottom nav
      const mapHeight = screenHeight - bottomNavHeight - 20;
      return {
        width: screenWidth,
        height: mapHeight
      };
    }
  }, [bottomNavHeight, isDesktop]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleMunicipalityPress = useCallback((municipality: Municipality) => {
    setSelectedMunicipality(municipality);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setSelectedMunicipality(null);
  }, []);

  const handleAddOperation = useCallback(() => {
    setShowOperationsModal(true);
  }, []);

  const closeOperationsModal = useCallback(() => {
    setShowOperationsModal(false);
  }, []);

  const handleOperationSubmit = useCallback((_operation: any) => {
    // Real-time listener will update the list; just close the modal
    setShowOperationsModal(false);
  }, []);

  // Subscribe to operations and group by municipality for map and modal
  useEffect(() => {
    const unsubscribe = operationsService.onAllOperations((ops: OperationRecord[]) => {
      const grouped: Record<string, OperationRecord[]> = {};
      const groupedConcluded: Record<string, OperationRecord[]> = {};
      for (const op of ops) {
        const key = op.municipalityId;
        const target = (op.status === 'concluded')
          ? groupedConcluded
          : grouped;
        if (!target[key]) target[key] = [];
        target[key].push(op);
      }
      setOperationsByMunicipality(grouped);
      setConcludedOperationsByMunicipality(groupedConcluded);
    });
    return unsubscribe;
  }, []);

  const handleConcludeOperation = useCallback(async (operationId: string) => {
    try {
      await operationsService.updateStatus(operationId, 'concluded');
      // Real-time listener will reflect the move between tabs
    } catch (e) {
      console.error('Failed to conclude operation:', e);
    }
  }, []);

  return (
    <View 
      style={Platform.OS === 'web' 
        ? [styles.container, { userSelect: 'none' }]
        : styles.container
      }
    >
      <View style={[styles.mapContainer, { backgroundColor: colors.surface }]}>
        <DavaoOrientalMap 
          width={screenDimensions.width}
          height={screenDimensions.height}
          onMunicipalityPress={handleMunicipalityPress}
          selectedMunicipality={selectedMunicipality}
          operationsByMunicipality={operationsByMunicipality}
        />
      </View>

      <MunicipalityDetailModal
        visible={showModal}
        municipality={selectedMunicipality}
        onClose={closeModal}
        onAddOperation={handleAddOperation}
        recentOperations={selectedMunicipality ? (operationsByMunicipality[selectedMunicipality.id.toString()] ?? []) : []}
        onConcludeOperation={handleConcludeOperation}
        concludedOperations={selectedMunicipality ? (concludedOperationsByMunicipality[selectedMunicipality.id.toString()] ?? []) : []}
      />

      <OperationsModal
        visible={showOperationsModal}
        municipality={selectedMunicipality}
        onClose={closeOperationsModal}
        onSubmit={handleOperationSubmit}
      />
    </View>
  );
});

export { Operations };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    minHeight: 400, // Ensure minimum height for desktop
  },
});







