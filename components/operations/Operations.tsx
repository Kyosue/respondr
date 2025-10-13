import { Colors } from '@/constants/Colors';
import { Municipality } from '@/data/davaoOrientalData';
import { useBottomNavHeight } from '@/hooks/useBottomNavHeight';
import { useColorScheme } from '@/hooks/useColorScheme';
import React, { useCallback, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { DavaoOrientalMap } from './OperationsMap';
import { MunicipalityDetailModal, OperationsModal } from './modals';

const Operations = React.memo(() => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const bottomNavHeight = useBottomNavHeight();
  const [selectedMunicipality, setSelectedMunicipality] = useState<Municipality | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showOperationsModal, setShowOperationsModal] = useState(false);
  const [operationsByMunicipality, setOperationsByMunicipality] = useState<Record<string, any[]>>({});
  const [concludedOperationsByMunicipality, setConcludedOperationsByMunicipality] = useState<Record<string, any[]>>({});
  
  // Memoize screen dimensions to prevent unnecessary recalculations
  const screenDimensions = useMemo(() => {
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const mapHeight = screenHeight - bottomNavHeight - 20; // Account for bottom nav + padding
    return {
      width: screenWidth,
      height: mapHeight
    };
  }, [bottomNavHeight]);

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

  const handleOperationSubmit = useCallback((operation: any) => {
    // Store operation under its municipalityId so it's only visible for that place
    setOperationsByMunicipality(prev => {
      const municipalityId = operation.municipalityId;
      const existing = prev[municipalityId] || [];
      return {
        ...prev,
        [municipalityId]: [operation, ...existing]
      };
    });

    setShowOperationsModal(false);
  }, []);

  const handleConcludeOperation = useCallback((operationId: string) => {
    // Find the operation to conclude
    let concludedOperation: any = null;
    let municipalityId = '';
    
    Object.keys(operationsByMunicipality).forEach(muniId => {
      const operation = operationsByMunicipality[muniId].find(op => op.id === operationId);
      if (operation) {
        concludedOperation = { ...operation, status: 'concluded', concludedAt: new Date() };
        municipalityId = muniId;
      }
    });

    if (concludedOperation) {
      // Remove from current operations
      setOperationsByMunicipality(prev => {
        const newState = { ...prev };
        newState[municipalityId] = newState[municipalityId].filter(op => op.id !== operationId);
        return newState;
      });

      // Add to concluded operations
      setConcludedOperationsByMunicipality(prev => {
        const existing = prev[municipalityId] || [];
        return {
          ...prev,
          [municipalityId]: [concludedOperation, ...existing]
        };
      });
    }
  }, [operationsByMunicipality]);

  return (
    <View style={styles.container}>
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
  },
});







