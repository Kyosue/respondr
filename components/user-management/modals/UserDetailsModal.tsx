import { Ionicons } from '@expo/vector-icons';
import {
  Dimensions,
  Modal,
  ScrollView,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { UserData } from '@/types/UserData';
import { UserType } from '@/types/UserType';

import { styles } from './UserDetailsModal.styles';

const { height: screenHeight } = Dimensions.get('window');

interface UserDetailsModalProps {
  user: UserData | null;
  visible: boolean;
  onClose: () => void;
  onEdit?: (user: UserData) => void;
  onDelete?: (user: UserData) => void;
}

export function UserDetailsModal({
  user,
  visible,
  onClose,
  onEdit,
  onDelete
}: UserDetailsModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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

  const userTypeColor = getUserTypeColor(user.userType);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
            <View style={[styles.largeAvatar, { backgroundColor: userTypeColor }]}>
              <ThemedText style={styles.largeAvatarText}>
                {user.fullName.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: userTypeColor }]}>
              <Ionicons 
                name={getUserTypeIcon(user.userType)} 
                size={16} 
                color="#fff" 
              />
              <ThemedText style={styles.statusText}>
                {user.userType.toUpperCase()}
              </ThemedText>
            </View>
          </View>

          {/* User Info Section */}
          <View style={[styles.infoSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</ThemedText>
            
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="person" size={20} color={userTypeColor} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.text + '60' }]}>Full Name</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>{user.fullName}</ThemedText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="at" size={20} color={userTypeColor} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.text + '60' }]}>Username</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>{user.username}</ThemedText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="mail" size={20} color={userTypeColor} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.text + '60' }]}>Email Address</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>{user.email}</ThemedText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar" size={20} color={userTypeColor} />
              </View>
              <View style={styles.infoContent}>
                <ThemedText style={[styles.infoLabel, { color: colors.text + '60' }]}>Joined</ThemedText>
                <ThemedText style={[styles.infoValue, { color: colors.text }]}>
                  {formatDate(user.createdAt)}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Actions Section */}
          {(onEdit || onDelete) && (
            <View style={[styles.actionsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Actions</ThemedText>
              
              {onEdit && (
                <TouchableOpacity 
                  style={[styles.actionButton, { borderColor: colors.border }]}
                  onPress={() => onEdit(user)}
                >
                  <Ionicons name="create" size={20} color={colors.primary} />
                  <ThemedText style={[styles.actionText, { color: colors.primary }]}>Edit User</ThemedText>
                </TouchableOpacity>
              )}

              {onDelete && (
                <TouchableOpacity 
                  style={[styles.actionButton, { borderColor: colors.border }]}
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
    </Modal>
  );
}
