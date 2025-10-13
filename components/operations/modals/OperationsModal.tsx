import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FormButton, FormDatePicker, FormInput } from '@/components/ui/FormComponents';
import { WebOptimizedImage } from '@/components/ui/WebOptimizedImage';
import { Colors } from '@/constants/Colors';
import { useResources } from '@/contexts/ResourceContext';
import { Municipality } from '@/data/davaoOrientalData';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Resource, ResourceCategory } from '@/types/Resource';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    ScrollView,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { styles } from './OperationsModal.styles';

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
  const screenHeight = Dimensions.get('window').height;
  const { state: resourceState, getFilteredResources } = useResources();

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
  const [showResourceSelector, setShowResourceSelector] = useState(false);
  const [resourceSearchQuery, setResourceSearchQuery] = useState('');

  // Get available resources from context
  const allAvailableResources = getFilteredResources().filter(resource => 
    resource.status === 'active' && resource.availableQuantity > 0
  );

  // Filter resources based on search query
  const availableResources = allAvailableResources.filter(resource =>
    resource.name.toLowerCase().includes(resourceSearchQuery.toLowerCase()) ||
    resource.category.toLowerCase().includes(resourceSearchQuery.toLowerCase()) ||
    resource.tags.some(tag => tag.toLowerCase().includes(resourceSearchQuery.toLowerCase()))
  );

  const handleInputChange = (field: keyof OperationData, value: any) => {
    setOperationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResourceSelect = (resource: Resource) => {
    const existingResource = selectedResources.find(r => r.resourceId === resource.id);
    
    if (existingResource) {
      // If resource is already selected, remove it
      setSelectedResources(prev => prev.filter(r => r.resourceId !== resource.id));
    } else {
      // If resource is not selected, add it
      const newResource: OperationResource = {
        resourceId: resource.id,
        resourceName: resource.name,
        category: resource.category,
        quantity: 1,
        status: 'requested'
      };
      setSelectedResources(prev => [...prev, newResource]);
    }
  };

  const isResourceSelected = (resourceId: string) => {
    return selectedResources.some(r => r.resourceId === resourceId);
  };

  const clearAllSelectedResources = () => {
    setSelectedResources([]);
  };

  const resetForm = () => {
    setOperationData({ ...initialOperationData, startDate: new Date() });
    setSelectedResources([]);
    setShowResourceSelector(false);
    setResourceSearchQuery('');
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

  const handleSubmit = () => {
    if (!operationData.title || !operationData.operationType || !municipality) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!operationData.exactLocation?.barangay || !operationData.exactLocation?.purok) {
      Alert.alert('Error', 'Please specify the barangay and purok/sitio');
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surface }]}>
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
                disabled={!operationData.title || !operationData.operationType || !operationData.exactLocation?.barangay || !operationData.exactLocation?.purok}
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
                  {(['low', 'medium', 'high', 'critical'] as const).map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityButton,
                        { borderColor: colors.border },
                        operationData.priority === priority && { 
                          backgroundColor: colors.primary,
                          borderColor: colors.primary 
                        }
                      ]}
                      onPress={() => handleInputChange('priority', priority)}
                    >
                      <ThemedText style={[
                        styles.priorityText,
                        { 
                          color: operationData.priority === priority 
                            ? 'white' 
                            : colors.text 
                        }
                      ]}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
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
              <FormInput
                label="Barangay"
                value={operationData.exactLocation?.barangay || ''}
                onChangeText={(text) => handleInputChange('exactLocation', { 
                  ...operationData.exactLocation, 
                  barangay: text 
                })}
                placeholder="Enter barangay name"
                required
                helperText="Specify the barangay where the operation will take place"
              />

              <FormInput
                label="Purok/Sitio"
                value={operationData.exactLocation?.purok || ''}
                onChangeText={(text) => handleInputChange('exactLocation', { 
                  ...operationData.exactLocation, 
                  purok: text 
                })}
                placeholder="Enter purok or sitio name"
                required
                helperText="Specify the purok or sitio within the barangay"
              />

              <FormInput
                label="Specific Address (Optional)"
                value={operationData.exactLocation?.specificAddress || ''}
                onChangeText={(text) => handleInputChange('exactLocation', { 
                  ...operationData.exactLocation, 
                  specificAddress: text 
                })}
                placeholder="e.g., Near the barangay hall, beside the school"
                helperText="Provide additional location details if needed"
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
                  onPress={() => setShowResourceSelector(!showResourceSelector)}
                >
                  <ThemedText style={styles.addButtonText}>
                    {showResourceSelector ? "Hide Resources" : "Show Resources"}
                  </ThemedText>
                </TouchableOpacity>
              </View>

              {/* Resource Selector */}
              {showResourceSelector && (
                <View style={[styles.resourceSelector, { backgroundColor: colors.background }]}>
                  <View style={styles.resourceSelectorHeader}>
                    <ThemedText style={styles.resourceSelectorTitle}>
                      Available Resources
                    </ThemedText>
                    <View style={styles.resourceCount}>
                      <ThemedText style={[styles.resourceCount, { color: colors.text }]}>
                        {availableResources.length} items
                      </ThemedText>
                    </View>
                  </View>
                  
                  {/* Search Input */}
                  <View style={styles.resourceSearchContainer}>
                    <TextInput
                      style={[styles.resourceSearchInput, { 
                        color: colors.text, 
                        borderColor: colors.border 
                      }]}
                      placeholder="Search resources by name, category, or tags..."
                      placeholderTextColor={colors.text + '60'}
                      value={resourceSearchQuery}
                      onChangeText={setResourceSearchQuery}
                    />
                  </View>

                  {/* Resources Grid with ScrollView */}
                  <ScrollView 
                    style={styles.resourceScrollView}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    <View style={styles.resourceGrid}>
                      {availableResources.map((resource) => (
                        <TouchableOpacity
                          key={resource.id}
                          style={[
                            styles.resourceItem,
                            isResourceSelected(resource.id) && styles.resourceItemSelected
                          ]}
                          onPress={() => handleResourceSelect(resource)}
                        >
                        {isResourceSelected(resource.id) && (
                          <View style={styles.resourceSelectionIndicator}>
                            <Ionicons name="checkmark" size={12} color="white" />
                          </View>
                        )}
                          <View style={styles.resourceImageContainer}>
                            {resource.images && resource.images.length > 0 ? (
                              <WebOptimizedImage
                                source={{ uri: resource.images[0] }}
                                style={styles.resourceImage}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={[styles.resourceImagePlaceholder, { backgroundColor: colors.border }]}>
                                <Ionicons name="cube-outline" size={18} color={colors.text} />
                              </View>
                            )}
                          </View>
                          <View style={styles.resourceInfo}>
                            <ThemedText style={[styles.resourceName, { color: colors.text }]}>
                              {resource.name}
                            </ThemedText>
                            <ThemedText style={[styles.resourceCategory, { color: colors.text, opacity: 0.7 }]}>
                              {resource.category.charAt(0).toUpperCase() + resource.category.slice(1)}
                            </ThemedText>
                            <ThemedText style={[styles.resourceAvailable, { color: colors.primary }]}>
                              {resource.availableQuantity}/{resource.totalQuantity}
                            </ThemedText>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Selected Resources */}
              {selectedResources.length > 0 && (
                <View style={styles.selectedResourcesContainer}>
                  <View style={styles.selectedResourcesHeader}>
                    <ThemedText style={[styles.selectedResourcesTitle, { color: colors.text }]}>
                      Selected Resources ({selectedResources.length})
                    </ThemedText>
                    <TouchableOpacity
                      style={styles.clearAllButton}
                      onPress={clearAllSelectedResources}
                    >
                      <ThemedText style={styles.clearAllButtonText}>Clear All</ThemedText>
                    </TouchableOpacity>
                  </View>
                  
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
    </Modal>
  );
}

