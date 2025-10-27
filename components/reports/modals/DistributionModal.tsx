import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { getAllUsers, UserData } from '@/firebase/auth';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';

interface DistributionModalProps {
  visible: boolean;
  selectedDocumentId?: string;
  initialDistributionList?: string[];
  onClose: () => void;
  onSave: (userIds: string[]) => void;
}

export function DistributionModal({
  visible,
  selectedDocumentId,
  initialDistributionList = [],
  onClose,
  onSave,
}: DistributionModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuth();

  // Hybrid RAMP hook for animations
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose: rampHandleClose } = useHybridRamp({
    visible,
    onClose,
  });

  const [users, setUsers] = React.useState<UserData[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedUsers, setSelectedUsers] = React.useState<Set<string>>(new Set(initialDistributionList));

  React.useEffect(() => {
    if (visible) {
      fetchUsers();
      setSelectedUsers(new Set(initialDistributionList));
    }
  }, [visible, initialDistributionList]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedUsers(new Set(users.map((u) => u.id)));
  };

  const handleDeselectAll = () => {
    setSelectedUsers(new Set());
  };

  const handleSave = () => {
    onSave(Array.from(selectedUsers));
    rampHandleClose();
  };

  if (!visible) return null;

  const renderContent = () => (
    <>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconContainer}>
            <Ionicons name="people" size={24} color={colors.tint} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Assign to Users</Text>
            <Text style={[styles.headerSubtitle, { color: colors.tabIconDefault }]}>
              Select users to distribute this document
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={rampHandleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={[styles.quickActions, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surface }]}
          onPress={handleSelectAll}
        >
          <Ionicons name="checkbox" size={18} color={colors.tint} />
          <Text style={[styles.actionButtonText, { color: colors.tint }]}>Select All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.surface }]}
          onPress={handleDeselectAll}
        >
          <Ionicons name="square-outline" size={18} color={colors.tabIconDefault} />
          <Text style={[styles.actionButtonText, { color: colors.tabIconDefault }]}>Clear All</Text>
        </TouchableOpacity>
        <View style={[styles.selectedCount, { backgroundColor: colors.tint }]}>
          <Text style={styles.selectedCountText}>{selectedUsers.size} selected</Text>
        </View>
      </View>

      {/* User List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.centerContent}>
            <Ionicons name="hourglass" size={32} color={colors.tabIconDefault} />
            <Text style={[styles.emptyText, { color: colors.text }]}>Loading users...</Text>
          </View>
        ) : users.length === 0 ? (
          <View style={styles.centerContent}>
            <Ionicons name="people-outline" size={48} color={colors.tabIconDefault} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No users available</Text>
          </View>
        ) : (
          <View style={styles.userList}>
            {users.map((userData) => {
              const isSelected = selectedUsers.has(userData.id);
              return (
                <TouchableOpacity
                  key={userData.id}
                  style={[
                    styles.userItem,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isSelected && styles.userItemSelected,
                  ]}
                  onPress={() => toggleUserSelection(userData.id)}
                >
                  <View style={styles.userCheckbox}>
                    {isSelected ? (
                      <Ionicons name="checkbox" size={24} color={colors.tint} />
                    ) : (
                      <Ionicons name="square-outline" size={24} color={colors.tabIconDefault} />
                    )}
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]}>{userData.fullName}</Text>
                    <Text style={[styles.userEmail, { color: colors.tabIconDefault }]}>{userData.email}</Text>
                    <View style={styles.userBadges}>
                      <View
                        style={[
                          styles.userTypeBadge,
                          {
                            backgroundColor:
                              userData.userType === 'admin'
                                ? '#FF3B30'
                                : userData.userType === 'supervisor'
                                ? '#FF9500'
                                : '#34C759',
                          },
                        ]}
                      >
                        <Text style={styles.userTypeBadgeText}>{userData.userType}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.surface }]}
          onPress={rampHandleClose}
        >
          <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.tint }]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Assign ({selectedUsers.size})</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // Platform-specific modal rendering
  if (isWeb) {
    return (
      <Modal
        visible={visible}
        animationType="fade"
        transparent={true}
        onRequestClose={rampHandleClose}
      >
        <Animated.View style={[styles.overlayWeb, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={styles.overlayCloseButton}
            onPress={rampHandleClose}
            activeOpacity={0.7}
          />
          <Animated.View
            style={[
              styles.containerWeb,
              { backgroundColor: colors.background },
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
              },
            ]}
          >
            {renderContent()}
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }

  // Mobile bottom sheet
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayWeb: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayCloseButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    overflow: 'hidden',
  },
  containerWeb: {
    width: '90%',
    maxWidth: 600,
    maxHeight: '85%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  quickActions: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  selectedCount: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  selectedCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
  },
  userList: {
    padding: 16,
    gap: 8,
  },
  userItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 12,
  },
  userItemSelected: {
    borderColor: '#4361EE',
    borderWidth: 2,
  },
  userCheckbox: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    marginBottom: 6,
  },
  userBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  userTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  userTypeBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

