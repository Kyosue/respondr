import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
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
                {/* Title */}
                <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="document" size={18} color={colors.primary} />
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                      Title
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.sectionValue, { color: colors.text }]}>
                    {operation.title}
                  </ThemedText>
                </View>

                {/* Description */}
                {operation.description && (
                  <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="text" size={18} color={colors.primary} />
                      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                        Description
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.sectionValue, { color: colors.text }]}>
                      {operation.description}
                    </ThemedText>
                  </View>
                )}

                {/* Operation Type */}
                <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="construct" size={18} color={colors.primary} />
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                      Operation Type
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.sectionValue, { color: colors.text }]}>
                    {operation.operationType}
                  </ThemedText>
                </View>

                {/* Status */}
                <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="flag" size={18} color={colors.primary} />
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                      Status
                    </ThemedText>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: operation.status === 'active' ? colors.success : colors.tabIconDefault }
                  ]}>
                    <ThemedText style={styles.statusText}>
                      {operation.status === 'active' ? 'Active' : 'Concluded'}
                    </ThemedText>
                  </View>
                </View>

                {/* Location */}
                {operation.municipalityId && (
                  <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="location" size={18} color={colors.primary} />
                      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                        Municipality
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.sectionValue, { color: colors.text }]}>
                      {getMunicipalityName(operation.municipalityId)}
                    </ThemedText>
                  </View>
                )}

                {/* Exact Location */}
                {operation.exactLocation && (
                  <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="map" size={18} color={colors.primary} />
                      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                        Exact Location
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.sectionValue, { color: colors.text }]}>
                      Barangay: {operation.exactLocation.barangay}
                      {operation.exactLocation.purok && `, Purok: ${operation.exactLocation.purok}`}
                      {operation.exactLocation.specificAddress && `\n${operation.exactLocation.specificAddress}`}
                    </ThemedText>
                  </View>
                )}

                {/* Dates */}
                <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="calendar" size={18} color={colors.primary} />
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                      Dates
                    </ThemedText>
                  </View>
                  <View style={styles.dateContainer}>
                    <View style={styles.dateRow}>
                      <ThemedText style={[styles.dateLabel, { color: colors.text + '80' }]}>
                        Start Date:
                      </ThemedText>
                      <ThemedText style={[styles.dateValue, { color: colors.text }]}>
                        {formatDate(operation.startDate)}
                      </ThemedText>
                    </View>
                    {operation.endDate && (
                      <View style={styles.dateRow}>
                        <ThemedText style={[styles.dateLabel, { color: colors.text + '80' }]}>
                          End Date:
                        </ThemedText>
                        <ThemedText style={[styles.dateValue, { color: colors.text }]}>
                          {formatDate(operation.endDate)}
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>

                {/* Resources */}
                {operation.resources.length > 0 && (
                  <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="cube" size={18} color={colors.primary} />
                      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                        Resources ({operation.resources.length})
                      </ThemedText>
                    </View>
                    <View style={styles.resourcesList}>
                      {operation.resources.map((resource, index) => (
                        <View key={index} style={[styles.resourceItem, { borderColor: colors.border }]}>
                          <ThemedText style={[styles.resourceText, { color: colors.text }]}>
                            {resource.quantity}x {resource.resourceName}
                          </ThemedText>
                          <View style={[styles.resourceBadge, { backgroundColor: colors.primary + '20' }]}>
                            <ThemedText style={[styles.resourceBadgeText, { color: colors.primary }]}>
                              {resource.category}
                            </ThemedText>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Personnel */}
                {operation.assignedPersonnel && operation.assignedPersonnel.length > 0 && (
                  <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="people" size={18} color={colors.primary} />
                      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                        Assigned Personnel ({operation.assignedPersonnel.length})
                      </ThemedText>
                    </View>
                    {teamLeaderName && (
                      <View style={[styles.teamLeaderBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                        <Ionicons name="star" size={16} color={colors.primary} />
                        <ThemedText style={[styles.teamLeaderText, { color: colors.primary }]}>
                          Team Leader: {teamLeaderName}
                        </ThemedText>
                      </View>
                    )}
                    <View style={styles.personnelList}>
                      {operation.assignedPersonnel.map((userId) => {
                        const person = personnelMap.get(userId);
                        if (!person) return null;
                        const isTeamLeader = operation.teamLeader === userId;
                        const isSupervisor = person.userType === 'supervisor';
                        
                        return (
                          <View key={userId} style={[styles.personnelItem, { borderColor: colors.border }]}>
                            <View style={styles.personnelInfo}>
                              <ThemedText style={[styles.personnelName, { color: colors.text }]}>
                                {formatPersonnelName(person.fullName)}
                                {isTeamLeader && (
                                  <ThemedText style={[styles.teamLeaderLabel, { color: colors.primary }]}>
                                    {' '}(Team Leader)
                                  </ThemedText>
                                )}
                              </ThemedText>
                              {person.email && (
                                <ThemedText style={[styles.personnelEmail, { color: colors.text + '80' }]}>
                                  {person.email}
                                </ThemedText>
                              )}
                            </View>
                            {isSupervisor && (
                              <View style={[styles.roleBadge, { backgroundColor: '#FF6B35' }]}>
                                <ThemedText style={styles.roleBadgeText}>
                                  Supervisor
                                </ThemedText>
                              </View>
                            )}
                            {!isSupervisor && (
                              <View style={[styles.roleBadge, { backgroundColor: '#4A90E2' }]}>
                                <ThemedText style={styles.roleBadgeText}>
                                  Operator
                                </ThemedText>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Notes */}
                {operation.notes && (
                  <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="document-text" size={18} color={colors.primary} />
                      <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                        Notes
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.sectionValue, { color: colors.text }]}>
                      {operation.notes}
                    </ThemedText>
                  </View>
                )}

                {/* Metadata */}
                <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="information-circle" size={18} color={colors.primary} />
                    <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                      Metadata
                    </ThemedText>
                  </View>
                  <View style={styles.metadataContainer}>
                    <ThemedText style={[styles.metadataText, { color: colors.text + '80' }]}>
                      Operation ID: {operation.id}
                    </ThemedText>
                    {operation.createdBy && (
                      <ThemedText style={[styles.metadataText, { color: colors.text + '80' }]}>
                        Created by: {creatorName || 'Loading...'}
                      </ThemedText>
                    )}
                    {operation.updatedBy && (
                      <ThemedText style={[styles.metadataText, { color: colors.text + '80' }]}>
                        Updated by: {updaterName || 'Loading...'}
                      </ThemedText>
                    )}
                    <ThemedText style={[styles.metadataText, { color: colors.text + '80' }]}>
                      Last Updated: {formatDate(operation.updatedAt)}
                    </ThemedText>
                  </View>
                </View>
              </ScrollView>

              {/* Footer */}
              <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.closeFooterButton, { backgroundColor: colors.primary }]}
                  onPress={handleClose}
                >
                  <ThemedText style={styles.closeFooterButtonText}>
                    Close
                  </ThemedText>
                </TouchableOpacity>
              </View>
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
          {/* Same content as web version */}
          {/* Title */}
          <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document" size={18} color={colors.primary} />
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Title
              </ThemedText>
            </View>
            <ThemedText style={[styles.sectionValue, { color: colors.text }]}>
              {operation.title}
            </ThemedText>
          </View>

          {/* Description */}
          {operation.description && (
            <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="text" size={18} color={colors.primary} />
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  Description
                </ThemedText>
              </View>
              <ThemedText style={[styles.sectionValue, { color: colors.text }]}>
                {operation.description}
              </ThemedText>
            </View>
          )}

          {/* Operation Type */}
          <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="construct" size={18} color={colors.primary} />
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Operation Type
              </ThemedText>
            </View>
            <ThemedText style={[styles.sectionValue, { color: colors.text }]}>
              {operation.operationType}
            </ThemedText>
          </View>

          {/* Status */}
          <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flag" size={18} color={colors.primary} />
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Status
              </ThemedText>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: operation.status === 'active' ? colors.success : colors.tabIconDefault }
            ]}>
              <ThemedText style={styles.statusText}>
                {operation.status === 'active' ? 'Active' : 'Concluded'}
              </ThemedText>
            </View>
          </View>

          {/* Location */}
          {operation.municipalityId && (
            <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location" size={18} color={colors.primary} />
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  Municipality
                </ThemedText>
              </View>
              <ThemedText style={[styles.sectionValue, { color: colors.text }]}>
                {getMunicipalityName(operation.municipalityId)}
              </ThemedText>
            </View>
          )}

          {/* Exact Location */}
          {operation.exactLocation && (
            <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="map" size={18} color={colors.primary} />
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  Exact Location
                </ThemedText>
              </View>
              <ThemedText style={[styles.sectionValue, { color: colors.text }]}>
                Barangay: {operation.exactLocation.barangay}
                {operation.exactLocation.purok && `, Purok: ${operation.exactLocation.purok}`}
                {operation.exactLocation.specificAddress && `\n${operation.exactLocation.specificAddress}`}
              </ThemedText>
            </View>
          )}

          {/* Dates */}
          <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={18} color={colors.primary} />
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Dates
              </ThemedText>
            </View>
            <View style={styles.dateContainer}>
              <View style={styles.dateRow}>
                <ThemedText style={[styles.dateLabel, { color: colors.text + '80' }]}>
                  Start Date:
                </ThemedText>
                <ThemedText style={[styles.dateValue, { color: colors.text }]}>
                  {formatDate(operation.startDate)}
                </ThemedText>
              </View>
              {operation.endDate && (
                <View style={styles.dateRow}>
                  <ThemedText style={[styles.dateLabel, { color: colors.text + '80' }]}>
                    End Date:
                  </ThemedText>
                  <ThemedText style={[styles.dateValue, { color: colors.text }]}>
                    {formatDate(operation.endDate)}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Resources */}
          {operation.resources.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cube" size={18} color={colors.primary} />
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  Resources ({operation.resources.length})
                </ThemedText>
              </View>
              <View style={styles.resourcesList}>
                {operation.resources.map((resource, index) => (
                  <View key={index} style={[styles.resourceItem, { borderColor: colors.border }]}>
                    <ThemedText style={[styles.resourceText, { color: colors.text }]}>
                      {resource.quantity}x {resource.resourceName}
                    </ThemedText>
                    <View style={[styles.resourceBadge, { backgroundColor: colors.primary + '20' }]}>
                      <ThemedText style={[styles.resourceBadgeText, { color: colors.primary }]}>
                        {resource.category}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Personnel */}
          {operation.assignedPersonnel && operation.assignedPersonnel.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="people" size={18} color={colors.primary} />
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  Assigned Personnel ({operation.assignedPersonnel.length})
                </ThemedText>
              </View>
              {teamLeaderName && (
                <View style={[styles.teamLeaderBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                  <Ionicons name="star" size={16} color={colors.primary} />
                  <ThemedText style={[styles.teamLeaderText, { color: colors.primary }]}>
                    Team Leader: {teamLeaderName}
                  </ThemedText>
                </View>
              )}
              <View style={styles.personnelList}>
                {operation.assignedPersonnel.map((userId) => {
                  const person = personnelMap.get(userId);
                  if (!person) return null;
                  const isTeamLeader = operation.teamLeader === userId;
                  const isSupervisor = person.userType === 'supervisor';
                  
                  return (
                    <View key={userId} style={[styles.personnelItem, { borderColor: colors.border }]}>
                      <View style={styles.personnelInfo}>
                        <ThemedText style={[styles.personnelName, { color: colors.text }]}>
                          {formatPersonnelName(person.fullName)}
                          {isTeamLeader && (
                            <ThemedText style={[styles.teamLeaderLabel, { color: colors.primary }]}>
                              {' '}(Team Leader)
                            </ThemedText>
                          )}
                        </ThemedText>
                        {person.email && (
                          <ThemedText style={[styles.personnelEmail, { color: colors.text + '80' }]}>
                            {person.email}
                          </ThemedText>
                        )}
                      </View>
                      {isSupervisor && (
                        <View style={[styles.roleBadge, { backgroundColor: '#FF6B35' }]}>
                          <ThemedText style={styles.roleBadgeText}>
                            Supervisor
                          </ThemedText>
                        </View>
                      )}
                      {!isSupervisor && (
                        <View style={[styles.roleBadge, { backgroundColor: '#4A90E2' }]}>
                          <ThemedText style={styles.roleBadgeText}>
                            Operator
                          </ThemedText>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Notes */}
          {operation.notes && (
            <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text" size={18} color={colors.primary} />
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  Notes
                </ThemedText>
              </View>
              <ThemedText style={[styles.sectionValue, { color: colors.text }]}>
                {operation.notes}
              </ThemedText>
            </View>
          )}

          {/* Metadata */}
          <View style={[styles.section, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                Metadata
              </ThemedText>
            </View>
            <View style={styles.metadataContainer}>
              <ThemedText style={[styles.metadataText, { color: colors.text + '80' }]}>
                Operation ID: {operation.id}
              </ThemedText>
              {operation.createdBy && (
                <ThemedText style={[styles.metadataText, { color: colors.text + '80' }]}>
                  Created by: {creatorName || 'Loading...'}
                </ThemedText>
              )}
              {operation.updatedBy && (
                <ThemedText style={[styles.metadataText, { color: colors.text + '80' }]}>
                  Updated by: {updaterName || 'Loading...'}
                </ThemedText>
              )}
              <ThemedText style={[styles.metadataText, { color: colors.text + '80' }]}>
                Last Updated: {formatDate(operation.updatedAt)}
              </ThemedText>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
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
    maxWidth: 700,
    maxHeight: '90%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2,
  },
  modalContent: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  section: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionValue: {
    fontSize: 15,
    lineHeight: 22,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  dateContainer: {
    gap: 8,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  resourcesList: {
    gap: 8,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  resourceText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  resourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resourceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  teamLeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  teamLeaderText: {
    fontSize: 14,
    fontWeight: '600',
  },
  personnelList: {
    gap: 8,
  },
  personnelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  personnelInfo: {
    flex: 1,
  },
  personnelName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  teamLeaderLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  personnelEmail: {
    fontSize: 12,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metadataContainer: {
    gap: 6,
  },
  metadataText: {
    fontSize: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  closeFooterButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeFooterButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
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

