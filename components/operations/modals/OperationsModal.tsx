import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BarangayDropdown } from '@/components/ui/BarangayDropdown';
import { FormButton, FormDatePicker, FormInput } from '@/components/ui/FormComponents';
import { WebOptimizedImage } from '@/components/ui/WebOptimizedImage';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useResources } from '@/contexts/ResourceContext';
import { Municipality } from '@/data/davaoOrientalData';
import { getUsersWithFilters } from '@/firebase/auth';
import { operationsService } from '@/firebase/operations';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';
import { ResourceCategory } from '@/types/Resource';
import { UserData } from '@/types/UserData';
import { getModalConfig } from '@/utils/modalUtils';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './OperationsModal.styles';
import { PersonnelSelectionModal } from './PersonnelSelectionModal';
import { ResourceSelectionModal } from './ResourceSelectionModal';

interface OperationsModalProps {
  visible: boolean;
  municipality: Municipality | null;
  onClose: () => void;
  onSubmit: (operation: OperationData) => void;
  existingOperation?: OperationData | null;
}

interface OperationData {
  id: string;
  municipalityId: string;
  operationType: string;
  title: string;
  description: string;
  status: 'active' | 'concluded';
  startDate: Date;
  endDate?: Date;
  exactLocation: {
    barangay: string;
    purok: string;
    specificAddress?: string;
  };
  resources: OperationResource[];
  assignedPersonnel: string[];
  teamLeader?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OperationResource {
  resourceId: string;
  resourceName: string;
  category: ResourceCategory;
  quantity: number;
  status: 'requested' | 'allocated' | 'in_use' | 'returned';
}

export function OperationsModal({ 
  visible, 
  municipality, 
  onClose,
  onSubmit,
  existingOperation
}: OperationsModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { state: resourceState, getFilteredResources } = useResources();
  const { user } = useAuth();

  const initialOperationData: Partial<OperationData> = {
    operationType: '',
    title: '',
    description: '',
    status: 'active',
    startDate: new Date(),
    exactLocation: {
      barangay: '',
      purok: '',
      specificAddress: ''
    },
    resources: [],
    assignedPersonnel: [],
    notes: ''
  };

  // Hybrid RAMP hook
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose: rampHandleClose } = useHybridRamp({
    visible,
    onClose: () => {
      // Reset form data
      setOperationData({ ...initialOperationData, startDate: new Date() });
      setSelectedResources([]);
      setShowResourceModal(false);
      setSelectedPersonnel([]);
      setSelectedTeamLeader(undefined);
      setShowPersonnelModal(false);
      onClose();
    }
  });

  const [operationData, setOperationData] = useState<Partial<OperationData>>(initialOperationData);

  const [selectedResources, setSelectedResources] = useState<OperationResource[]>([]);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([]);
  const [selectedTeamLeader, setSelectedTeamLeader] = useState<string | undefined>(undefined);
  const [showPersonnelModal, setShowPersonnelModal] = useState(false);
  const [personnelMap, setPersonnelMap] = useState<Map<string, UserData>>(new Map());

  // Populate form when editing
  useEffect(() => {
    if (existingOperation && visible) {
      setOperationData({
        operationType: existingOperation.operationType,
        title: existingOperation.title,
        description: existingOperation.description,
        status: existingOperation.status,
        startDate: existingOperation.startDate instanceof Date ? existingOperation.startDate : new Date(existingOperation.startDate),
        endDate: existingOperation.endDate ? (existingOperation.endDate instanceof Date ? existingOperation.endDate : new Date(existingOperation.endDate)) : undefined,
        exactLocation: existingOperation.exactLocation,
        notes: existingOperation.notes
      });
      setSelectedResources((existingOperation.resources || []).map(r => ({
        ...r,
        category: r.category as ResourceCategory
      })));
      setSelectedPersonnel(existingOperation.assignedPersonnel || []);
      setSelectedTeamLeader(existingOperation.teamLeader);
    } else if (!existingOperation && visible) {
      // Reset to initial state when creating new operation
      setOperationData({ ...initialOperationData, startDate: new Date() });
      setSelectedResources([]);
      setSelectedPersonnel([]);
      setSelectedTeamLeader(undefined);
    }
  }, [existingOperation, visible]);

