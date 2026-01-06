import { Ionicons } from '@expo/vector-icons';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MobileModalSafeAreaWrapper, getMobileModalConfig } from '@/components/ui/MobileModalWrapper';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { updateUser } from '@/firebase/auth';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';
import { UserData, UserStatus } from '@/types/UserData';
import { UserType } from '@/types/UserType';
import { useEffect } from 'react';
import { serverTimestamp } from 'firebase/firestore';

import { styles } from './UserDetailsModal.styles';

const { height: screenHeight } = Dimensions.get('window');

interface UserDetailsModalProps {
  user: UserData | null;
  visible: boolean;
  onClose: () => void;
  onEdit?: (user: UserData) => void;
  onDelete?: (user: UserData) => void;
  onToggleStatus?: (user: UserData) => void;
}

// Check if a user is new (created within the last 7 days and not yet viewed by admin)
function isNewUser(user: UserData): boolean {
  // If user has been viewed, they're no longer "new"
  if (user.viewedAt) return false;
  
  if (!user.createdAt) return false;
  
  try {
    let createdAt: Date;
    
    // Handle Firestore Timestamp
    if (user.createdAt && typeof user.createdAt === 'object' && 'toDate' in user.createdAt) {
      createdAt = (user.createdAt as any).toDate();
    }
    // Handle Date object
    else if (user.createdAt instanceof Date) {
      createdAt = user.createdAt;
    }
    // Handle timestamp number
    else if (typeof user.createdAt === 'number') {
      createdAt = new Date(user.createdAt);
    }
    // Handle timestamp string or ISO string
    else if (typeof user.createdAt === 'string') {
      createdAt = new Date(user.createdAt);
    }
    // Handle seconds timestamp (Firestore format)
    else if (user.createdAt && typeof user.createdAt === 'object' && 'seconds' in user.createdAt) {
      createdAt = new Date((user.createdAt as any).seconds * 1000);
    }
    else {
      return false;
    }
    
    // Check if date is valid
    if (isNaN(createdAt.getTime())) {
      return false;
    }
    
    const now = new Date();
    const diffTime = now.getTime() - createdAt.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    // Consider user "new" if created within last 7 days
    return diffDays <= 7 && diffDays >= 0;
  } catch (error) {
    return false;
  }
}

