import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import {
  Platform,
  TouchableOpacity,
  View
} from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { UserData } from '../../../types/UserData';
import { UserType } from '../../../types/UserType';

import { styles } from './UserCard.styles';

interface UserCardProps {
  user: UserData;
  onPress: (user: UserData) => void;
  colors: any;
}

export const UserCard = memo(function UserCard({ 
  user, 
  onPress, 
  colors
}: UserCardProps) {
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
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const userTypeColor = getUserTypeColor(user.userType);

  return (
    <TouchableOpacity 
      style={[styles.userCard, { 
        backgroundColor: colors.surface,
        borderColor: colors.border,
        ...Platform.select({
          ios: {
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          android: {
            elevation: 2,
          },
        }),
      }]}
      onPress={() => onPress(user)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.leftSection}>
          <View style={styles.avatarContainer}>
            <View style={[styles.userAvatar, { backgroundColor: userTypeColor }]}>
              <ThemedText style={styles.avatarText}>
                {user.fullName.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.userInfo}>
            <View style={styles.headerRow}>
              <ThemedText style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                {user.fullName}
              </ThemedText>
              <View style={[styles.userTypeBadge, { backgroundColor: userTypeColor }]}>
                <Ionicons 
                  name={getUserTypeIcon(user.userType)} 
                  size={12} 
                  color="#fff" 
                  style={styles.badgeIcon}
                />
                <ThemedText style={styles.userTypeText}>
                  {user.userType.toUpperCase()}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.metaRow}>
              <Ionicons name="at" size={12} color={colors.text + '60'} style={styles.metaIcon} />
              <ThemedText style={[styles.userUsername, { color: colors.text + '80' }]} numberOfLines={1}>
                {user.username}
              </ThemedText>
              <Ionicons name="mail" size={12} color={colors.text + '60'} style={[styles.metaIcon, { marginLeft: 15 }]} />
              <ThemedText 
                style={[styles.userEmail, { color: colors.text + '80' }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {user.email}
              </ThemedText>
            </View>
            
            <View style={styles.metaRow}>
              <Ionicons name="calendar" size={12} color={colors.text + '60'} style={styles.metaIcon} />
              <ThemedText style={[styles.userDate, { color: colors.text + '60' }]}>
                Joined {formatDate(user.createdAt)}
              </ThemedText>
            </View>
          </View>
        </View>
        <View style={styles.chevronContainer}>
          <Ionicons name="chevron-forward" size={20} color={colors.text + '40'} />
        </View>
      </View>
    </TouchableOpacity>
  );
});
