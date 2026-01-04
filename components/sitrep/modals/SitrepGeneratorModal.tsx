import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { getMunicipalities } from '@/data/davaoOrientalData';
import { OperationRecord, operationsService } from '@/firebase/operations';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { useHybridRamp } from '@/hooks/useHybridRamp';
import { usePlatform } from '@/hooks/usePlatform';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Modal, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { exportSitrepToDoc } from '../utils/exportSitrepToDoc';
import { createStyles, getPlaceholderColor, getTabButtonStyle, getTabTextStyle } from './SitrepGeneratorModal.styles';

interface SitrepGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveSuccess?: () => void;
}

export function SitrepGeneratorModal({
  visible,
  onClose,
  onSaveSuccess,
}: SitrepGeneratorModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isWeb } = usePlatform();
  const styles = createStyles(colors);
  const { firebaseUser, user } = useAuth();
  const { uploadDocument, isUploading: isSaving, error: saveError } = useDocumentUpload();
  const [isExporting, setIsExporting] = useState(false);
  
  const { fadeAnim, scaleAnim, slideAnim, handleClose: rampHandleClose } = useHybridRamp({
    visible,
    onClose: () => {
      // Reset form when closing
      setSelectedOperationId('');
      setShowOperationDropdown(false);
      setSitrep({
        operation: '',
        date: '',
        time: '',
        reportingOffice: '',
        overview: '',
        affectedImages: [],
        casualtyImages: [],
        affectedAreas: [],
        totalBarangays: '',
        casualties: {
          injured: '',
          injuredNotes: '',
          missing: '',
          fatalities: '',
          evacuatedFamilies: '',
          individuals: ''
        },
        evacuationCenters: [],
        responseActions: [] as Array<{ name: string; items: string[] }>,
        personnel: [],
        assets: []
      });
      onClose();
    },
  });

  // SITREP state management
  const [sitrep, setSitrep] = useState({
    operation: '',
    date: '',
    time: '',
    reportingOffice: '',
    overview: '',
    affectedImages: [] as Array<{ data: string; name: string }>,
    casualtyImages: [] as Array<{ data: string; name: string }>,
    affectedAreas: [] as Array<{ municipality: string; details: string }>,
    totalBarangays: '',
    casualties: {
      injured: '',
      injuredNotes: '',
      missing: '',
      fatalities: '',
      evacuatedFamilies: '',
      individuals: ''
    },
    evacuationCenters: [] as string[],
    responseActions: [] as Array<{ name: string; items: string[] }>,
    personnel: [] as Array<{ role: string; detail: string }>,
    assets: [] as string[]
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [operations, setOperations] = useState<OperationRecord[]>([]);
  const [selectedOperationId, setSelectedOperationId] = useState<string>('');
  const [showOperationDropdown, setShowOperationDropdown] = useState(false);
  const municipalities = getMunicipalities();

  const getMunicipalityName = (id: string): string => {
    const municipality = municipalities.find((m: { id: number }) => m.id.toString() === id);
    return municipality?.name || 'Unknown Municipality';
  };

  // Fetch operations when modal opens and sync with real-time updates
  useEffect(() => {
    if (!visible) return;

    const unsubscribe = operationsService.onAllOperations((ops: OperationRecord[]) => {
      // Include all operations (both active and concluded)
      setOperations(ops);
    });

    return () => unsubscribe();
  }, [visible]);

  // Sync form fields when the selected operation is updated
  useEffect(() => {
    if (!selectedOperationId || !visible) return;

    const selectedOperation = operations.find(op => op.id === selectedOperationId);
    if (!selectedOperation) return;

    // Sync operation data when it changes (e.g., when edited externally)
    const syncOperationData = async () => {
      // Format date
      const startDate = selectedOperation.startDate instanceof Date 
        ? selectedOperation.startDate 
        : new Date(selectedOperation.startDate);
      const formattedDate = startDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const formattedTime = startDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });

      // Map operation resources to assets
      const assets = selectedOperation.resources.map(resource => 
        `${resource.resourceName} (${resource.quantity})`
      );

      // Fetch personnel names from Firestore
      const personnel: Array<{ role: string; detail: string }> = [];
      if (selectedOperation.assignedPersonnel && selectedOperation.assignedPersonnel.length > 0) {
        try {
          const { db } = await import('@/firebase/config');
          const { doc, getDoc } = await import('firebase/firestore');
          
          // Get team leader ID from operation
          const teamLeaderId = (selectedOperation as any).teamLeader;
          
          // Fetch all personnel in parallel
          const personnelPromises = selectedOperation.assignedPersonnel.map(async (personnelId, idx) => {
            try {
              const userRef = doc(db, 'users', personnelId);
              const snap = await getDoc(userRef);
              if (snap.exists()) {
                const userData = snap.data() as { fullName?: string; displayName?: string; email?: string };
                const userName = userData.displayName || userData.fullName || `Personnel ${idx + 1}`;
                // Set detail to badge text: "Team Leader" or "Responder"
                const badgeText = personnelId === teamLeaderId ? 'Team Leader' : 'Responder';
                return {
                  role: userName,
                  detail: badgeText
                };
              } else {
                const badgeText = personnelId === teamLeaderId ? 'Team Leader' : 'Responder';
                return {
                  role: `Personnel ${idx + 1}`,
                  detail: badgeText
                };
              }
            } catch (error) {
              console.error(`Error fetching user ${personnelId}:`, error);
              const badgeText = personnelId === teamLeaderId ? 'Team Leader' : 'Responder';
              return {
                role: `Personnel ${idx + 1}`,
                detail: badgeText
              };
            }
          });
          
          const personnelData = await Promise.all(personnelPromises);
          personnel.push(...personnelData);
        } catch (error) {
          console.error('Error fetching personnel names:', error);
          // Fallback to IDs if fetch fails
          const teamLeaderId = (selectedOperation as any).teamLeader;
          selectedOperation.assignedPersonnel.forEach((personnelId, idx) => {
            const badgeText = personnelId === teamLeaderId ? 'Team Leader' : 'Responder';
            personnel.push({
              role: `Personnel ${idx + 1}`,
              detail: badgeText
            });
          });
        }
      }

      // Map location to affected areas
      const municipalityName = getMunicipalityName(selectedOperation.municipalityId);
      const affectedAreas = selectedOperation.exactLocation?.barangay ? [{
        municipality: municipalityName,
        details: `Barangay: ${selectedOperation.exactLocation.barangay}${selectedOperation.exactLocation.purok ? `, Purok: ${selectedOperation.exactLocation.purok}` : ''}${selectedOperation.exactLocation.specificAddress ? ` - ${selectedOperation.exactLocation.specificAddress}` : ''}`
      }] : [];

      // Update SITREP state with latest operation data
      setSitrep(prev => ({
        ...prev,
        operation: selectedOperation.title || prev.operation,
        date: formattedDate,
        time: formattedTime,
        overview: selectedOperation.description || prev.overview,
        affectedAreas,
        assets,
        personnel,
        // Update operation type in response actions if available
        responseActions: selectedOperation.operationType 
          ? [{ name: 'Operations', items: [`Operation Type: ${selectedOperation.operationType}`] }]
          : prev.responseActions
      }));
    };

    syncOperationData();
  }, [selectedOperationId, operations, visible]);

  // Populate form fields when operation is selected
  const handleOperationSelect = async (operationId: string) => {
    const operation = operations.find(op => op.id === operationId);
    if (!operation) return;

    setSelectedOperationId(operationId);
    setShowOperationDropdown(false);

    // Format date
    const startDate = operation.startDate instanceof Date ? operation.startDate : new Date(operation.startDate);
    const formattedDate = startDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const formattedTime = startDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    // Map operation resources to assets
    const assets = operation.resources.map(resource => 
      `${resource.resourceName} (${resource.quantity})`
    );

    // Fetch personnel names from Firestore
    const personnel: Array<{ role: string; detail: string }> = [];
    if (operation.assignedPersonnel && operation.assignedPersonnel.length > 0) {
      try {
        const { db } = await import('@/firebase/config');
        const { doc, getDoc } = await import('firebase/firestore');
        
        // Get team leader ID from operation
        const teamLeaderId = (operation as any).teamLeader;
        
        // Fetch all personnel in parallel
        const personnelPromises = operation.assignedPersonnel.map(async (personnelId, idx) => {
          try {
            const userRef = doc(db, 'users', personnelId);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              const userData = snap.data() as { fullName?: string; displayName?: string; email?: string };
              const userName = userData.displayName || userData.fullName || `Personnel ${idx + 1}`;
              // Set detail to badge text: "Team Leader" or "Responder"
              const badgeText = personnelId === teamLeaderId ? 'Team Leader' : 'Responder';
              return {
                role: userName,
                detail: badgeText
              };
            } else {
              const badgeText = personnelId === teamLeaderId ? 'Team Leader' : 'Responder';
              return {
                role: `Personnel ${idx + 1}`,
                detail: badgeText
              };
            }
          } catch (error) {
            console.error(`Error fetching user ${personnelId}:`, error);
            const badgeText = personnelId === teamLeaderId ? 'Team Leader' : 'Responder';
            return {
              role: `Personnel ${idx + 1}`,
              detail: badgeText
            };
          }
        });
        
        const personnelData = await Promise.all(personnelPromises);
        personnel.push(...personnelData);
      } catch (error) {
        console.error('Error fetching personnel names:', error);
        // Fallback to IDs if fetch fails
        const teamLeaderId = (operation as any).teamLeader;
        operation.assignedPersonnel.forEach((personnelId, idx) => {
          const badgeText = personnelId === teamLeaderId ? 'Team Leader' : 'Responder';
          personnel.push({
            role: `Personnel ${idx + 1}`,
            detail: badgeText
          });
        });
      }
    }

    // Map location to affected areas
    const municipalityName = getMunicipalityName(operation.municipalityId);
    const affectedAreas = operation.exactLocation?.barangay ? [{
      municipality: municipalityName,
      details: `Barangay: ${operation.exactLocation.barangay}${operation.exactLocation.purok ? `, Purok: ${operation.exactLocation.purok}` : ''}${operation.exactLocation.specificAddress ? ` - ${operation.exactLocation.specificAddress}` : ''}`
    }] : [];

    // Update SITREP state with fetched personnel names
    setSitrep(prev => ({
      ...prev,
      operation: operation.title || '',
      date: formattedDate,
      time: formattedTime,
      overview: operation.description || '',
      affectedAreas,
      assets,
      personnel, // Now populated with actual names from Firestore
      // Add operation type to response actions if available
      responseActions: operation.operationType 
        ? [{ name: 'Operations', items: [`Operation Type: ${operation.operationType}`] }]
        : prev.responseActions
    }));
  };

  const handleImageUpload = async (category: 'affectedImages' | 'casualtyImages') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => ({
          data: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`
        }));
        
        setSitrep(prev => ({
          ...prev,
          [category]: [...prev[category], ...newImages]
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const removeImage = (category: 'affectedImages' | 'casualtyImages', index: number) => {
    setSitrep(prev => ({
      ...prev,
      [category]: prev[category].filter((_, idx) => idx !== index)
    }));
  };

  const exportToDoc = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Error', 'Export is only available on web platform.');
      return;
    }

    try {
      setIsExporting(true);
      const userFullName = user?.fullName || user?.displayName || '';
      const { blob, fileName } = await exportSitrepToDoc(sitrep, { userFullName });
      
      // Show success message for export
      Alert.alert('Success', 'Document exported successfully!');
      
      setIsExporting(false);
    } catch (error) {
      console.error('Error exporting document:', error);
      setIsExporting(false);
        Alert.alert('Error', 'Failed to export document. Please try again.');
      }
  };

  const saveToDatabase = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Error', 'Save to database is only available on web platform.');
      return;
    }

    if (!firebaseUser) {
      Alert.alert('Error', 'You must be logged in to save documents.');
      return;
    }

    if (!sitrep.operation || !sitrep.date) {
      Alert.alert('Error', 'Please fill in at least the operation name and date before saving.');
      return;
    }

    try {
      setIsExporting(true);
      
      // Generate the document
      const userFullName = user?.fullName || user?.displayName || '';
      const { blob, fileName } = await exportSitrepToDoc(sitrep, { userFullName });
      
      // Convert blob to File for upload
      const file = new File([blob], fileName, { type: 'application/msword' });
      
      // Create description from overview
      const description = sitrep.overview || `SITREP for ${sitrep.operation} on ${sitrep.date}`;
      
      // Upload to database
      await uploadDocument(file, {
        title: `SITREP - ${sitrep.operation}`,
        description: description,
        uploadedBy: firebaseUser.uid,
        tags: ['sitrep', 'generated', sitrep.operation.toLowerCase().replace(/\s+/g, '-')],
        isPublic: true
      });
      
      setIsExporting(false);
      Alert.alert('Success', 'SITREP saved to database successfully!');
      
      // Trigger refresh in parent component
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      
      // Optionally close the modal after saving
      // rampHandleClose();
    } catch (error) {
      console.error('Error saving document:', error);
      setIsExporting(false);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save document. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const addItem = (category: string, subcategory: string | null = null, sectionIndex: number | null = null) => {
    setSitrep(prev => {
      const newSitrep = { ...prev };
      if (category === 'responseActions' && sectionIndex === null) {
        // Add a new section
        newSitrep.responseActions.push({ name: '', items: [] });
      } else if (category === 'responseActions' && sectionIndex !== null) {
        // Add an item to a specific section
        if (newSitrep.responseActions[sectionIndex]) {
          newSitrep.responseActions[sectionIndex].items.push('');
        }
      } else if (category === 'affectedAreas') {
        newSitrep.affectedAreas.push({ municipality: '', details: '' });
      } else if (category === 'evacuationCenters') {
        newSitrep.evacuationCenters.push('');
      } else if (category === 'personnel') {
        newSitrep.personnel.push({ role: '', detail: 'Responder' });
      } else if (category === 'assets') {
        newSitrep.assets.push('');
      }
      return newSitrep;
    });
  };

  const removeItem = (category: string, index: number, subcategory: string | null = null, sectionIndex: number | null = null) => {
    setSitrep(prev => {
      const newSitrep = { ...prev };
      if (category === 'responseActions' && sectionIndex === null) {
        // Remove a section
        newSitrep.responseActions.splice(index, 1);
      } else if (category === 'responseActions' && sectionIndex !== null) {
        // Remove an item from a specific section
        if (newSitrep.responseActions[sectionIndex]) {
          newSitrep.responseActions[sectionIndex].items.splice(index, 1);
        }
      } else if (category === 'affectedAreas') {
        newSitrep.affectedAreas.splice(index, 1);
      } else if (category === 'evacuationCenters') {
        newSitrep.evacuationCenters.splice(index, 1);
      } else if (category === 'personnel') {
        newSitrep.personnel.splice(index, 1);
      } else if (category === 'assets') {
        newSitrep.assets.splice(index, 1);
      }
      return newSitrep;
    });
  };

  const updateField = (path: string, value: string) => {
    setSitrep(prev => {
      const newSitrep = { ...prev };
      const keys = path.split('.');
      let current: any = newSitrep;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        // Handle numeric array indices
        const numKey = parseInt(key, 10);
        if (!isNaN(numKey) && Array.isArray(current)) {
          current = current[numKey];
        } else {
          current = current[key];
        }
      }
      const lastKey = keys[keys.length - 1];
      const numLastKey = parseInt(lastKey, 10);
      if (!isNaN(numLastKey) && Array.isArray(current)) {
        current[numLastKey] = value;
      } else {
        current[lastKey] = value;
      }
      return newSitrep;
    });
  };

  // Render form content using React Native components
  const renderFormContent = () => {
    return (
      <>
        {/* Operation Selector - Outside ScrollView to prevent clipping */}
        <View style={[styles.operationSelectorContainer, { paddingHorizontal: 24, paddingTop: 24, backgroundColor: colors.background }]}>
          <ThemedText style={styles.sectionLabel}>Select Operation</ThemedText>
          <View style={styles.operationSelectorWrapper}>
            <TouchableOpacity
              style={styles.operationSelector}
              onPress={() => setShowOperationDropdown(!showOperationDropdown)}
              activeOpacity={0.7}
            >
              <ThemedText style={[
                styles.operationSelectorText,
                !selectedOperationId && { opacity: 0.6 }
              ]}>
                {selectedOperationId 
                  ? operations.find(op => op.id === selectedOperationId)?.title || 'Select an operation'
                  : 'Select an operation to populate fields'
                }
              </ThemedText>
              <Ionicons 
                name={showOperationDropdown ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={colors.text} 
              />
            </TouchableOpacity>
            {showOperationDropdown && (
              <>
                {Platform.OS === 'web' && (
                  <TouchableOpacity
                    style={styles.operationDropdownBackdrop}
                    activeOpacity={1}
                    onPress={() => setShowOperationDropdown(false)}
                  />
                )}
                {operations.length > 0 ? (
                  <View style={[styles.operationDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ScrollView style={styles.operationDropdownScroll} nestedScrollEnabled>
                      {operations.map((op) => (
                        <TouchableOpacity
                          key={op.id}
                          style={[
                            styles.operationDropdownItem,
                            selectedOperationId === op.id && { backgroundColor: colors.primary + '20' }
                          ]}
                          onPress={() => handleOperationSelect(op.id)}
                          activeOpacity={0.7}
                        >
                          <ThemedText style={styles.operationDropdownItemText}>
                            {op.title}
                            {op.status === 'concluded' && (
                              <ThemedText style={{ fontSize: 12, opacity: 0.7, marginLeft: 8 }}>
                                (Concluded)
                              </ThemedText>
                            )}
                          </ThemedText>
                          <ThemedText style={[styles.operationDropdownItemSubtext, { color: colors.text + '80' }]}>
                            {op.operationType} • {getMunicipalityName(op.municipalityId)} • {op.exactLocation?.barangay || 'No location'}
                          </ThemedText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                ) : (
                  <View style={[styles.operationDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <ThemedText style={[styles.operationDropdownEmpty, { color: colors.text + '80' }]}>
                      No operations available
                    </ThemedText>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
        
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>

        <View style={styles.tabsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsRow}
            style={styles.tabsScrollView}
          >
            {['overview', 'affected', 'casualties', 'response', 'resources'].map(tab => (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={getTabButtonStyle(activeTab === tab, colors)}
                activeOpacity={0.7}
              >
                <ThemedText style={getTabTextStyle(activeTab === tab, colors.text, colors.primary)}>
                  {tab}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {activeTab === 'overview' && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Header Information</ThemedText>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <ThemedText style={styles.sectionLabel}>Operation Name</ThemedText>
                <TextInput
                  value={sitrep.operation}
                  onChangeText={(value) => updateField('operation', value)}
                  style={styles.textInput}
                  placeholder="Enter operation name"
                  placeholderTextColor={getPlaceholderColor(colors.text)}
                />
              </View>
              <View style={styles.formField}>
                <ThemedText style={styles.sectionLabel}>Date</ThemedText>
                <TextInput
                  value={sitrep.date}
                  onChangeText={(value) => updateField('date', value)}
                  style={styles.textInput}
                  placeholder="Enter date"
                  placeholderTextColor={getPlaceholderColor(colors.text)}
                />
              </View>
              <View style={styles.formField}>
                <ThemedText style={styles.sectionLabel}>Time</ThemedText>
                <TextInput
                  value={sitrep.time}
                  onChangeText={(value) => updateField('time', value)}
                  style={styles.textInput}
                  placeholder="Enter time"
                  placeholderTextColor={getPlaceholderColor(colors.text)}
                />
              </View>
              <View style={styles.formField}>
                <ThemedText style={styles.sectionLabel}>Reporting Office</ThemedText>
                <TextInput
                  value={sitrep.reportingOffice}
                  onChangeText={(value) => updateField('reportingOffice', value)}
                  style={styles.textInput}
                  placeholder="Enter reporting office"
                  placeholderTextColor={getPlaceholderColor(colors.text)}
                />
              </View>
            </View>
            <View>
              <ThemedText style={styles.sectionLabel}>Situation Overview</ThemedText>
              <TextInput
                value={sitrep.overview}
                onChangeText={(value) => updateField('overview', value)}
                multiline
                numberOfLines={8}
                style={styles.textInputMultiline}
                placeholder="Enter situation overview"
                placeholderTextColor={getPlaceholderColor(colors.text)}
              />
            </View>
          </View>
        )}
        {activeTab === 'affected' && (
          <View style={styles.section}>
            <View style={styles.itemHeader}>
              <ThemedText style={styles.textTitle}>Affected Areas</ThemedText>
              <TouchableOpacity
                onPress={() => addItem('affectedAreas')}
                style={styles.addButton}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <ThemedText style={styles.addButtonText}>Add Area</ThemedText>
              </TouchableOpacity>
            </View>
            {sitrep.affectedAreas.map((area, idx) => (
              <View key={idx} style={styles.itemContainer}>
                <View style={styles.itemContent}>
                  <View style={styles.formField}>
                    <ThemedText style={styles.sectionLabel}>Municipality</ThemedText>
                    <TextInput
                      value={area.municipality}
                      onChangeText={(value) => updateField(`affectedAreas.${idx}.municipality`, value)}
                      style={styles.textInputNested}
                      placeholder="Enter municipality"
                      placeholderTextColor={getPlaceholderColor(colors.text)}
                    />
                  </View>
                  <View style={styles.formField}>
                    <ThemedText style={styles.sectionLabel}>Details</ThemedText>
                    <TextInput
                      value={area.details}
                      onChangeText={(value) => updateField(`affectedAreas.${idx}.details`, value)}
                      style={styles.textInputNested}
                      placeholder="Enter details"
                      placeholderTextColor={getPlaceholderColor(colors.text)}
                    />
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => removeItem('affectedAreas', idx)}
                  style={styles.deleteButtonArea}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={20} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))}
            <View>
              <ThemedText style={styles.sectionLabel}>Total Affected Barangays</ThemedText>
              <TextInput
                value={sitrep.totalBarangays}
                onChangeText={(value) => updateField('totalBarangays', value)}
                style={styles.textInput}
                placeholder="Enter total affected barangays"
                placeholderTextColor={getPlaceholderColor(colors.text)}
              />
            </View>
            <View style={styles.imageUploadSection}>
              <ThemedText style={[styles.sectionSubtitle, { marginBottom: 16 }]}>Affected Areas Documentation</ThemedText>
              <TouchableOpacity
                onPress={() => handleImageUpload('affectedImages')}
                style={styles.imageUploadButton}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={32} color={getPlaceholderColor(colors.text)} />
                <ThemedText style={styles.imageUploadText}>Tap to upload images</ThemedText>
                <ThemedText style={styles.imageUploadSubtext}>PNG, JPG up to 10MB</ThemedText>
              </TouchableOpacity>
              {sitrep.affectedImages.length > 0 && (
                <View style={styles.imageGrid}>
                  {sitrep.affectedImages.map((img, idx) => (
                    <View key={idx} style={styles.imageItem}>
                      <Image source={{ uri: img.data }} style={styles.image} resizeMode="cover" />
                      <TouchableOpacity
                        onPress={() => removeImage('affectedImages', idx)}
                        style={styles.imageDeleteButton}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="trash" size={16} color="#fff" />
                      </TouchableOpacity>
                      <ThemedText style={styles.imageName} numberOfLines={1}>{img.name}</ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
        {activeTab === 'casualties' && (
          <View style={styles.section}>
            <ThemedText style={[styles.textTitle, { marginBottom: 8 }]}>Casualties & Victims</ThemedText>
            <View style={styles.formRow}>
              <View style={styles.formField}>
                <ThemedText style={styles.sectionLabel}>Injured</ThemedText>
                <TextInput
                  value={sitrep.casualties.injured}
                  onChangeText={(value) => updateField('casualties.injured', value)}
                  style={styles.textInput}
                  placeholder="Enter number"
                  placeholderTextColor={getPlaceholderColor(colors.text)}
                />
              </View>
              <View style={styles.formField}>
                <ThemedText style={styles.sectionLabel}>Injury Notes</ThemedText>
                <TextInput
                  value={sitrep.casualties.injuredNotes}
                  onChangeText={(value) => updateField('casualties.injuredNotes', value)}
                  style={styles.textInput}
                  placeholder="Enter injury notes"
                  placeholderTextColor={getPlaceholderColor(colors.text)}
                />
              </View>
              <View style={styles.formField}>
                <ThemedText style={styles.sectionLabel}>Missing</ThemedText>
                <TextInput
                  value={sitrep.casualties.missing}
                  onChangeText={(value) => updateField('casualties.missing', value)}
                  style={styles.textInput}
                  placeholder="Enter number"
                  placeholderTextColor={getPlaceholderColor(colors.text)}
                />
              </View>
              <View style={styles.formField}>
                <ThemedText style={styles.sectionLabel}>Fatalities</ThemedText>
                <TextInput
                  value={sitrep.casualties.fatalities}
                  onChangeText={(value) => updateField('casualties.fatalities', value)}
                  style={styles.textInput}
                  placeholder="Enter number"
                  placeholderTextColor={getPlaceholderColor(colors.text)}
                />
              </View>
              <View style={styles.formField}>
                <ThemedText style={styles.sectionLabel}>Evacuated Families</ThemedText>
                <TextInput
                  value={sitrep.casualties.evacuatedFamilies}
                  onChangeText={(value) => updateField('casualties.evacuatedFamilies', value)}
                  style={styles.textInput}
                  placeholder="Enter number"
                  placeholderTextColor={getPlaceholderColor(colors.text)}
                />
              </View>
              <View style={styles.formField}>
                <ThemedText style={styles.sectionLabel}>Individuals in Centers</ThemedText>
                <TextInput
                  value={sitrep.casualties.individuals}
                  onChangeText={(value) => updateField('casualties.individuals', value)}
                  style={styles.textInput}
                  placeholder="Enter number"
                  placeholderTextColor={getPlaceholderColor(colors.text)}
                />
              </View>
            </View>
            <View>
              <View style={styles.itemHeaderWithMargin}>
                <ThemedText style={styles.sectionSubtitle}>Evacuation Centers</ThemedText>
                <TouchableOpacity
                  onPress={() => addItem('evacuationCenters')}
                  style={styles.addButton}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <ThemedText style={styles.addButtonText}>Add Center</ThemedText>
                </TouchableOpacity>
              </View>
              {sitrep.evacuationCenters.map((center, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <TextInput
                    value={center}
                    onChangeText={(value) => updateField(`evacuationCenters.${idx}`, value)}
                    style={styles.textInputFlex}
                    placeholder="Enter evacuation center name"
                    placeholderTextColor={getPlaceholderColor(colors.text)}
                  />
                  <TouchableOpacity
                    onPress={() => removeItem('evacuationCenters', idx)}
                    style={styles.deleteButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.imageUploadSection}>
              <ThemedText style={[styles.sectionSubtitle, { marginBottom: 16 }]}>Casualties Documentation</ThemedText>
              <TouchableOpacity
                onPress={() => handleImageUpload('casualtyImages')}
                style={styles.imageUploadButton}
                activeOpacity={0.7}
              >
                <Ionicons name="add-circle-outline" size={32} color={getPlaceholderColor(colors.text)} />
                <ThemedText style={styles.imageUploadText}>Tap to upload images</ThemedText>
                <ThemedText style={styles.imageUploadSubtext}>PNG, JPG up to 10MB</ThemedText>
              </TouchableOpacity>
              {sitrep.casualtyImages.length > 0 && (
                <View style={styles.imageGrid}>
                  {sitrep.casualtyImages.map((img, idx) => (
                    <View key={idx} style={styles.imageItem}>
                      <Image source={{ uri: img.data }} style={styles.image} resizeMode="cover" />
                      <TouchableOpacity
                        onPress={() => removeImage('casualtyImages', idx)}
                        style={styles.imageDeleteButton}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="trash" size={16} color="#fff" />
                      </TouchableOpacity>
                      <ThemedText style={styles.imageName} numberOfLines={1}>{img.name}</ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
        {activeTab === 'response' && (
          <View style={styles.sectionLarge}>
                <View style={styles.itemHeaderWithMargin}>
              <ThemedText style={[styles.textTitle, { marginBottom: 0 }]}>Actions Taken</ThemedText>
                  <TouchableOpacity
                onPress={() => addItem('responseActions', null, null)}
                    style={styles.addButton}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={16} color="#fff" />
                <ThemedText style={styles.addButtonText}>Add Section</ThemedText>
                  </TouchableOpacity>
                </View>
            
            {sitrep.responseActions.map((section, sectionIdx) => (
              <View key={sectionIdx} style={[styles.itemContainer, { marginBottom: 24, padding: 16, backgroundColor: colors.surface, borderRadius: 8, borderWidth: 1, borderColor: colors.border }]}>
                {/* Section Name - Label and Delete Button in same row */}
                <View style={[styles.itemHeader, { marginBottom: 8 }]}>
                  <ThemedText style={styles.sectionLabel}>Section Name</ThemedText>
                  <TouchableOpacity
                    onPress={() => removeItem('responseActions', sectionIdx, null, null)}
                    style={styles.deleteButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>

                {/* Section Name Input - Full Width */}
                <View style={{ marginBottom: 16 }}>
                  <TextInput
                    value={section.name}
                    onChangeText={(value) => updateField(`responseActions.${sectionIdx}.name`, value)}
                    style={styles.textInput}
                    placeholder="e.g., Operations, Medical, Logistics"
                    placeholderTextColor={getPlaceholderColor(colors.text)}
                  />
                </View>

                {/* Action Items */}
                <View style={{ marginTop: 16 }}>
                  <View style={[styles.itemHeader, { marginBottom: 12 }]}>
                    <ThemedText style={styles.sectionLabel}>Action Items</ThemedText>
                    <TouchableOpacity
                      onPress={() => addItem('responseActions', null, sectionIdx)}
                      style={[styles.addButton, { paddingHorizontal: 12, paddingVertical: 6 }]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add" size={14} color="#fff" />
                      <ThemedText style={[styles.addButtonText, { fontSize: 12 }]}>Add Item</ThemedText>
                    </TouchableOpacity>
                  </View>
                  {section.items.map((item, itemIdx) => (
                    <View key={itemIdx} style={[styles.itemRow, { marginBottom: 8 }]}>
                    <TextInput
                      value={item}
                        onChangeText={(value) => updateField(`responseActions.${sectionIdx}.items.${itemIdx}`, value)}
                      style={styles.textInputFlex}
                        placeholder="Enter action item"
                      placeholderTextColor={getPlaceholderColor(colors.text)}
                        multiline
                    />
                    <TouchableOpacity
                        onPress={() => removeItem('responseActions', itemIdx, null, sectionIdx)}
                      style={styles.deleteButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={20} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                ))}
                  {section.items.length === 0 && (
                    <ThemedText style={[styles.sectionLabel, { opacity: 0.5, fontStyle: 'italic', marginBottom: 8 }]}>
                      No action items yet. Click "Add Item" to add one.
                    </ThemedText>
                  )}
                </View>
              </View>
            ))}
            {sitrep.responseActions.length === 0 && (
              <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
                <ThemedText style={[styles.sectionLabel, { opacity: 0.5, fontStyle: 'italic', textAlign: 'center' }]}>
                  No sections yet. Click "Add Section" to create one.
                </ThemedText>
              </View>
            )}
          </View>
        )}
        {activeTab === 'resources' && (
          <View style={styles.sectionLarge}>
            <ThemedText style={[styles.textTitle, { marginBottom: 8 }]}>Resources Deployed</ThemedText>
            
            <View>
              <View style={styles.itemHeaderWithMargin}>
                <ThemedText style={styles.sectionSubtitle}>Personnel</ThemedText>
                <TouchableOpacity
                  onPress={() => addItem('personnel')}
                  style={styles.addButton}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <ThemedText style={styles.addButtonText}>Add Personnel</ThemedText>
                </TouchableOpacity>
              </View>
              {sitrep.personnel.map((p, idx) => (
                <View key={idx} style={styles.itemRowFlex}>
                  <TextInput
                    placeholder="Role (e.g., 1 Operations Supervisor)"
                    value={p.role}
                    onChangeText={(value) => updateField(`personnel.${idx}.role`, value)}
                    style={[styles.textInputFlex, { flex: 1 }]}
                    placeholderTextColor={getPlaceholderColor(colors.text)}
                  />
                  <View style={[styles.personnelDivider, { backgroundColor: colors.border }]} />
                  <View style={[
                    styles.personnelBadge,
                    { 
                      backgroundColor: p.detail === 'Team Leader' 
                        ? colors.primary + '20' 
                        : colors.border + '40',
                      borderColor: p.detail === 'Team Leader'
                        ? colors.primary
                        : colors.border
                    }
                  ]}>
                    <ThemedText style={[
                      styles.personnelBadgeText,
                      { 
                        color: p.detail === 'Team Leader' 
                          ? colors.primary 
                          : colors.text + 'CC'
                      }
                    ]}>
                      {p.detail}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeItem('personnel', idx)}
                    style={styles.deleteButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View>
              <View style={styles.itemHeaderWithMargin}>
                <ThemedText style={styles.sectionSubtitle}>Assets</ThemedText>
                <TouchableOpacity
                  onPress={() => addItem('assets')}
                  style={styles.addButton}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={16} color="#fff" />
                  <ThemedText style={styles.addButtonText}>Add Asset</ThemedText>
                </TouchableOpacity>
              </View>
              {sitrep.assets.map((asset, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <TextInput
                    value={asset}
                    onChangeText={(value) => updateField(`assets.${idx}`, value)}
                    style={styles.textInputFlex}
                    placeholder="Enter asset name"
                    placeholderTextColor={getPlaceholderColor(colors.text)}
                  />
                  <TouchableOpacity
                    onPress={() => removeItem('assets', idx)}
                    style={styles.deleteButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash-outline" size={20} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
        </ScrollView>
      </>
    );
  };

  // Render modal for both web and mobile
  if (isWeb) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent={true}
        onRequestClose={rampHandleClose}
      >
        <Animated.View style={[styles.modalOverlayWeb, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={rampHandleClose}
          />
          <Animated.View
            style={[
              styles.modalContainerWeb,
              {
                opacity: fadeAnim,
                transform: [
                  { scale: scaleAnim },
                  { translateY: slideAnim }
                ],
              }
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalHeaderTitle}>
                SITREP Generator
              </ThemedText>
              <View style={styles.modalHeaderActions}>
                {/* Action Buttons Group */}
                <View style={styles.actionButtonsGroup}>
                <TouchableOpacity
                  onPress={exportToDoc}
                    style={[styles.exportButton, { opacity: isExporting ? 0.6 : 1 }]}
                  activeOpacity={0.8}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                  ) : (
                  <Ionicons name="download-outline" size={18} color="#fff" />
                  )}
                  <ThemedText style={styles.exportButtonText}>
                    {isExporting ? 'Exporting...' : 'Export'}
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={saveToDatabase}
                    style={[styles.exportButton, { backgroundColor: colors.primary, opacity: (isExporting || isSaving) ? 0.6 : 1 }]}
                  activeOpacity={0.8}
                  disabled={isExporting || isSaving}
                >
                  {(isExporting || isSaving) ? (
                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                  ) : (
                    <Ionicons name="save-outline" size={18} color="#fff" />
                  )}
                  <ThemedText style={styles.exportButtonText}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </ThemedText>
                </TouchableOpacity>
                </View>
                {/* Close Button Separator */}
                <View style={[styles.buttonSeparator, { backgroundColor: colors.border }]} />
                <TouchableOpacity
                  onPress={rampHandleClose}
                  style={styles.closeButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content */}
            <View style={styles.modalContent}>
              {renderFormContent()}
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }

  // Mobile implementation
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={rampHandleClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <ThemedView style={{ flex: 1 }}>
          {/* Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <ThemedText style={styles.modalHeaderTitle}>
              SITREP Generator
            </ThemedText>
            <View style={styles.modalHeaderActions}>
              {/* Action Buttons Group */}
              <View style={styles.actionButtonsGroup}>
              <TouchableOpacity
                onPress={exportToDoc}
                  style={[styles.exportButton, { opacity: isExporting ? 0.6 : 1 }]}
                activeOpacity={0.8}
                disabled={isExporting}
              >
                {isExporting ? (
                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: Platform.OS === 'web' ? 8 : 4 }} />
                ) : (
                    <Ionicons name="download-outline" size={Platform.OS === 'web' ? 18 : 16} color="#fff" />
                )}
                <ThemedText style={styles.exportButtonText}>
                  {isExporting ? 'Exporting...' : 'Export'}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveToDatabase}
                  style={[styles.exportButton, { backgroundColor: colors.primary, opacity: (isExporting || isSaving) ? 0.6 : 1 }]}
                activeOpacity={0.8}
                disabled={isExporting || isSaving}
              >
                {(isExporting || isSaving) ? (
                    <ActivityIndicator size="small" color="#fff" style={{ marginRight: Platform.OS === 'web' ? 8 : 4 }} />
                ) : (
                    <Ionicons name="save-outline" size={Platform.OS === 'web' ? 18 : 16} color="#fff" />
                )}
                <ThemedText style={styles.exportButtonText}>
                  {isSaving ? 'Saving...' : 'Save'}
                </ThemedText>
              </TouchableOpacity>
              </View>
              {/* Close Button Separator */}
              <View style={[styles.buttonSeparator, { backgroundColor: colors.border }]} />
              <TouchableOpacity
                onPress={rampHandleClose}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={Platform.OS === 'web' ? 24 : 22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <View style={styles.modalContent}>
            {renderFormContent()}
          </View>
        </ThemedView>
      </SafeAreaView>
    </Modal>
  );
}
