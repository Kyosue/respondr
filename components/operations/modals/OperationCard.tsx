import { ThemedText } from '@/components/ThemedText';
import { Tag } from '@/components/base/tags/tags';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { OperationCompleteModal } from './OperationCompleteModal';
import { OperationPreviewModal } from './OperationPreviewModal';

interface OperationCardProps {
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
  onConclude?: (operationId: string) => void;
  onDelete?: (operationId: string) => void;
  onEdit?: (operation: OperationCardProps['operation']) => void;
}

export function OperationCard({ operation, onConclude, onDelete, onEdit }: OperationCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [updaterName, setUpdaterName] = useState<string | null>(null);
  const [personnelMap, setPersonnelMap] = useState<Map<string, { fullName: string; email?: string }>>(new Map());

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
          setCreatorName(data.displayName || data.fullName || 'Unknown');
        } else {
          setCreatorName('Unknown');
        }
      } catch (e) {
        setCreatorName('Unknown');
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
          setUpdaterName(data.displayName || data.fullName || 'Unknown');
        } else {
          setUpdaterName('Unknown');
        }
      } catch (e) {
        setUpdaterName('Unknown');
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
          return;
        }
        const { db } = await import('@/firebase/config');
        const { doc, getDoc } = await import('firebase/firestore');
        const map = new Map<string, { fullName: string; email?: string }>();
        
        // Fetch all personnel in parallel
        const promises = operation.assignedPersonnel.map(async (userId) => {
          try {
            const userRef = doc(db, 'users', userId);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              const data = snap.data() as { fullName?: string; email?: string };
              if (data.fullName) {
                map.set(userId, { fullName: data.fullName, email: data.email });
              }
            }
          } catch (e) {
            console.error(`Error fetching user ${userId}:`, e);
          }
        });
        
        await Promise.all(promises);
        if (!isMounted) return;
        setPersonnelMap(map);
      } catch (e) {
        console.error('Error fetching personnel:', e);
        setPersonnelMap(new Map());
      }
    };
    fetchPersonnel();
    return () => { isMounted = false; };
  }, [operation.assignedPersonnel]);


  const formatDate = (value: string | Date | number) => {
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getResourceLabels = () => {
    return operation.resources.map((resource) => `${resource.quantity}x ${resource.resourceName}`);
  };

  const formatLocation = () => {
    if (!operation.exactLocation) return '';
    const parts: string[] = [];
    if (operation.exactLocation.barangay) parts.push(operation.exactLocation.barangay);
    if (operation.exactLocation.purok) parts.push(operation.exactLocation.purok);
    if (operation.exactLocation.specificAddress) parts.push(operation.exactLocation.specificAddress);
    return parts.join(', ');
  };

  const getPersonnelNames = () => {
    if (!operation.assignedPersonnel || operation.assignedPersonnel.length === 0) {
      return [];
    }
    
    const getLastName = (fullName: string): string => {
      const parts = fullName.trim().split(/\s+/);
      return parts.length > 1 ? parts[parts.length - 1] : fullName;
    };

    const personnelNames = operation.assignedPersonnel
      .map(userId => {
        const person = personnelMap.get(userId);
        if (!person) return null;
        const lastName = getLastName(person.fullName);
        const firstName = person.fullName.replace(lastName, '').trim();
        return `${lastName}, ${firstName}`;
      })
      .filter((name): name is string => name !== null);

    return personnelNames;
  };

  const canConclude = !!onConclude && operation.status !== 'concluded';
  const canDelete = !!onDelete;
  const canEdit = !!onEdit && operation.status !== 'concluded';

  const handleConcludeOperation = () => {
    if (!canConclude) return;
    setShowCompleteModal(true);
  };

  const handleConfirmConclude = () => {
    // Close the modal and notify parent to remove the operation
    setShowCompleteModal(false);
    onConclude?.(operation.id);
  };

  // Update operation button removed per requirements
  const handleDelete = () => {
    setShowActionsMenu(false);
    onDelete?.(operation.id);
  };

  return (
    <View style={[styles.operationCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header with title and badges */}
      <View style={styles.operationHeader}>
        <View style={styles.operationTitleContainer}>
          <View style={styles.titleRow}>
            <ThemedText style={[styles.operationTitle, { color: colors.text }]} numberOfLines={1}>
              {operation.title}
            </ThemedText>
            <Tag dot size="sm" dotColor={operation.status === 'active' ? '#10B981' : '#6B7280'}>
              {operation.status === 'active' ? 'ACTIVE' : 'CONCLUDED'}
            </Tag>
          </View>
        </View>
        <View style={styles.actionsMenuContainer}>
          <TouchableOpacity
            style={[styles.moreButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => setShowActionsMenu((prev) => !prev)}
            activeOpacity={0.8}
          >
            <Ionicons name="ellipsis-vertical" size={16} color={colors.text} />
          </TouchableOpacity>
          {showActionsMenu && (
            <View style={[styles.actionsDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setShowActionsMenu(false);
                  setShowPreviewModal(true);
                }}
              >
                <Ionicons name="eye-outline" size={16} color={colors.text} />
                <ThemedText style={[styles.dropdownItemText, { color: colors.text }]}>View</ThemedText>
              </TouchableOpacity>
              {canEdit && (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => {
                    setShowActionsMenu(false);
                    onEdit?.(operation);
                  }}
                >
                  <Ionicons name="create-outline" size={16} color={colors.text} />
                  <ThemedText style={[styles.dropdownItemText, { color: colors.text }]}>Edit</ThemedText>
                </TouchableOpacity>
              )}
              {canDelete && (
                <TouchableOpacity style={styles.dropdownItem} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={16} color={colors.error || '#EF4444'} />
                  <ThemedText style={[styles.dropdownItemText, { color: colors.error || '#EF4444' }]}>Delete</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
      
      {/* Details */}
      <View style={styles.operationDetails}>
        {/* Location Information */}
        {operation.exactLocation && (
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="location" size={14} color={colors.text} style={styles.detailIcon} />
              <ThemedText style={[styles.detailValue, { color: colors.text }]} numberOfLines={2}>
                {formatLocation()}
              </ThemedText>
            </View>
          </View>
        )}
        
        {operation.resources.length > 0 && (
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="car" size={14} color={colors.text} style={styles.detailIcon} />
              <View style={styles.resourceTagsWrap}>
                {(() => {
                  const labels = getResourceLabels();
                  const maxDisplay = 2;
                  const visibleLabels = labels.slice(0, maxDisplay);
                  const remaining = labels.length - visibleLabels.length;
                  return (
                    <>
                      {visibleLabels.map((label) => (
                        <Tag key={label} size="sm">{label}</Tag>
                      ))}
                      {remaining > 0 ? <Tag size="sm">+{remaining} more</Tag> : null}
                    </>
                  );
                })()}
              </View>
            </View>
            
            {operation.endDate && (
              <View style={styles.detailItem}>
                <Ionicons name="calendar-outline" size={14} color={colors.text} style={styles.detailIcon} />
                <ThemedText style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
                  {formatDate(operation.endDate)}
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Assigned Personnel */}
        {operation.assignedPersonnel && operation.assignedPersonnel.length > 0 && (
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="people" size={14} color={colors.text} style={styles.detailIcon} />
              <View style={styles.personnelTagsWrap}>
                {(() => {
                  const names = getPersonnelNames();
                  if (names.length === 0) {
                    return <Tag size="sm">Loading...</Tag>;
                  }
                  const maxDisplay = 2;
                  const visibleNames = names.slice(0, maxDisplay);
                  const remaining = names.length - visibleNames.length;
                  return (
                    <>
                      {visibleNames.map((name) => (
                        <Tag key={name} size="sm">{name}</Tag>
                      ))}
                      {remaining > 0 ? <Tag size="sm">+{remaining} more</Tag> : null}
                    </>
                  );
                })()}
              </View>
            </View>
          </View>
        )}
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {canConclude && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.completeButton,
              { backgroundColor: colors.success }
            ]}
            onPress={handleConcludeOperation}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="white" />
            <ThemedText style={[styles.actionButtonText, { color: 'white' }]}>
              Conclude
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* Footer - compact */}
      <View style={styles.operationFooter}>
        <View style={{ flex: 1 }}>
          <ThemedText style={[styles.operationId, { color: colors.text, opacity: 0.6 }]} numberOfLines={1}>
            ID: {operation.id}
          </ThemedText>
          {operation.createdBy && (
            <ThemedText style={[styles.operationId, { color: colors.text, opacity: 0.6 }]} numberOfLines={1}>
              {`Created by ${creatorName ?? '…'}`}
            </ThemedText>
          )}
          {operation.status === 'concluded' && operation.updatedBy && (
            <ThemedText style={[styles.operationId, { color: colors.text, opacity: 0.6 }]} numberOfLines={1}>
              {`Concluded by ${updaterName ?? '…'}`}
            </ThemedText>
          )}
        </View>
        <ThemedText style={[styles.operationDate, { color: colors.text, opacity: 0.6 }]} numberOfLines={1}>
          {formatDate(operation.startDate)}
        </ThemedText>
      </View>

      {/* Completion Confirmation Modal */}
      <OperationCompleteModal
        visible={showCompleteModal}
        operation={operation}
        onClose={() => setShowCompleteModal(false)}
        onConfirm={handleConfirmConclude}
      />

      {/* Operation Preview Modal */}
      <OperationPreviewModal
        visible={showPreviewModal}
        operation={operation}
        onClose={() => setShowPreviewModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  operationCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    position: 'relative',
    overflow: 'visible',
    zIndex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  operationHeader: {
    position: 'relative',
    paddingRight: 40,
    marginBottom: 8,
    overflow: 'visible',
    zIndex: 30,
  },
  operationTitleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    paddingRight: 4,
  },
  operationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 0,
    marginBottom: 0,
  },
  actionsMenuContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 40,
    overflow: 'visible',
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsDropdown: {
    position: 'absolute',
    top: 36,
    right: 0,
    minWidth: 130,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 4,
    zIndex: 999,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  priorityText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  operationDetails: {
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  detailIcon: {
    marginRight: 4,
    width: 14,
  },
  detailValue: {
    fontSize: 13,
    flex: 1,
  },
  personnelTagsWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  resourceTagsWrap: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  operationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  operationId: {
    fontSize: 11,
  },
  operationDate: {
    fontSize: 11,
  },
  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  previewButton: {
    borderWidth: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  updateButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  completeButton: {
    // backgroundColor set dynamically
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
