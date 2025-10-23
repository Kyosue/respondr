import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BarangayDropdown } from '@/components/ui/BarangayDropdown';
import { FormButton, FormDatePicker, FormInput } from '@/components/ui/FormComponents';
import { WebOptimizedImage } from '@/components/ui/WebOptimizedImage';
import { Colors } from '@/constants/Colors';
import { useResources } from '@/contexts/ResourceContext';
import { Municipality } from '@/data/davaoOrientalData';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';
import { ResourceCategory } from '@/types/Resource';
import { getModalConfig } from '@/utils/modalUtils';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  TouchableOpacity,
  View
} from 'react-native';
import { styles } from './OperationsModal.styles';
import { ResourceSelectionModal } from './ResourceSelectionModal';

interface OperationsModalProps {
  visible: boolean;
  municipality: Municipality | null;
  onClose: () => void;
  onSubmit: (operation: OperationData) => void;
}

interface OperationData {
  id: string;
  municipalityId: string;
  operationType: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  exactLocation: {
    barangay: string;
    purok: string;
    specificAddress?: string;
  };
  resources: OperationResource[];
  assignedPersonnel: string[];
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
  onSubmit
}: OperationsModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { state: resourceState, getFilteredResources } = useResources();

  // Hybrid RAMP hook
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose: rampHandleClose } = useHybridRamp({
    visible,
    onClose: () => {
      // Reset form data
      setOperationData({ ...initialOperationData, startDate: new Date() });
      setSelectedResources([]);
      setShowResourceModal(false);
      onClose();
    }
  });

  const initialOperationData: Partial<OperationData> = {
    operationType: '',
    title: '',
    description: '',
    priority: 'medium',
    status: 'planned',
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

  const [operationData, setOperationData] = useState<Partial<OperationData>>(initialOperationData);

  const [selectedResources, setSelectedResources] = useState<OperationResource[]>([]);
  const [showResourceModal, setShowResourceModal] = useState(false);

  // Get available resources from context
  const allAvailableResources = getFilteredResources().filter(resource => 
    resource.status === 'active' && resource.availableQuantity > 0
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#10B981'; // Green
      case 'medium': return '#F59E0B'; // Yellow/Orange
      case 'high': return '#EF4444'; // Red
      case 'critical': return '#7C2D12'; // Dark Red
      default: return colors.primary;
    }
  };

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
  };

  const handleClose = rampHandleClose;


  const handleSubmit = () => {
    if (!operationData.title || !operationData.operationType || !municipality) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!operationData.exactLocation?.barangay) {
      Alert.alert('Error', 'Please specify the barangay');
      return;
    }

    const newOperation: OperationData = {
      id: Date.now().toString(),
      municipalityId: municipality.id.toString(),
      operationType: operationData.operationType,
      title: operationData.title,
      description: operationData.description || '',
      priority: operationData.priority || 'medium',
      status: operationData.status || 'planned',
      startDate: operationData.startDate || new Date(),
      endDate: operationData.endDate,
      exactLocation: {
        barangay: operationData.exactLocation.barangay,
        purok: operationData.exactLocation.purok,
        specificAddress: operationData.exactLocation.specificAddress || ''
      },
      resources: selectedResources,
      assignedPersonnel: operationData.assignedPersonnel || [],
      notes: operationData.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onSubmit(newOperation);
    resetForm();
    onClose();
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
              <ThemedText type="subtitle" style={styles.title}>New Operation</ThemedText>
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

          {/* Priority and Timeline */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="flag-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Priority & Timeline</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Priority Level</ThemedText>
                <View style={styles.priorityContainer}>
                  {(['low', 'medium', 'high', 'critical'] as const).map((priority) => {
                    const priorityColor = getPriorityColor(priority);
                    const isSelected = operationData.priority === priority;
                    
                    return (
                      <TouchableOpacity
                        key={priority}
                        style={[
                          styles.priorityButton,
                          { 
                            borderColor: isSelected ? priorityColor : colors.border,
                            backgroundColor: isSelected ? priorityColor : colors.surface
                          }
                        ]}
                        onPress={() => handleInputChange('priority', priority)}
                      >
                        <ThemedText style={[
                          styles.priorityText,
                          { 
                            color: isSelected ? 'white' : priorityColor,
                            fontWeight: isSelected ? '700' : '600'
                          }
                        ]}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

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
      </Modal>
    );
  }

  // Original mobile implementation
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <ThemedView style={styles.mobileContainer}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: colors.surface }]}>
              <Ionicons name="close" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <ThemedText type="subtitle" style={styles.title}>New Operation</ThemedText>
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

          {/* Priority and Timeline */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="flag-outline" size={20} color="#007AFF" />
              </View>
              <ThemedText style={styles.sectionTitle}>Priority & Timeline</ThemedText>
            </View>
            
            <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.inputGroup}>
                <ThemedText style={styles.label}>Priority Level</ThemedText>
                <View style={styles.priorityContainer}>
                  {(['low', 'medium', 'high', 'critical'] as const).map((priority) => {
                    const priorityColor = getPriorityColor(priority);
                    const isSelected = operationData.priority === priority;
                    
                    return (
                      <TouchableOpacity
                        key={priority}
                        style={[
                          styles.priorityButton,
                          { 
                            borderColor: isSelected ? priorityColor : colors.border,
                            backgroundColor: isSelected ? priorityColor : colors.surface
                          }
                        ]}
                        onPress={() => handleInputChange('priority', priority)}
                      >
                        <ThemedText style={[
                          styles.priorityText,
                          { 
                            color: isSelected ? 'white' : priorityColor,
                            fontWeight: isSelected ? '700' : '600'
                          }
                        ]}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

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
    </Modal>
  );
}