export function UserDetailsModal({
  user,
  visible,
  onClose,
  onEdit,
  onDelete,
  onToggleStatus
}: UserDetailsModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose } = useHybridRamp({ visible, onClose });
  const { user: currentUser } = useAuth();

  // Mark user as viewed when modal opens (only if admin and user is new)
  useEffect(() => {
    if (visible && user && currentUser && currentUser.userType === 'admin' && isNewUser(user) && !user.viewedAt) {
      // Mark user as viewed
      updateUser(user.id, { viewedAt: serverTimestamp() }).catch((error) => {
        console.error('Error marking user as viewed:', error);
      });
    }
  }, [visible, user?.id, currentUser?.userType, user?.viewedAt]);

  if (!user) return null;

  const getUserTypeColor = (userType: UserType) => {
    switch (userType) {
      case 'admin': return '#EF4444';
      case 'supervisor': return '#F59E0B';
      case 'operator': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const getUserTypeIcon = (userType: UserType) => {
    switch (userType) {
      case 'admin': return 'shield';
      case 'supervisor': return 'eye';
      case 'operator': return 'person';
      default: return 'person';
    }
  };

  const getStatusColor = (status: UserStatus | undefined) => {
    if (!status) return '#6B7280';
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#6B7280';
      case 'suspended': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: UserStatus | undefined) => {
    if (!status) return 'help-circle';
    switch (status) {
      case 'active': return 'checkmark-circle';
      case 'inactive': return 'pause-circle';
      case 'suspended': return 'ban';
      default: return 'help-circle';
    }
  };

  const getStatusText = (status: UserStatus | undefined) => {
    if (!status) return 'Unknown';
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'suspended': return 'Suspended';
      default: return 'Unknown';
    }
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatRelativeTime = (timestamp: any): string => {
    if (!timestamp) return 'Never';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  const userTypeColor = getUserTypeColor(user.userType);
  const statusColor = getStatusColor(user.status);
  const statusIcon = getStatusIcon(user.status);
  const userStatus = user.status || 'active';
  const isNew = isNewUser(user);

  return (
    <Modal
      visible={visible}
      animationType={isWeb ? 'none' : 'slide'}
      transparent={isWeb}
      presentationStyle={isWeb ? 'overFullScreen' : getMobileModalConfig().presentationStyle}
      onRequestClose={handleClose}
    >
      {isWeb && (
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backdropTouchable} activeOpacity={1} onPress={handleClose} />
        </Animated.View>
      )}

      <Animated.View
        style={[
          isWeb ? styles.webPanelContainer : styles.mobilePanelContainer,
          isWeb && { transform: [{ scale: scaleAnim }, { translateY: slideAnim }] },
        ]}
      >
      {isWeb ? (
        <ThemedView style={[styles.container, styles.webPanel]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>User Details</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* User Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <View style={[styles.largeAvatar, { backgroundColor: user?.avatarUrl ? 'transparent' : userTypeColor }]}>
                {user?.avatarUrl ? (
                  <Image 
                    source={{ uri: user.avatarUrl }} 
                    style={styles.largeAvatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <ThemedText style={styles.largeAvatarText}>
                    {user.fullName.charAt(0).toUpperCase()}
                  </ThemedText>
                )}
              </View>
              {/* Status indicator */}
              <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
                <Ionicons name={statusIcon} size={12} color="#fff" />
              </View>
            </View>
            
            <View style={styles.userInfoHeader}>
              <View style={styles.userNameRow}>
                <ThemedText style={[styles.userName, { color: colors.text }]}>
                  {user.fullName}
                </ThemedText>
                {isNew && (
                  <View style={[styles.newBadge, { backgroundColor: colors.primary }]}>
                    <Ionicons name="sparkles" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <ThemedText style={styles.newBadgeText}>NEW</ThemedText>
                  </View>
                )}
              </View>
              <ThemedText style={[styles.userEmail, { color: colors.text + '80' }]}>
                {user.email}
              </ThemedText>
            </View>

            <View style={styles.badgesContainer}>
              <View style={[styles.roleBadge, { backgroundColor: userTypeColor }]}>
                <Ionicons 
                  name={getUserTypeIcon(user.userType)} 
                  size={14} 
                  color="#fff" 
                />
                <ThemedText style={styles.badgeText}>
                  {user.userType.toUpperCase()}
                </ThemedText>
              </View>
              
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
                <Ionicons name={statusIcon} size={14} color={statusColor} />
                <ThemedText style={[styles.badgeText, { color: statusColor }]}>
                  {getStatusText(user.status)}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Personal Information Section */}
          <View style={[styles.infoSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</ThemedText>
            
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: userTypeColor + '15' }]}>
                <Ionicons name="person" size={20} color={userTypeColor} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.text + '60' }]}>Full Name</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>{user.fullName}</ThemedText>
              </View>
            </View>

            {user.displayName && user.displayName !== user.fullName && (
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: userTypeColor + '15' }]}>
                  <Ionicons name="at" size={20} color={userTypeColor} />
                </View>
                <View style={styles.infoContent}>
                  <ThemedText style={[styles.infoLabel, { color: colors.text + '60' }]}>Display Name</ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.text }]}>{user.displayName}</ThemedText>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: userTypeColor + '15' }]}>
                <Ionicons name="mail" size={20} color={userTypeColor} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.text + '60' }]}>Email Address</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>{user.email}</ThemedText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: userTypeColor + '15' }]}>
                <Ionicons name="calendar" size={20} color={userTypeColor} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.text + '60' }]}>Member Since</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>
                  {formatDate(user.createdAt)}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Activity Information Section */}
          <View style={[styles.infoSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Activity Information</ThemedText>
            
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: statusColor + '15' }]}>
                <Ionicons name="time" size={20} color={statusColor} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.text + '60' }]}>Last Login</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>
                  {formatRelativeTime(user.lastLoginAt)}
                </ThemedText>
                {user.lastLoginAt && (
                  <ThemedText style={[styles.infoSubtext, { color: colors.text + '40' }]}>
                    {formatDate(user.lastLoginAt)}
                  </ThemedText>
                )}
              </View>
            </View>


            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: userTypeColor + '15' }]}>
                <Ionicons name="refresh" size={20} color={userTypeColor} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.text + '60' }]}>Last Updated</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>
                  {formatRelativeTime(user.updatedAt)}
                </ThemedText>
                {user.updatedAt && (
                  <ThemedText style={[styles.infoSubtext, { color: colors.text + '40' }]}>
                    {formatDate(user.updatedAt)}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>

          {/* Actions Section */}
          {(onEdit || onDelete || onToggleStatus) && (
            <View style={[styles.actionsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Actions</ThemedText>
              
              {onToggleStatus && (
                <TouchableOpacity 
                  style={[styles.actionButton, { borderColor: statusColor }]}
                  onPress={() => onToggleStatus(user)}
                >
                  <Ionicons 
                    name={userStatus === 'active' ? 'pause' : 'play'} 
                    size={20} 
                    color={statusColor} 
                  />
                  <ThemedText style={[styles.actionText, { color: statusColor }]}>
                    {userStatus === 'active' ? 'Deactivate User' : 'Activate User'}
                  </ThemedText>
                </TouchableOpacity>
              )}

              {onEdit && (
                <TouchableOpacity 
                  style={[styles.actionButton, { borderColor: colors.primary }]}
                  onPress={() => onEdit(user)}
                >
                  <Ionicons name="create" size={20} color={colors.primary} />
                  <ThemedText style={[styles.actionText, { color: colors.primary }]}>Edit User</ThemedText>
                </TouchableOpacity>
              )}

              {onDelete && (
                <TouchableOpacity 
                  style={[styles.actionButton, { borderColor: '#EF4444' }]}
                  onPress={() => onDelete(user)}
                >
                  <Ionicons name="trash" size={20} color="#EF4444" />
                  <ThemedText style={[styles.actionText, { color: '#EF4444' }]}>Delete User</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
        </ThemedView>
      ) : (
        <MobileModalSafeAreaWrapper>
          <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>User Details</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* User Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <View style={[styles.largeAvatar, { backgroundColor: user?.avatarUrl ? 'transparent' : userTypeColor }]}>
                {user?.avatarUrl ? (
                  <Image 
                    source={{ uri: user.avatarUrl }} 
                    style={styles.largeAvatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <ThemedText style={styles.largeAvatarText}>
                    {user.fullName.charAt(0).toUpperCase()}
                  </ThemedText>
                )}
              </View>
              {/* Status indicator */}
              <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
                <Ionicons name={statusIcon} size={12} color="#fff" />
              </View>
            </View>
            
            <View style={styles.userInfoHeader}>
              <View style={styles.userNameRow}>
                <ThemedText style={[styles.userName, { color: colors.text }]}>
                  {user.fullName}
                </ThemedText>
                {isNew && (
                  <View style={[styles.newBadge, { backgroundColor: colors.primary }]}>
                    <Ionicons name="sparkles" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <ThemedText style={styles.newBadgeText}>NEW</ThemedText>
                  </View>
                )}
              </View>
              <ThemedText style={[styles.userEmail, { color: colors.text + '80' }]}>
                {user.email}
              </ThemedText>
            </View>

            <View style={styles.badgesContainer}>
              <View style={[styles.roleBadge, { backgroundColor: userTypeColor }]}>
                <Ionicons 
                  name={getUserTypeIcon(user.userType)} 
                  size={14} 
                  color="#fff" 
                />
                <ThemedText style={styles.badgeText}>
                  {user.userType.toUpperCase()}
                </ThemedText>
              </View>
              
              <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
                <Ionicons name={statusIcon} size={14} color={statusColor} />
                <ThemedText style={[styles.badgeText, { color: statusColor }]}>
                  {getStatusText(user.status)}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Personal Information Section */}
          <View style={[styles.infoSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</ThemedText>
            
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: userTypeColor + '15' }]}>
                <Ionicons name="person" size={20} color={userTypeColor} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.text + '60' }]}>Full Name</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>{user.fullName}</ThemedText>
              </View>
            </View>

            {user.displayName && user.displayName !== user.fullName && (
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: userTypeColor + '15' }]}>
                  <Ionicons name="at" size={20} color={userTypeColor} />
                </View>
                <View style={styles.infoContent}>
                  <ThemedText style={[styles.infoLabel, { color: colors.text + '60' }]}>Display Name</ThemedText>
                  <ThemedText style={[styles.infoValue, { color: colors.text }]}>{user.displayName}</ThemedText>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: userTypeColor + '15' }]}>
                <Ionicons name="mail" size={20} color={userTypeColor} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.text + '60' }]}>Email Address</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>{user.email}</ThemedText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: userTypeColor + '15' }]}>
                <Ionicons name="calendar" size={20} color={userTypeColor} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.text + '60' }]}>Member Since</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>
                  {formatDate(user.createdAt)}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Activity Information Section */}
          <View style={[styles.infoSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Activity Information</ThemedText>
            
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: statusColor + '15' }]}>
                <Ionicons name="time" size={20} color={statusColor} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.text + '60' }]}>Last Login</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>
                  {formatRelativeTime(user.lastLoginAt)}
                </ThemedText>
                {user.lastLoginAt && (
                  <ThemedText style={[styles.infoSubtext, { color: colors.text + '40' }]}>
                    {formatDate(user.lastLoginAt)}
                  </ThemedText>
                )}
              </View>
            </View>


            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: userTypeColor + '15' }]}>
                <Ionicons name="refresh" size={20} color={userTypeColor} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.text + '60' }]}>Last Updated</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>
                  {formatRelativeTime(user.updatedAt)}
                </ThemedText>
                {user.updatedAt && (
                  <ThemedText style={[styles.infoSubtext, { color: colors.text + '40' }]}>
                    {formatDate(user.updatedAt)}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>

          {/* Actions Section */}
          {(onEdit || onDelete || onToggleStatus) && (
            <View style={[styles.actionsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Actions</ThemedText>
              
              {onToggleStatus && (
                <TouchableOpacity 
                  style={[styles.actionButton, { borderColor: statusColor }]}
                  onPress={() => onToggleStatus(user)}
                >
                  <Ionicons 
                    name={userStatus === 'active' ? 'pause' : 'play'} 
                    size={20} 
                    color={statusColor} 
                  />
                  <ThemedText style={[styles.actionText, { color: statusColor }]}>
                    {userStatus === 'active' ? 'Deactivate User' : 'Activate User'}
                  </ThemedText>
                </TouchableOpacity>
              )}

              {onEdit && (
                <TouchableOpacity 
                  style={[styles.actionButton, { borderColor: colors.primary }]}
                  onPress={() => onEdit(user)}
                >
                  <Ionicons name="create" size={20} color={colors.primary} />
                  <ThemedText style={[styles.actionText, { color: colors.primary }]}>Edit User</ThemedText>
                </TouchableOpacity>
              )}

              {onDelete && (
                <TouchableOpacity 
                  style={[styles.actionButton, { borderColor: '#EF4444' }]}
                  onPress={() => onDelete(user)}
                >
                  <Ionicons name="trash" size={20} color="#EF4444" />
                  <ThemedText style={[styles.actionText, { color: '#EF4444' }]}>Delete User</ThemedText>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
          </ThemedView>
        </MobileModalSafeAreaWrapper>
      )}
      </Animated.View>
    </Modal>
  );
}
