import { ThemedText } from '@/components/ThemedText';
import { Tag } from '@/components/base/tags/tags';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
  const [actionsMenuPosition, setActionsMenuPosition] = useState({ top: 0, left: 0 });
  const [creatorName, setCreatorName] = useState<string | null>(null);
  const [updaterName, setUpdaterName] = useState<string | null>(null);
  const [personnelMap, setPersonnelMap] = useState<Map<string, { fullName: string; email?: string }>>(new Map());
  const moreButtonRef = useRef<View>(null);

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

  const handleOpenActionsMenu = () => {
    if (!moreButtonRef.current) {
      setShowActionsMenu(true);
      return;
    }

    moreButtonRef.current.measureInWindow((x, y, width, height) => {
      // Anchor the menu beneath the trigger and right-align it.
      setActionsMenuPosition({
        top: y + height + 4,
        left: Math.max(8, x + width - 130),
      });
      setShowActionsMenu(true);
    });
  };

  const UntitledEyeIcon = ({ color }: { color: string }) => (
    <Svg viewBox="0 0 24 24" width={16} height={16} fill="none">
      <Path
        d="M2.42 12.713c-.136-.215-.204-.323-.242-.49a1.173 1.173 0 0 1 0-.446c.038-.167.106-.274.242-.49C3.546 9.505 6.895 5 12 5s8.455 4.505 9.58 6.287c.137.215.205.323.243.49.029.125.029.322 0 .446-.038.167-.106.274-.242.49C20.455 14.495 17.105 19 12 19c-5.106 0-8.455-4.505-9.58-6.287Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const UntitledEditIcon = ({ color }: { color: string }) => (
    <Svg viewBox="0 0 24 24" width={16} height={16} fill="none">
      <Path
        d="m21 18-1 1.094A2.71 2.71 0 0 1 18 20c-.75 0-1.47-.326-2-.906a2.716 2.716 0 0 0-2-.904c-.75 0-1.469.325-2 .904M3 20h1.675c.489 0 .733 0 .964-.055.204-.05.399-.13.578-.24.201-.123.374-.296.72-.642L19.5 6.5a2.121 2.121 0 0 0-3-3L3.937 16.063c-.346.346-.519.519-.642.72a2 2 0 0 0-.24.578c-.055.23-.055.475-.055.965V20Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const UntitledTrashIcon = ({ color }: { color: string }) => (
    <Svg viewBox="0 0 24 24" width={16} height={16} fill="none">
      <Path
        d="M16 6v-.8c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874C14.48 2 13.92 2 12.8 2h-1.6c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C8 3.52 8 4.08 8 5.2V6m2 5.5v5m4-5v5M3 6h18m-2 0v11.2c0 1.68 0 2.52-.327 3.162a3 3 0 0 1-1.311 1.311C16.72 22 15.88 22 14.2 22H9.8c-1.68 0-2.52 0-3.162-.327a3 3 0 0 1-1.311-1.311C5 19.72 5 18.88 5 17.2V6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const UntitledDotsVerticalIcon = ({ color }: { color: string }) => (
    <Svg viewBox="0 0 24 24" width={16} height={16} fill="none">
      <Path
        d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0-7a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const UntitledLocationIcon = ({ color }: { color: string }) => (
    <Svg viewBox="0 0 24 24" width={14} height={14} fill="none">
      <Path
        d="M12 12.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 22c2-4 8-6.582 8-12a8 8 0 1 0-16 0c0 5.418 6 8 8 12Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const UntitledResourceIcon = ({ color }: { color: string }) => (
    <Svg viewBox="0 0 24 24" width={14} height={14} fill="none">
      <Path
        d="M16 16V6.2c0-1.12 0-1.68-.218-2.108a2 2 0 0 0-.874-.874C14.48 3 13.92 3 12.8 3H5.2c-1.12 0-1.68 0-2.108.218a2 2 0 0 0-.874.874C2 4.52 2 5.08 2 6.2v6.6c0 1.12 0 1.68.218 2.108a2 2 0 0 0 .874.874C3.52 16 4.08 16 5.2 16H16Zm0 0h4.4c.56 0 .84 0 1.054-.109a1 1 0 0 0 .437-.437C22 15.24 22 14.96 22 14.4v-2.737c0-.245 0-.367-.028-.482a.998.998 0 0 0-.12-.29c-.061-.1-.148-.187-.32-.36L19.468 8.47c-.173-.173-.26-.26-.36-.322a1 1 0 0 0-.29-.12C18.704 8 18.582 8 18.337 8H16M9 18.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm11 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const UntitledCalendarIcon = ({ color }: { color: string }) => (
    <Svg viewBox="0 0 24 24" width={14} height={14} fill="none">
      <Path
        d="M21 10H3m13-8v4M8 2v4m-.2 16h8.4c1.68 0 2.52 0 3.162-.327a3 3 0 0 0 1.311-1.311C21 19.72 21 18.88 21 17.2V8.8c0-1.68 0-2.52-.327-3.162a3 3 0 0 0-1.311-1.311C18.72 4 17.88 4 16.2 4H7.8c-1.68 0-2.52 0-3.162.327a3 3 0 0 0-1.311 1.311C3 6.28 3 7.12 3 8.8v8.4c0 1.68 0 2.52.327 3.162a3 3 0 0 0 1.311 1.311C5.28 22 6.12 22 7.8 22Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const UntitledUsersIcon = ({ color }: { color: string }) => (
    <Svg viewBox="0 0 24 24" width={14} height={14} fill="none">
      <Path
        d="M22 21v-2a4.002 4.002 0 0 0-3-3.874M15.5 3.291a4.001 4.001 0 0 1 0 7.418M17 21c0-1.864 0-2.796-.305-3.53a4 4 0 0 0-2.164-2.165C13.796 15 12.864 15 11 15H8c-1.864 0-2.796 0-3.53.305a4 4 0 0 0-2.166 2.164C2 18.204 2 19.136 2 21M13.5 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const UntitledCheckCircleIcon = ({ color }: { color: string }) => (
    <Svg viewBox="0 0 24 24" width={16} height={16} fill="none">
      <Path
        d="m7.5 12 3 3 6-6m5.5 3c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  const renderActionIcon = (type: 'view' | 'edit' | 'delete', color: string) => {
    if (type === 'view') return <UntitledEyeIcon color={color} />;
    if (type === 'edit') return <UntitledEditIcon color={color} />;
    return <UntitledTrashIcon color={color} />;
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
            ref={moreButtonRef}
            style={[styles.moreButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => {
              if (showActionsMenu) {
                setShowActionsMenu(false);
                return;
              }
              handleOpenActionsMenu();
            }}
            activeOpacity={0.8}
          >
            <UntitledDotsVerticalIcon color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Details */}
      <View style={styles.operationDetails}>
        {/* Location Information */}
        {operation.exactLocation && (
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <UntitledLocationIcon color={colors.text} />
              </View>
              <ThemedText style={[styles.detailValue, { color: colors.text }]} numberOfLines={2}>
                {formatLocation()}
              </ThemedText>
            </View>
          </View>
        )}
        
        {operation.resources.length > 0 && (
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <View style={styles.detailIcon}>
                <UntitledResourceIcon color={colors.text} />
              </View>
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
                <View style={styles.detailIcon}>
                  <UntitledCalendarIcon color={colors.text} />
                </View>
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
              <View style={styles.detailIcon}>
                <UntitledUsersIcon color={colors.text} />
              </View>
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
            <UntitledCheckCircleIcon color="white" />
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

      <Modal
        visible={showActionsMenu}
        transparent
        animationType="none"
        onRequestClose={() => setShowActionsMenu(false)}
      >
        <Pressable style={styles.actionsBackdropGlobal} onPress={() => setShowActionsMenu(false)}>
          <Pressable
            style={[
              styles.actionsDropdownGlobal,
              {
                top: actionsMenuPosition.top,
                left: actionsMenuPosition.left,
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
            onPress={() => {}}
          >
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                setShowActionsMenu(false);
                setShowPreviewModal(true);
              }}
            >
              {renderActionIcon('view', colors.text)}
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
                {renderActionIcon('edit', colors.text)}
                <ThemedText style={[styles.dropdownItemText, { color: colors.text }]}>Edit</ThemedText>
              </TouchableOpacity>
            )}
            {canDelete && (
              <TouchableOpacity style={styles.dropdownItem} onPress={handleDelete}>
                {renderActionIcon('delete', colors.error || '#EF4444')}
                <ThemedText style={[styles.dropdownItemText, { color: colors.error || '#EF4444' }]}>Delete</ThemedText>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
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
  actionsBackdropGlobal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsDropdownGlobal: {
    position: 'absolute',
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