  // Get available resources from context
  const allAvailableResources = getFilteredResources().filter(resource => 
    resource.status === 'active' && resource.availableQuantity > 0
  );

  // Fetch personnel data for display (operators and supervisors)
  useEffect(() => {
    const fetchPersonnelData = async () => {
      if (selectedPersonnel.length > 0) {
        try {
          const [operators, supervisors] = await Promise.all([
            getUsersWithFilters({
            userType: 'operator',
            status: 'active'
            }),
            getUsersWithFilters({
              userType: 'supervisor',
              status: 'active'
            })
          ]);
          const map = new Map<string, UserData>();
          [...operators, ...supervisors].forEach(user => {
            if (selectedPersonnel.includes(user.id)) {
              map.set(user.id, user);
            }
          });
          setPersonnelMap(map);
        } catch (error) {
          console.error('Error fetching personnel data:', error);
        }
      } else {
        setPersonnelMap(new Map());
      }
    };
    fetchPersonnelData();
  }, [selectedPersonnel]);

  const handleInputChange = (field: keyof OperationData, value: any) => {
    setOperationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResourceModalConfirm = (resources: OperationResource[]) => {
    setSelectedResources(resources);
    setShowResourceModal(false);
  };

  const handlePersonnelModalConfirm = (result: { personnel: string[]; teamLeader?: string }) => {
    setSelectedPersonnel(result.personnel);
    setSelectedTeamLeader(result.teamLeader);
    setShowPersonnelModal(false);
  };

  const handlePersonnelRemove = (userId: string) => {
    setSelectedPersonnel(prev => prev.filter(id => id !== userId));
    // Clear team leader if removed
    if (selectedTeamLeader === userId) {
      setSelectedTeamLeader(undefined);
    }
  };

  const handleResourceQuantityChange = (resourceId: string, quantity: number) => {
    if (quantity <= 0) {
      setSelectedResources(prev => prev.filter(r => r.resourceId !== resourceId));
    } else {
      setSelectedResources(prev =>
        prev.map(r =>
          r.resourceId === resourceId ? { ...r, quantity } : r
        )
      );
    }
  };

  const resetForm = () => {
    setOperationData({ ...initialOperationData, startDate: new Date() });
    setSelectedResources([]);
    setShowResourceModal(false);
    setSelectedPersonnel([]);
    setShowPersonnelModal(false);
  };

  const handleClose = rampHandleClose;


  const handleSubmit = async () => {
    if (!operationData.title || !operationData.operationType || !municipality) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!operationData.exactLocation?.barangay) {
      Alert.alert('Error', 'Please specify the barangay');
      return;
    }

    const isEditing = !!existingOperation;
    const operationId = existingOperation?.id || Date.now().toString();

    const operationPayload: OperationData = {
      id: operationId,
      municipalityId: municipality.id.toString(),
      operationType: operationData.operationType,
      title: operationData.title,
      description: operationData.description || '',
      status: operationData.status || 'active',
      startDate: operationData.startDate || new Date(),
      endDate: operationData.endDate,
      exactLocation: {
        barangay: operationData.exactLocation.barangay,
        purok: operationData.exactLocation.purok,
        specificAddress: operationData.exactLocation.specificAddress || ''
      },
      resources: selectedResources,
      assignedPersonnel: selectedPersonnel,
      teamLeader: selectedTeamLeader,
      notes: operationData.notes,
      createdAt: existingOperation?.createdAt || new Date(),
      updatedAt: new Date()
    };

    try {
      if (isEditing) {
        // Update existing operation
        await operationsService.updateOperation(
          operationId,
          {
            municipalityId: operationPayload.municipalityId,
            operationType: operationPayload.operationType,
            title: operationPayload.title,
            description: operationPayload.description,
            status: operationPayload.status,
            startDate: operationPayload.startDate,
            endDate: operationPayload.endDate,
            exactLocation: operationPayload.exactLocation,
            resources: operationPayload.resources,
            assignedPersonnel: operationPayload.assignedPersonnel,
            teamLeader: operationPayload.teamLeader,
            notes: operationPayload.notes,
          },
          user?.id
        );
        onSubmit(operationPayload);
      } else {
        // Create new operation
      const created = await operationsService.createOperation({
          municipalityId: operationPayload.municipalityId,
          operationType: operationPayload.operationType,
          title: operationPayload.title,
          description: operationPayload.description,
          status: operationPayload.status,
          startDate: operationPayload.startDate,
          endDate: operationPayload.endDate,
          exactLocation: operationPayload.exactLocation,
          resources: operationPayload.resources,
          assignedPersonnel: operationPayload.assignedPersonnel,
          teamLeader: operationPayload.teamLeader,
          notes: operationPayload.notes,
        createdAt: new Date(), // will be replaced by serverTimestamp in service
        updatedAt: new Date(), // will be replaced by serverTimestamp in service
        createdBy: user?.id,
      } as any);
      onSubmit(created as any);
      }
      resetForm();
      onClose();
    } catch (e) {
      console.error(`Failed to ${isEditing ? 'update' : 'create'} operation:`, e);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} operation. Please try again.`);
    }
  };

  if (!municipality) return null;

  // Platform-specific modal rendering
  if (isWeb) {
    // Hybrid RAMP implementation for web
    return (
      <Modal
        visible={visible}
        {...getModalConfig()}
        onRequestClose={handleClose}
        transparent={true}
        animationType="fade"
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={styles.overlayCloseButton} 
            onPress={handleClose}
            activeOpacity={0.7}
          />
          <Animated.View style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ]
            }
          ]}>
            <ThemedView style={styles.modalContent}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <ThemedText type="subtitle" style={styles.title}>
                {existingOperation ? 'Edit Operation' : 'New Operation'}
              </ThemedText>
              <ThemedText style={[styles.headerSubtitle, { color: colors.text + '80' }]}>
                {municipality.name}
              </ThemedText>
            </View>
            <View style={styles.headerButton}>
              <FormButton
                title="Create"
                onPress={handleSubmit}
                variant="primary"
                disabled={!operationData.title || !operationData.operationType || !operationData.exactLocation?.barangay}
              />
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Operation Details</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FormInput
                label="Operation Type"
                value={operationData.operationType || ''}
                onChangeText={(text) => handleInputChange('operationType', text)}
                placeholder="e.g., Emergency Response, Relief Distribution"
                required
                helperText="Specify the type of operation being conducted"
              />

              <FormInput
                label="Operation Title"
                value={operationData.title || ''}
                onChangeText={(text) => handleInputChange('title', text)}
                placeholder="Enter operation title"
                required
                helperText="Give this operation a clear, descriptive title"
              />

              <FormInput
                label="Description"
                value={operationData.description || ''}
                onChangeText={(text) => handleInputChange('description', text)}
                placeholder="Describe the operation details and objectives..."
                multiline
                numberOfLines={3}
                helperText="Provide detailed information about the operation's purpose and scope"
              />
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Timeline</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FormDatePicker
                label="Start Date"
                value={operationData.startDate || new Date()}
                onDateChange={(date) => handleInputChange('startDate', date)}
                required
              />
            </View>
          </View>

          {/* Exact Location */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="location-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Exact Location</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <BarangayDropdown
                label="Barangay"
                value={operationData.exactLocation?.barangay || ''}
                onValueChange={(text) => handleInputChange('exactLocation', { 
                  ...operationData.exactLocation, 
                  barangay: text 
                })}
                municipalityName={municipality.name}
                placeholder="Select barangay"
                required
                helperText="Specify the barangay where the operation will take place"
                colors={colors}
              />

              <FormInput
                label="Purok/Sitio (Optional)"
                value={operationData.exactLocation?.purok || ''}
                onChangeText={(text) => handleInputChange('exactLocation', { 
                  ...operationData.exactLocation, 
                  purok: text 
                })}
                placeholder="Enter purok or sitio name"
                helperText="Specify the purok or sitio within the barangay (optional)"
              />
            </View>
          </View>

          {/* Resources */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="cube-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Required Resources</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.resourceHeader}>
                <ThemedText style={[styles.label, { color: colors.text }]}>
                  Select Resources ({selectedResources.length} selected)
                </ThemedText>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowResourceModal(true)}
                >
                  <ThemedText style={styles.addButtonText}>
                    {selectedResources.length > 0 ? "Edit Resources" : "Select Resources"}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* Selected Resources Summary */}
              {selectedResources.length > 0 && (
                <View style={styles.selectedResourcesContainer}>
                  <ScrollView 
                    style={{ maxHeight: 200 }}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    {selectedResources.map((resource) => {
                      const fullResource = allAvailableResources.find(r => r.id === resource.resourceId);
                      return (
                        <View key={resource.resourceId} style={[styles.selectedResource, { backgroundColor: colors.background }]}>
                          <View style={styles.selectedResourceImage}>
                            {fullResource?.images && fullResource.images.length > 0 ? (
                              <WebOptimizedImage
                                source={{ uri: fullResource.images[0] }}
                                style={styles.selectedResourceImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={[styles.selectedResourceImage, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                                <Ionicons name="cube-outline" size={16} color={colors.text} />
                              </View>
                            )}
                          </View>
                          <View style={styles.selectedResourceInfo}>
                            <ThemedText style={[styles.selectedResourceName, { color: colors.text }]}>
                              {resource.resourceName}
                            </ThemedText>
                            <ThemedText style={[styles.selectedResourceCategory, { color: colors.text, opacity: 0.7 }]}>
                              {resource.category.charAt(0).toUpperCase() + resource.category.slice(1)}
                            </ThemedText>
                          </View>
                          <View style={styles.quantityContainer}>
                            <TouchableOpacity
                              style={[styles.quantityButton, { backgroundColor: colors.border }]}
                              onPress={() => handleResourceQuantityChange(resource.resourceId, resource.quantity - 1)}
                            >
                              <Ionicons name="remove" size={16} color={colors.text} />
                            </TouchableOpacity>
                            <ThemedText style={[styles.quantityText, { color: colors.text }]}>
                              {resource.quantity}
                            </ThemedText>
                            <TouchableOpacity
                              style={[styles.quantityButton, { backgroundColor: colors.border }]}
                              onPress={() => handleResourceQuantityChange(resource.resourceId, resource.quantity + 1)}
                            >
                              <Ionicons name="add" size={16} color={colors.text} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Assigned Personnel */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="people-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Assigned Personnel</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.resourceHeader}>
                <ThemedText style={[styles.label, { color: colors.text }]}>
                  Select Personnel ({selectedPersonnel.length} selected)
                </ThemedText>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowPersonnelModal(true)}
                >
                  <ThemedText style={styles.addButtonText}>
                    {selectedPersonnel.length > 0 ? "Edit Personnel" : "Select Personnel"}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* Selected Personnel Summary */}
              {selectedPersonnel.length > 0 && (
                <View style={styles.selectedResourcesContainer}>
                  <ScrollView 
                    style={{ maxHeight: 200 }}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    {selectedPersonnel.map((userId) => {
                      const person = personnelMap.get(userId);
                      const isTeamLeader = selectedTeamLeader === userId;
                      const isSupervisor = person?.userType === 'supervisor';
                      const getLastName = (fullName: string): string => {
                        const parts = fullName.trim().split(/\s+/);
                        return parts.length > 1 ? parts[parts.length - 1] : fullName;
                      };
                      const lastName = person ? getLastName(person.fullName) : '';
                      const firstName = person ? person.fullName.replace(lastName, '').trim() : '';
                      const displayName = person ? `${lastName}, ${firstName}` : 'Loading...';
                      
                      return (
                        <View key={userId} style={[styles.selectedResource, { backgroundColor: colors.background }]}>
                          <View style={[styles.selectedResourceImage, { backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="person" size={16} color={colors.primary} />
                          </View>
                          <View style={styles.selectedResourceInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                            <ThemedText style={[styles.selectedResourceName, { color: colors.text }]}>
                              {displayName}
                            </ThemedText>
                              {isTeamLeader && (
                                <View style={{
                                  backgroundColor: colors.primary,
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 4
                                }}>
                                  <ThemedText style={{
                                    fontSize: 10,
                                    fontWeight: '700',
                                    color: 'white',
                                    textTransform: 'uppercase'
                                  }}>
                                    Leader
                                  </ThemedText>
                                </View>
                              )}
                              {isSupervisor && (
                                <View style={{
                                  backgroundColor: '#FF6B35',
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 4
                                }}>
                                  <ThemedText style={{
                                    fontSize: 10,
                                    fontWeight: '700',
                                    color: 'white',
                                    textTransform: 'uppercase'
                                  }}>
                                    Supervisor
                                  </ThemedText>
                                </View>
                              )}
                            </View>
                            <ThemedText style={[styles.selectedResourceCategory, { color: colors.text, opacity: 0.7 }]}>
                              {person?.email || 'Loading...'}
                            </ThemedText>
                          </View>
                          <TouchableOpacity
                            style={[styles.quantityButton, { backgroundColor: colors.error || '#EF4444' }]}
                            onPress={() => handlePersonnelRemove(userId)}
                          >
                            <Ionicons name="close" size={16} color="white" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Additional Notes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="document-text-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Additional Notes</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FormInput
                label="Notes"
                value={operationData.notes || ''}
                onChangeText={(text) => handleInputChange('notes', text)}
                placeholder="Any additional notes or special instructions..."
                multiline
                numberOfLines={3}
                helperText="Add any special instructions or additional information for this operation"
              />
            </View>
          </View>
        </ScrollView>
            </ThemedView>
          </Animated.View>
        </Animated.View>

        {/* Resource Selection Modal */}
        <ResourceSelectionModal
          visible={showResourceModal}
          onClose={() => setShowResourceModal(false)}
          onConfirm={handleResourceModalConfirm}
          availableResources={allAvailableResources}
          selectedResources={selectedResources}
          colors={colors}
        />

        {/* Personnel Selection Modal */}
        <PersonnelSelectionModal
          visible={showPersonnelModal}
          onClose={() => setShowPersonnelModal(false)}
          onConfirm={handlePersonnelModalConfirm}
          selectedPersonnel={selectedPersonnel}
          selectedTeamLeader={selectedTeamLeader}
          colors={colors}
        />
      </Modal>
    );
  }

  // Original mobile implementation
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <ThemedView style={styles.mobileContainer}>
          <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <ThemedText type="subtitle" style={styles.title}>
                {existingOperation ? 'Edit Operation' : 'New Operation'}
              </ThemedText>
              <ThemedText style={[styles.headerSubtitle, { color: colors.text + '80' }]}>
                {municipality.name}
              </ThemedText>
            </View>
            <View style={styles.headerButton}>
              <FormButton
                title="Create"
                onPress={handleSubmit}
                variant="primary"
                disabled={!operationData.title || !operationData.operationType || !operationData.exactLocation?.barangay}
              />
            </View>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Basic Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Operation Details</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FormInput
                label="Operation Type"
                value={operationData.operationType || ''}
                onChangeText={(text) => handleInputChange('operationType', text)}
                placeholder="e.g., Emergency Response, Relief Distribution"
                required
                helperText="Specify the type of operation being conducted"
              />

              <FormInput
                label="Operation Title"
                value={operationData.title || ''}
                onChangeText={(text) => handleInputChange('title', text)}
                placeholder="Enter operation title"
                required
                helperText="Give this operation a clear, descriptive title"
              />

              <FormInput
                label="Description"
                value={operationData.description || ''}
                onChangeText={(text) => handleInputChange('description', text)}
                placeholder="Describe the operation details and objectives..."
                multiline
                numberOfLines={3}
                helperText="Provide detailed information about the operation's purpose and scope"
              />
            </View>
          </View>

          {/* Timeline */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="calendar-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Timeline</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FormDatePicker
                label="Start Date"
                value={operationData.startDate || new Date()}
                onDateChange={(date) => handleInputChange('startDate', date)}
                required
              />
            </View>
          </View>

          {/* Exact Location */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="location-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Exact Location</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <BarangayDropdown
                label="Barangay"
                value={operationData.exactLocation?.barangay || ''}
                onValueChange={(text) => handleInputChange('exactLocation', { 
                  ...operationData.exactLocation, 
                  barangay: text 
                })}
                municipalityName={municipality.name}
                placeholder="Select barangay"
                required
                helperText="Specify the barangay where the operation will take place"
                colors={colors}
              />

              <FormInput
                label="Purok/Sitio (Optional)"
                value={operationData.exactLocation?.purok || ''}
                onChangeText={(text) => handleInputChange('exactLocation', { 
                  ...operationData.exactLocation, 
                  purok: text 
                })}
                placeholder="Enter purok or sitio name"
                helperText="Specify the purok or sitio within the barangay (optional)"
              />
            </View>
          </View>

          {/* Resources */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="cube-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Required Resources</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.resourceHeader}>
                <ThemedText style={[styles.label, { color: colors.text }]}>
                  Select Resources ({selectedResources.length} selected)
                </ThemedText>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowResourceModal(true)}
                >
                  <ThemedText style={styles.addButtonText}>
                    {selectedResources.length > 0 ? "Edit Resources" : "Select Resources"}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* Selected Resources Summary */}
              {selectedResources.length > 0 && (
                <View style={styles.selectedResourcesContainer}>
                  <ScrollView 
                    style={{ maxHeight: 200 }}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    {selectedResources.map((resource) => {
                      const fullResource = allAvailableResources.find(r => r.id === resource.resourceId);
                      return (
                        <View key={resource.resourceId} style={[styles.selectedResource, { backgroundColor: colors.background }]}>
                          <View style={styles.selectedResourceImage}>
                            {fullResource?.images && fullResource.images.length > 0 ? (
                              <WebOptimizedImage
                                source={{ uri: fullResource.images[0] }}
                                style={styles.selectedResourceImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={[styles.selectedResourceImage, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                                <Ionicons name="cube-outline" size={16} color={colors.text} />
                              </View>
                            )}
                          </View>
                          <View style={styles.selectedResourceInfo}>
                            <ThemedText style={[styles.selectedResourceName, { color: colors.text }]}>
                              {resource.resourceName}
                            </ThemedText>
                            <ThemedText style={[styles.selectedResourceCategory, { color: colors.text, opacity: 0.7 }]}>
                              {resource.category.charAt(0).toUpperCase() + resource.category.slice(1)}
                            </ThemedText>
                          </View>
                          <View style={styles.quantityContainer}>
                            <TouchableOpacity
                              style={[styles.quantityButton, { backgroundColor: colors.border }]}
                              onPress={() => handleResourceQuantityChange(resource.resourceId, resource.quantity - 1)}
                            >
                              <Ionicons name="remove" size={16} color={colors.text} />
                            </TouchableOpacity>
                            <ThemedText style={[styles.quantityText, { color: colors.text }]}>
                              {resource.quantity}
                            </ThemedText>
                            <TouchableOpacity
                              style={[styles.quantityButton, { backgroundColor: colors.border }]}
                              onPress={() => handleResourceQuantityChange(resource.resourceId, resource.quantity + 1)}
                            >
                              <Ionicons name="add" size={16} color={colors.text} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Assigned Personnel */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="people-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Assigned Personnel</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.resourceHeader}>
                <ThemedText style={[styles.label, { color: colors.text }]}>
                  Select Personnel ({selectedPersonnel.length} selected)
                </ThemedText>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowPersonnelModal(true)}
                >
                  <ThemedText style={styles.addButtonText}>
                    {selectedPersonnel.length > 0 ? "Edit Personnel" : "Select Personnel"}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* Selected Personnel Summary */}
              {selectedPersonnel.length > 0 && (
                <View style={styles.selectedResourcesContainer}>
                  <ScrollView 
                    style={{ maxHeight: 200 }}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    {selectedPersonnel.map((userId) => {
                      const person = personnelMap.get(userId);
                      const isTeamLeader = selectedTeamLeader === userId;
                      const isSupervisor = person?.userType === 'supervisor';
                      const getLastName = (fullName: string): string => {
                        const parts = fullName.trim().split(/\s+/);
                        return parts.length > 1 ? parts[parts.length - 1] : fullName;
                      };
                      const lastName = person ? getLastName(person.fullName) : '';
                      const firstName = person ? person.fullName.replace(lastName, '').trim() : '';
                      const displayName = person ? `${lastName}, ${firstName}` : 'Loading...';
                      
                      return (
                        <View key={userId} style={[styles.selectedResource, { backgroundColor: colors.background }]}>
                          <View style={[styles.selectedResourceImage, { backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="person" size={16} color={colors.primary} />
                          </View>
                          <View style={styles.selectedResourceInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                            <ThemedText style={[styles.selectedResourceName, { color: colors.text }]}>
                              {displayName}
                            </ThemedText>
                              {isTeamLeader && (
                                <View style={{
                                  backgroundColor: colors.primary,
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 4
                                }}>
                                  <ThemedText style={{
                                    fontSize: 10,
                                    fontWeight: '700',
                                    color: 'white',
                                    textTransform: 'uppercase'
                                  }}>
                                    Leader
                                  </ThemedText>
                                </View>
                              )}
                              {isSupervisor && (
                                <View style={{
                                  backgroundColor: '#FF6B35',
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 4
                                }}>
                                  <ThemedText style={{
                                    fontSize: 10,
                                    fontWeight: '700',
                                    color: 'white',
                                    textTransform: 'uppercase'
                                  }}>
                                    Supervisor
                                  </ThemedText>
                                </View>
                              )}
                            </View>
                            <ThemedText style={[styles.selectedResourceCategory, { color: colors.text, opacity: 0.7 }]}>
                              {person?.email || 'Loading...'}
                            </ThemedText>
                          </View>
                          <TouchableOpacity
                            style={[styles.quantityButton, { backgroundColor: colors.error || '#EF4444' }]}
                            onPress={() => handlePersonnelRemove(userId)}
                          >
                            <Ionicons name="close" size={16} color="white" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>

          {/* Additional Notes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="document-text-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Additional Notes</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <FormInput
                label="Notes"
                value={operationData.notes || ''}
                onChangeText={(text) => handleInputChange('notes', text)}
                placeholder="Any additional notes or special instructions..."
                multiline
                numberOfLines={3}
                helperText="Add any special instructions or additional information for this operation"
              />
            </View>
          </View>
        </ScrollView>
        </ThemedView>

        {/* Resource Selection Modal */}
        <ResourceSelectionModal
          visible={showResourceModal}
          onClose={() => setShowResourceModal(false)}
          onConfirm={handleResourceModalConfirm}
          availableResources={allAvailableResources}
          selectedResources={selectedResources}
          colors={colors}
        />

        {/* Personnel Selection Modal */}
        <PersonnelSelectionModal
          visible={showPersonnelModal}
          onClose={() => setShowPersonnelModal(false)}
          onConfirm={handlePersonnelModalConfirm}
          selectedPersonnel={selectedPersonnel}
          selectedTeamLeader={selectedTeamLeader}
          colors={colors}
        />
      </SafeAreaView>
    </Modal>
  );
}

