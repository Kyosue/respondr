import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Tag } from '@/components/base/tags/tags';
import { WebOptimizedImage } from '@/components/ui/WebOptimizedImage';
import { Colors } from '@/constants/Colors';
import { getMunicipalities } from '@/data/davaoOrientalData';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';
import { getModalConfig } from '@/utils/modalUtils';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface OperationPreviewModalProps {
  visible: boolean;
  operation: {
    id: string;
    title: string;
    description: string;
    operationType: string;
    status?: 'active' | 'concluded';
    startDate: string | Date | number;
    endDate?: string | Date | number;
    exactLocation?: {
      barangay: string;
      purok: string;
      specificAddress?: string;
    };
    resources: Array<{
      resourceId: string;
      resourceName: string;
      quantity: number;
      category: string;
      status: string;
    }>;
    assignedPersonnel?: string[];
    teamLeader?: string;
    municipalityId?: string;
    notes?: string;
    createdAt: string | Date | number;
    updatedAt: string | Date | number;
    createdBy?: string;
    updatedBy?: string;
  };
  onClose: () => void;
}

export function OperationPreviewModal({
  visible,
  operation,
  onClose
}: OperationPreviewModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [personnelMap, setPersonnelMap] = useState<Map<string, { fullName: string; email?: string; userType?: string }>>(new Map());
  const [teamLeaderName, setTeamLeaderName] = useState<string | null>(null);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [updaterName, setUpdaterName] = useState<string | null>(null);
  const [resourceImageMap, setResourceImageMap] = useState<Map<string, string>>(new Map());
  const municipalities = getMunicipalities();

  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose: rampHandleClose } = useHybridRamp({
    visible,
    onClose
  });

  const getMunicipalityName = (id?: string): string => {
    if (!id) return 'Unknown';
    const municipality = municipalities.find(m => m.id.toString() === id);
    return municipality?.name || 'Unknown';
  };

  // Fetch creator and updater names
  useEffect(() => {
    let isMounted = true;
    const fetchCreator = async () => {
      try {
        if (!operation.createdBy) {
          setCreatorName(null);
          return;
        }
        const { db } = await import('@/firebase/config');
        const { doc, getDoc } = await import('firebase/firestore');
        const userRef = doc(db, 'users', operation.createdBy);
        const snap = await getDoc(userRef);
        if (!isMounted) return;
        if (snap.exists()) {
          const data = snap.data() as { fullName?: string; displayName?: string };
          setCreatorName(data.displayName || data.fullName || null);
        } else {
          setCreatorName(null);
        }
      } catch (e) {
        console.error('Error fetching creator:', e);
        setCreatorName(null);
      }
    };
    fetchCreator();
    return () => { isMounted = false; };
  }, [operation.createdBy]);

  useEffect(() => {
    let isMounted = true;
    const fetchUpdater = async () => {
      try {
        if (!operation.updatedBy) {
          setUpdaterName(null);
          return;
        }
        const { db } = await import('@/firebase/config');
        const { doc, getDoc } = await import('firebase/firestore');
        const userRef = doc(db, 'users', operation.updatedBy);
        const snap = await getDoc(userRef);
        if (!isMounted) return;
        if (snap.exists()) {
          const data = snap.data() as { fullName?: string; displayName?: string };
          setUpdaterName(data.displayName || data.fullName || null);
        } else {
          setUpdaterName(null);
        }
      } catch (e) {
        console.error('Error fetching updater:', e);
        setUpdaterName(null);
      }
    };
    fetchUpdater();
    return () => { isMounted = false; };
  }, [operation.updatedBy]);

  // Fetch personnel data
  useEffect(() => {
    let isMounted = true;
    const fetchPersonnel = async () => {
      try {
        if (!operation.assignedPersonnel || operation.assignedPersonnel.length === 0) {
          setPersonnelMap(new Map());
          setTeamLeaderName(null);
          return;
        }
        const { db } = await import('@/firebase/config');
        const { doc, getDoc } = await import('firebase/firestore');
        const map = new Map<string, { fullName: string; email?: string; userType?: string }>();
        
        // Fetch all personnel in parallel
        const promises = operation.assignedPersonnel.map(async (userId) => {
          try {
            const userRef = doc(db, 'users', userId);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              const data = snap.data() as { fullName?: string; email?: string; userType?: string };
              if (data.fullName) {
                map.set(userId, { fullName: data.fullName, email: data.email, userType: data.userType });
              }
            }
          } catch (e) {
            console.error(`Error fetching user ${userId}:`, e);
          }
        });
        
        await Promise.all(promises);
        if (!isMounted) return;
        setPersonnelMap(map);

        // Fetch team leader name if exists
        if (operation.teamLeader) {
          try {
            const teamLeaderRef = doc(db, 'users', operation.teamLeader);
            const teamLeaderSnap = await getDoc(teamLeaderRef);
            if (teamLeaderSnap.exists() && isMounted) {
              const data = teamLeaderSnap.data() as { fullName?: string; displayName?: string };
              setTeamLeaderName(data.displayName || data.fullName || null);
            }
          } catch (e) {
            console.error('Error fetching team leader:', e);
          }
        }
      } catch (e) {
        console.error('Error fetching personnel:', e);
        setPersonnelMap(new Map());
      }
    };
    
    if (visible) {
      fetchPersonnel();
    }
    
    return () => { isMounted = false; };
  }, [operation.assignedPersonnel, operation.teamLeader, visible]);

  // Fetch resource images for preview chips
  useEffect(() => {
    let isMounted = true;
    const fetchResourceImages = async () => {
      try {
        if (!operation.resources || operation.resources.length === 0) {
          setResourceImageMap(new Map());
          return;
        }

        const { db } = await import('@/firebase/config');
        const { doc, getDoc } = await import('firebase/firestore');
        const imageMap = new Map<string, string>();

        await Promise.all(
          operation.resources.map(async (resource) => {
            try {
              const resourceRef = doc(db, 'resources', resource.resourceId);
              const snap = await getDoc(resourceRef);
              if (!snap.exists()) return;
              const data = snap.data() as { images?: string[] };
              const imageUri = data.images?.[0];
              if (imageUri) imageMap.set(resource.resourceId, imageUri);
            } catch (e) {
              console.error(`Error fetching resource image for ${resource.resourceId}:`, e);
            }
          })
        );

        if (isMounted) setResourceImageMap(imageMap);
      } catch (e) {
        console.error('Error fetching resource images:', e);
      }
    };

    if (visible) fetchResourceImages();
    return () => {
      isMounted = false;
    };
  }, [operation.resources, visible]);

  const formatDate = (value: string | Date | number) => {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getLastName = (fullName: string): string => {
    const parts = fullName.trim().split(/\s+/);
    return parts.length > 1 ? parts[parts.length - 1] : fullName;
  };

  const formatPersonnelName = (fullName: string): string => {
    const lastName = getLastName(fullName);
    const firstName = fullName.replace(lastName, '').trim();
    return `${lastName}, ${firstName}`;
  };

  const getCategoryColor = (category: string) => {
    switch ((category || '').toLowerCase()) {
      case 'tools':
        return '#3B82F6';
      case 'equipment':
        return '#8B5CF6';
      case 'vehicles':
        return '#F59E0B';
      case 'medical':
        return '#EF4444';
      case 'communication':
        return '#0EA5E9';
      case 'supplies':
        return '#10B981';
      case 'personnel':
        return '#EC4899';
      case 'other':
      default:
        return '#6B7280';
    }
  };

  const getStatusColor = () => (operation.status === 'active' ? '#10B981' : '#6B7280');

  const handleClose = rampHandleClose;

  // Platform-specific modal rendering
  if (isWeb) {
    return (
      <Modal
        visible={visible}
        {...getModalConfig()}
        onRequestClose={handleClose}
        transparent={true}
        animationType="fade"
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <Animated.View style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [
                { translateX: slideAnim }
              ]
            }
          ]}>
            <ThemedView style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={styles.headerContent}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name="document-text" size={24} color={colors.primary} />
                  </View>
                  <View style={styles.headerText}>
                    <ThemedText style={[styles.title, { color: colors.text }]}>
                      Operation Details
                    </ThemedText>
                    <ThemedText style={[styles.subtitle, { color: colors.text + '80' }]}>
                      View complete operation information
                    </ThemedText>
                  </View>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Hero Section - Title, Status, Type */}
                <View style={styles.heroSection}>
                  <ThemedText style={[styles.heroTitle, { color: colors.text }]}>
                    {operation.title}
                  </ThemedText>
                  <View style={styles.heroBadges}>
                    <Tag dot size="sm" dotColor={getStatusColor()}>
                      {operation.status === 'active' ? 'ACTIVE' : 'CONCLUDED'}
                    </Tag>
                    <Tag dot size="sm" dotColor={colors.primary}>
                      {operation.operationType.toUpperCase()}
                    </Tag>
                  </View>
                </View>

                {/* Description */}
                {operation.description && (
                  <>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.infoRow}>
                      <View style={styles.infoLabel}>
                        <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                        <ThemedText style={[styles.labelText, { color: colors.text + 'CC' }]}>
                          Description
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.valueText, { color: colors.text }]}>
                        {operation.description}
                      </ThemedText>
                    </View>
                  </>
                )}

                {/* Location Information */}
                {(operation.municipalityId || operation.exactLocation) && (
                  <>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.infoRow}>
                      <View style={styles.infoLabel}>
                        <Ionicons name="location-outline" size={18} color={colors.primary} />
                        <ThemedText style={[styles.labelText, { color: colors.text + 'CC' }]}>
                          Location
                        </ThemedText>
                      </View>
                      <View style={styles.locationDetails}>
                        {operation.municipalityId && (
                          <ThemedText style={[styles.valueText, { color: colors.text }]}>
                            {getMunicipalityName(operation.municipalityId)}
                          </ThemedText>
                        )}
                        {operation.exactLocation && (
                          <ThemedText style={[styles.locationSubtext, { color: colors.text + 'AA' }]}>
                            {operation.exactLocation.barangay}
                            {operation.exactLocation.purok && `, Purok ${operation.exactLocation.purok}`}
                            {operation.exactLocation.specificAddress && ` • ${operation.exactLocation.specificAddress}`}
                          </ThemedText>
                        )}
                      </View>
                    </View>
                  </>
                )}

                {/* Dates */}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.datesRow}>
                  <View style={[styles.dateItem, { borderColor: colors.border, backgroundColor: colors.background }]}>
                    <View style={styles.dateIconContainer}>
                      <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                    </View>
                    <View style={styles.dateInfo}>
                      <ThemedText style={[styles.dateLabel, { color: colors.text + 'AA' }]}>
                        Start Date
                      </ThemedText>
                      <ThemedText style={[styles.dateValue, { color: colors.text }]}>
                        {formatDate(operation.startDate)}
                      </ThemedText>
                    </View>
                  </View>
                  {operation.endDate && (
                    <View style={[styles.dateItem, { borderColor: colors.border, backgroundColor: colors.background }]}>
                      <View style={styles.dateIconContainer}>
                        <Ionicons name="calendar" size={16} color={colors.primary} />
                      </View>
                      <View style={styles.dateInfo}>
                        <ThemedText style={[styles.dateLabel, { color: colors.text + 'AA' }]}>
                          End Date
                        </ThemedText>
                        <ThemedText style={[styles.dateValue, { color: colors.text }]}>
                          {formatDate(operation.endDate)}
                        </ThemedText>
                      </View>
                    </View>
                  )}
                </View>

                {/* Resources */}
                {operation.resources.length > 0 && (
                  <>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.sectionHeader}>
                      <Ionicons name="cube-outline" size={20} color={colors.primary} />
                      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                        Resources ({operation.resources.length})
                      </ThemedText>
                    </View>
                    <View style={styles.resourcesGrid}>
                      {operation.resources.map((resource, index) => (
                        <View key={index} style={[styles.resourceChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.resourceImageWrap}>
                      {resourceImageMap.get(resource.resourceId) ? (
                        <WebOptimizedImage
                          source={{ uri: resourceImageMap.get(resource.resourceId)! }}
                          style={styles.resourceImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[styles.resourceImageFallback, { backgroundColor: colors.primary + '12' }]}>
                          <Ionicons name="cube-outline" size={14} color={colors.primary} />
                        </View>
                      )}
                    </View>
                          <ThemedText style={[styles.resourceName, { color: colors.text }]}>
                            {resource.resourceName}
                          </ThemedText>
                          <View style={styles.resourceTagRow}>
                            <Tag size="sm">{resource.quantity}x</Tag>
                            <Tag dot size="sm" dotColor={getCategoryColor(resource.category)}>
                              {String(resource.category).toUpperCase()}
                            </Tag>
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* Personnel */}
                {operation.assignedPersonnel && operation.assignedPersonnel.length > 0 && (
                  <>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.sectionHeader}>
                      <Ionicons name="people-outline" size={20} color={colors.primary} />
                      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                        Assigned Personnel ({operation.assignedPersonnel.length})
                      </ThemedText>
                    </View>
                    {teamLeaderName && (
                      <View style={[styles.teamLeaderHighlight, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '40' }]}>
                        <Ionicons name="star" size={18} color={colors.primary} />
                        <ThemedText style={[styles.teamLeaderName, { color: colors.primary }]}>
                          {teamLeaderName}
                        </ThemedText>
                        <ThemedText style={[styles.teamLeaderRole, { color: colors.text + 'AA' }]}>
                          Team Leader
                        </ThemedText>
                      </View>
                    )}
                    <View style={styles.personnelGrid}>
                      {operation.assignedPersonnel.map((userId) => {
                        const person = personnelMap.get(userId);
                        if (!person) return null;
                        const isTeamLeader = operation.teamLeader === userId;
                        const isSupervisor = person.userType === 'supervisor';
                        
                        return (
                          <View key={userId} style={[styles.personnelCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                            <View style={styles.personnelAvatar}>
                              <Ionicons name="person" size={20} color={colors.primary} />
                            </View>
                            <View style={styles.personnelDetails}>
                              <ThemedText style={[styles.personnelName, { color: colors.text }]} numberOfLines={1}>
                                {formatPersonnelName(person.fullName)}
                              </ThemedText>
                              {person.email && (
                                <ThemedText style={[styles.personnelEmail, { color: colors.text + 'AA' }]} numberOfLines={1}>
                                  {person.email}
                                </ThemedText>
                              )}
                            </View>
                            <View style={[
                              styles.roleTag,
                              { backgroundColor: isSupervisor ? '#FF6B35' : '#4A90E2' }
                            ]}>
                              <ThemedText style={styles.roleTagText}>
                                {isSupervisor ? 'Supervisor' : 'Operator'}
                              </ThemedText>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </>
                )}

                {/* Notes */}
                {operation.notes && (
                  <>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.infoRow}>
                      <View style={styles.infoLabel}>
                        <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                        <ThemedText style={[styles.labelText, { color: colors.text + 'CC' }]}>
                          Notes
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.valueText, { color: colors.text }]}>
                        {operation.notes}
                      </ThemedText>
                    </View>
                  </>
                )}

                {/* Metadata Footer */}
                <View style={[styles.metadataFooter, { borderTopColor: colors.border }]}>
                  <ThemedText style={[styles.metadataLabel, { color: colors.text + '80' }]}>
                    Operation ID: {operation.id}
                  </ThemedText>
                  {operation.createdBy && (
                    <ThemedText style={[styles.metadataLabel, { color: colors.text + '80' }]}>
                      Created by {creatorName || 'Unknown'} • {formatDate(operation.createdAt)}
                    </ThemedText>
                  )}
                  {operation.updatedBy && (
                    <ThemedText style={[styles.metadataLabel, { color: colors.text + '80' }]}>
                      Last updated by {updaterName || 'Unknown'} • {formatDate(operation.updatedAt)}
                    </ThemedText>
                  )}
                </View>
              </ScrollView>
            </ThemedView>
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
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.mobileContainer, { backgroundColor: colors.surface }]} edges={['top']}>
        {/* Header */}
        <View style={[styles.mobileHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.mobileHeaderContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="document-text" size={24} color={colors.primary} />
            </View>
            <View style={styles.headerText}>
              <ThemedText style={[styles.title, { color: colors.text }]}>
                Operation Details
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section - Title, Status, Type */}
          <View style={styles.heroSection}>
            <ThemedText style={[styles.heroTitle, { color: colors.text }]}>
              {operation.title}
            </ThemedText>
            <View style={styles.heroBadges}>
              <Tag dot size="sm" dotColor={getStatusColor()}>
                {operation.status === 'active' ? 'ACTIVE' : 'CONCLUDED'}
              </Tag>
              <Tag dot size="sm" dotColor={colors.primary}>
                {operation.operationType.toUpperCase()}
              </Tag>
            </View>
          </View>

          {/* Description */}
          {operation.description && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                  <ThemedText style={[styles.labelText, { color: colors.text + 'CC' }]}>
                    Description
                  </ThemedText>
                </View>
                <ThemedText style={[styles.valueText, { color: colors.text }]}>
                  {operation.description}
                </ThemedText>
              </View>
            </>
          )}

          {/* Location Information */}
          {(operation.municipalityId || operation.exactLocation) && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Ionicons name="location-outline" size={18} color={colors.primary} />
                  <ThemedText style={[styles.labelText, { color: colors.text + 'CC' }]}>
                    Location
                  </ThemedText>
                </View>
                <View style={styles.locationDetails}>
                  {operation.municipalityId && (
                    <ThemedText style={[styles.valueText, { color: colors.text }]}>
                      {getMunicipalityName(operation.municipalityId)}
                    </ThemedText>
                  )}
                  {operation.exactLocation && (
                    <ThemedText style={[styles.locationSubtext, { color: colors.text + 'AA' }]}>
                      {operation.exactLocation.barangay}
                      {operation.exactLocation.purok && `, Purok ${operation.exactLocation.purok}`}
                      {operation.exactLocation.specificAddress && ` • ${operation.exactLocation.specificAddress}`}
                    </ThemedText>
                  )}
                </View>
              </View>
            </>
          )}

          {/* Dates */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.datesRow}>
            <View style={[styles.dateItem, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <View style={styles.dateIconContainer}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              </View>
              <View style={styles.dateInfo}>
                <ThemedText style={[styles.dateLabel, { color: colors.text + 'AA' }]}>
                  Start Date
                </ThemedText>
                <ThemedText style={[styles.dateValue, { color: colors.text }]}>
                  {formatDate(operation.startDate)}
                </ThemedText>
              </View>
            </View>
            {operation.endDate && (
              <View style={[styles.dateItem, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <View style={styles.dateIconContainer}>
                  <Ionicons name="calendar" size={16} color={colors.primary} />
                </View>
                <View style={styles.dateInfo}>
                  <ThemedText style={[styles.dateLabel, { color: colors.text + 'AA' }]}>
                    End Date
                  </ThemedText>
                  <ThemedText style={[styles.dateValue, { color: colors.text }]}>
                    {formatDate(operation.endDate)}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>

          {/* Resources */}
          {operation.resources.length > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.sectionHeader}>
                <Ionicons name="cube-outline" size={20} color={colors.primary} />
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  Resources ({operation.resources.length})
                </ThemedText>
              </View>
              <View style={styles.resourcesGrid}>
                {operation.resources.map((resource, index) => (
                  <View key={index} style={[styles.resourceChip, styles.resourceChipMobile, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.resourceBodyRow}>
                      <View style={[styles.resourceImageWrap, styles.resourceImageWrapMobile]}>
                        {resourceImageMap.get(resource.resourceId) ? (
                          <WebOptimizedImage
                            source={{ uri: resourceImageMap.get(resource.resourceId)! }}
                            style={styles.resourceImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[styles.resourceImageFallback, { backgroundColor: colors.primary + '12' }]}>
                            <Ionicons name="cube-outline" size={18} color={colors.primary} />
                          </View>
                        )}
                      </View>
                      <View style={styles.resourceMainContent}>
                        <View style={styles.resourceTopRow}>
                          <Tag size="sm">{resource.quantity}x</Tag>
                          <Tag dot size="sm" dotColor={getCategoryColor(resource.category)}>
                            {String(resource.category).toUpperCase()}
                          </Tag>
                        </View>
                        <ThemedText style={[styles.resourceName, styles.resourceNameMobile, { color: colors.text }]} numberOfLines={2}>
                          {resource.resourceName}
                        </ThemedText>
                        <ThemedText style={[styles.resourceMetaText, { color: colors.text + '99' }]}>
                          Requested quantity
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Personnel */}
          {operation.assignedPersonnel && operation.assignedPersonnel.length > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.sectionHeader}>
                <Ionicons name="people-outline" size={20} color={colors.primary} />
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  Assigned Personnel ({operation.assignedPersonnel.length})
                </ThemedText>
              </View>
              {teamLeaderName && (
                <View style={[styles.teamLeaderHighlight, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '40' }]}>
                  <Ionicons name="star" size={18} color={colors.primary} />
                  <ThemedText style={[styles.teamLeaderName, { color: colors.primary }]}>
                    {teamLeaderName}
                  </ThemedText>
                  <ThemedText style={[styles.teamLeaderRole, { color: colors.text + 'AA' }]}>
                    Team Leader
                  </ThemedText>
                </View>
              )}
              <View style={styles.personnelGrid}>
                {operation.assignedPersonnel.map((userId) => {
                  const person = personnelMap.get(userId);
                  if (!person) return null;
                  const isTeamLeader = operation.teamLeader === userId;
                  const isSupervisor = person.userType === 'supervisor';
                  
                  return (
                    <View key={userId} style={[styles.personnelCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <View style={styles.personnelAvatar}>
                        <Ionicons name="person" size={20} color={colors.primary} />
                      </View>
                      <View style={styles.personnelDetails}>
                        <ThemedText style={[styles.personnelName, { color: colors.text }]} numberOfLines={1}>
                          {formatPersonnelName(person.fullName)}
                        </ThemedText>
                        {person.email && (
                          <ThemedText style={[styles.personnelEmail, { color: colors.text + 'AA' }]} numberOfLines={1}>
                            {person.email}
                          </ThemedText>
                        )}
                      </View>
                      <View style={[
                        styles.roleTag,
                        { backgroundColor: isSupervisor ? '#FF6B35' : '#4A90E2' }
                      ]}>
                        <ThemedText style={styles.roleTagText}>
                          {isSupervisor ? 'Supervisor' : 'Operator'}
                        </ThemedText>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Notes */}
          {operation.notes && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                  <ThemedText style={[styles.labelText, { color: colors.text + 'CC' }]}>
                    Notes
                  </ThemedText>
                </View>
                <ThemedText style={[styles.valueText, { color: colors.text }]}>
                  {operation.notes}
                </ThemedText>
              </View>
            </>
          )}

          {/* Metadata Footer */}
          <View style={[styles.metadataFooter, { borderTopColor: colors.border }]}>
            <ThemedText style={[styles.metadataLabel, { color: colors.text + '80' }]}>
              Operation ID: {operation.id}
            </ThemedText>
            {operation.createdBy && (
              <ThemedText style={[styles.metadataLabel, { color: colors.text + '80' }]}>
                Created by {creatorName || 'Unknown'} • {formatDate(operation.createdAt)}
              </ThemedText>
            )}
            {operation.updatedBy && (
              <ThemedText style={[styles.metadataLabel, { color: colors.text + '80' }]}>
                Last updated by {updaterName || 'Unknown'} • {formatDate(operation.updatedAt)}
              </ThemedText>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 16,
    paddingBottom: 16,
  },
  overlayCloseButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  container: {
    width: '100%',
    maxWidth: 560,
    height: '92%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'absolute',
    right: 648,
    top: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
      },
    }),
    zIndex: 2,
  },
  modalContent: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 1,
  },
  subtitle: {
    fontSize: 12,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 28,
  },
  // Hero Section
  heroSection: {
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Divider
  divider: {
    height: 1,
    marginVertical: 16,
    opacity: 0.35,
  },
  // Info Rows
  infoRow: {
    marginBottom: 4,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  valueText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  locationDetails: {
    gap: 4,
  },
  locationSubtext: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  // Dates
  datesRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 200,
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dateIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInfo: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  // Resources
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  resourceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    minWidth: 140,
  },
  resourceImageWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    overflow: 'hidden',
  },
  resourceImage: {
    width: '100%',
    height: '100%',
  },
  resourceImageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceChipMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 0,
  },
  resourceBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  resourceMainContent: {
    flex: 1,
    minWidth: 0,
  },
  resourceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    flexWrap: 'wrap',
  },
  resourceQuantityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  resourceQuantity: {
    fontSize: 14,
    fontWeight: '700',
  },
  resourceName: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  resourceTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resourceNameMobile: {
    flex: 0,
    fontSize: 14,
    lineHeight: 19,
  },
  resourceCategoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resourceCategoryTagMobile: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  resourceCategoryText: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  resourceMetaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  resourceImageWrapMobile: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  // Personnel
  teamLeaderHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  teamLeaderName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  teamLeaderRole: {
    fontSize: 12,
    fontWeight: '500',
  },
  personnelGrid: {
    gap: 10,
  },
  personnelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  personnelAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personnelDetails: {
    flex: 1,
    gap: 4,
  },
  personnelName: {
    fontSize: 14,
    fontWeight: '600',
  },
  personnelEmail: {
    fontSize: 12,
  },
  roleTag: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  roleTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  // Metadata Footer
  metadataFooter: {
    marginTop: 16,
    paddingTop: 14,
    gap: 4,
    borderTopWidth: 1,
  },
  metadataLabel: {
    fontSize: 11,
    lineHeight: 16,
  },
  // Footer
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  closeFooterButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeFooterButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Mobile
  mobileContainer: {
    flex: 1,
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  mobileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
});

