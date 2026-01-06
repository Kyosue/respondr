import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Image, Modal, Platform, ScrollView, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import { LogoutModal } from '@/components/modals/LogoutModal';
import { ImageSelectionModal } from '@/components/resources/modals/ImageSelectionModal';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { imageUtils } from '@/firebase/cloudinary';
import { ResilientAuthService } from '@/firebase/resilientAuth';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useLogin } from '@/hooks/useLogin';
import { generateDisplayName, validateFullName } from '@/utils/nameUtils';
import { profileButtonStyles as styles } from './ProfileButton.styles';

interface ProfileButtonProps {
  buttonSize?: number;
  iconSize?: number;
  dropdownWidth?: number;
  dropdownMaxHeight?: number;
  dropdownHeight?: number; // Explicit height for mobile (overrides percentage)
  dropdownHeightPercentage?: number; // Percentage of screen height for mobile (default: 0.85 = 85%)
  avatarSize?: number;
}

export function ProfileButton({
  buttonSize = 40,
  iconSize = 20,
  dropdownWidth = 360,
  dropdownMaxHeight = 800,
  dropdownHeight = 650,
  dropdownHeightPercentage = 0.85, // 85% of screen height by default
  avatarSize = 36,
}: ProfileButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, updateUserData } = useAuth();
  const { logout } = useLogin();
  const router = useRouter();
  const [profileVisible, setProfileVisible] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isEditPanelClosing, setIsEditPanelClosing] = useState(false);
  const [isClosingFromProfile, setIsClosingFromProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [wasProfileOpen, setWasProfileOpen] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const [buttonImageError, setButtonImageError] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Edit profile form state
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');

  // Reset error states when avatar URL changes
  useEffect(() => {
    setProfileImageError(false);
    setButtonImageError(false);
  }, [user?.avatarUrl]);

  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const buttonRef = useRef<View>(null);
  const isWeb = Platform.OS === 'web';
  const slideAnim = useRef(new Animated.Value(isWeb ? dropdownWidth : 0)).current;
  const editPanelSlideAnim = useRef(new Animated.Value(0)).current; // Start behind profile dropdown (0 = hidden behind)
  const chevronRotate = useRef(new Animated.Value(0)).current;
  const authService = ResilientAuthService.getInstance();

  // Initialize edit form when opening edit modal
  useEffect(() => {
    if (showEditProfile && user) {
      setIsEditPanelClosing(false);
      setEditFullName(user.fullName || '');
      setEditEmail(user.email || '');
      setEditUsername(user.username || '');
      setFullNameError('');
      setEmailError('');
      setUsernameError('');
      
      // Animate edit panel slide in on web (slide out from behind)
      if (isWeb) {
        Animated.timing(editPanelSlideAnim, {
          toValue: -400, // Slide out to the left (negative = left direction)
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    } else if (isWeb && isEditPanelClosing && !isClosingFromProfile) {
      // Animate edit panel slide out on web (slide back behind)
      // Note: If closing from closeProfile, the animation is handled there
      // This handles closing from other sources (like cancel button)
      Animated.timing(editPanelSlideAnim, {
        toValue: 0, // Slide back to 0 (hidden behind)
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After animation completes, reset closing state
        setIsEditPanelClosing(false);
      });
    }
  }, [showEditProfile, user, isWeb, editPanelSlideAnim, isEditPanelClosing, isClosingFromProfile]);

  // Calculate mobile height - explicit height takes precedence, then percentage, then maxHeight
  const screenHeight = Dimensions.get('window').height;
  const screenWidth = Dimensions.get('window').width;
  const calculatedMobileHeight = dropdownHeight 
    ? Math.min(dropdownHeight, screenHeight - 100) // Ensure it doesn't exceed screen
    : Math.min(
        screenHeight * dropdownHeightPercentage,
        dropdownMaxHeight,
        screenHeight - 100 // Leave some margin
      );
  const mobileHeight = calculatedMobileHeight;
  const mobileWidth = Math.min(dropdownWidth + 40, screenWidth - 24);
  const mobileTop = (screenHeight - mobileHeight) / 2;
  const mobileLeft = (screenWidth - mobileWidth) / 2;

  // Map user role to color
  const getUserTypeColor = (userType?: 'admin' | 'supervisor' | 'operator') => {
    switch (userType) {
      case 'admin': return '#EF4444'; // red
      case 'supervisor': return '#F59E0B'; // orange
      case 'operator': return '#3B82F6'; // blue
      default: return colors.primary;
    }
  };

  // Get user type label
  const getUserTypeLabel = (userType?: 'admin' | 'supervisor' | 'operator') => {
    switch (userType) {
      case 'admin': return 'Administrator';
      case 'supervisor': return 'Supervisor';
      case 'operator': return 'Operator';
      default: return 'User';
    }
  };

  // Get first letter of name for avatar placeholder
  const nameInitial = user?.fullName?.charAt(0).toUpperCase() || 'U';

  // Toggle profile dropdown
  const toggleProfile = () => {
    if (profileVisible) {
      // Close animation
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(chevronRotate, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        ...(isWeb ? [
          Animated.timing(slideAnim, {
            toValue: dropdownWidth,
            duration: 300,
            useNativeDriver: true,
          }),
        ] : []),
      ]).start(() => {
        setProfileVisible(false);
      });
    } else {
      // Open animation
      setProfileVisible(true);
      if (isWeb) {
        slideAnim.setValue(dropdownWidth);
      }
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(chevronRotate, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        ...(isWeb ? [
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 80,
            friction: 8,
            useNativeDriver: true,
          }),
        ] : []),
      ]).start();
    }
  };

  // Close profile when clicking outside
  const closeProfile = () => {
    // Close edit panel with animation first if open (web only)
    if (isWeb && showEditProfile) {
      setIsClosingFromProfile(true);
      setIsEditPanelClosing(true);
      setShowEditProfile(false);
      
      // Wait for edit panel animation to complete, then close profile dropdown
      Animated.timing(editPanelSlideAnim, {
        toValue: 0, // Slide back to 0 (hidden behind)
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // After edit panel closes, close the profile dropdown
        setIsEditPanelClosing(false);
        setIsClosingFromProfile(false);
        closeProfileDropdown();
      });
    } else {
      // If edit panel is not open, close profile dropdown directly
      closeProfileDropdown();
    }
  };

  const closeProfileDropdown = () => {
    if (profileVisible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(chevronRotate, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        ...(isWeb ? [
          Animated.timing(slideAnim, {
            toValue: dropdownWidth,
            duration: 300,
            useNativeDriver: true,
          }),
        ] : []),
      ]).start(() => {
        setProfileVisible(false);
      });
    }
  };

  const handleLogoutPress = () => {
    closeProfile();
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
    router.replace('/login');
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  // Handle image selection from camera
  const handleCameraPress = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleImageUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  // Handle image selection from library
  const handleLibraryPress = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Photo library permission is required to select images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleImageUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image library error:', error);
      Alert.alert('Error', 'Failed to open photo library');
    }
  };

  // Upload image to Cloudinary and update user data
  const handleImageUpload = async (imageUri: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      setUploadingAvatar(true);
      setShowImagePicker(false);

      // Upload to Cloudinary
      const uploadResult = await imageUtils.uploadUserAvatar(imageUri, user.id);
      
      // Update user data in Firebase
      await authService.updateUserData(user.id, {
        avatarUrl: uploadResult.secure_url,
      });

      // Update local user data immediately for UI update
      const updatedUser = {
        ...user,
        avatarUrl: uploadResult.secure_url,
      };
      updateUserData(updatedUser);

      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Generate avatar URL with Cloudinary transformations
  const getAvatarUrl = (avatarUrl?: string, size: number = 200) => {
    if (!avatarUrl) return null;
    
    // For now, use the original URL directly to ensure it works
    // TODO: Add optimization later if needed
    return avatarUrl;
    
    // Commented out optimization - can be re-enabled if needed
    /*
    // If it's already a Cloudinary URL, try to generate optimized version
    if (avatarUrl.includes('cloudinary.com')) {
      try {
        // Extract public ID from URL
        let publicId = '';
        const matchWithVersion = avatarUrl.match(/\/upload\/v\d+\/(.+?)(?:\.(jpg|jpeg|png|gif|webp|avif))?(?:\?|$)/);
        if (matchWithVersion && matchWithVersion[1]) {
          publicId = matchWithVersion[1];
        } else {
          const matchNoVersion = avatarUrl.match(/\/upload\/(.+?)(?:\.(jpg|jpeg|png|gif|webp|avif))?(?:\?|$)/);
          if (matchNoVersion && matchNoVersion[1]) {
            publicId = matchNoVersion[1];
          }
        }
        
        if (publicId) {
          try {
            const optimizedUrl = imageUtils.generateUserAvatarUrl(publicId, size);
            return optimizedUrl;
          } catch (error) {
            console.warn('Failed to generate optimized URL, using original:', error);
          }
        }
      } catch (error) {
        console.error('Error processing Cloudinary URL:', error);
      }
    }
    
    return avatarUrl;
    */
  };

  // Format date
  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    try {
      const d = date.toDate ? date.toDate() : new Date(date);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  // Validate and update profile
  const validateEditForm = (): boolean => {
    let isValid = true;
    
    // Clear previous errors
    setFullNameError('');
    setEmailError('');
    setUsernameError('');

    // Validate full name
    const nameValidation = validateFullName(editFullName);
    if (!nameValidation.isValid) {
      setFullNameError(nameValidation.error || 'Invalid full name');
      isValid = false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editEmail.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!emailRegex.test(editEmail.trim())) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Username is optional, but if provided, validate it
    if (editUsername.trim() && editUsername.trim().length < 3) {
      setUsernameError('Username must be at least 3 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleUpdateProfile = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    if (!validateEditForm()) {
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const displayName = generateDisplayName(editFullName.trim());
      
      // Update user data in Firebase
      await authService.updateUserData(user.id, {
        fullName: editFullName.trim(),
        displayName: displayName,
        email: editEmail.trim(),
        username: editUsername.trim() || undefined,
      });

      // Update local user data immediately for UI update
      const updatedUser = {
        ...user,
        fullName: editFullName.trim(),
        displayName: displayName,
        email: editEmail.trim(),
        username: editUsername.trim() || undefined,
      };
      updateUserData(updatedUser);

      // Close with animation on web
      if (isWeb) {
        setIsEditPanelClosing(true);
      }
      setShowEditProfile(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Calculate edit panel width for split-view on web
  const editPanelWidth = 400; // Fixed width for edit panel

  const dropdownContent = (
    <>
      <Animated.View 
        style={[
          styles.dropdownOverlay,
          { 
            opacity: opacityAnim,
            backgroundColor: isWeb ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.5)',
          } as any,
        ]}
      >
        <TouchableWithoutFeedback onPress={closeProfile}>
          <View style={styles.overlayTouchable} />
        </TouchableWithoutFeedback>
      </Animated.View>
      <View 
        style={[
          styles.profileContainerWrapper,
          isWeb && showEditProfile && styles.profileContainerWrapperSplit,
        ]}
        {...Platform.select({
          web: {
            onClick: (e: any) => {
              // Only stop propagation if clicking on the wrapper itself, not children
              if (e.target === e.currentTarget) {
                e.stopPropagation();
              }
            },
          },
        })}
      >
        <Animated.View
          style={[
            styles.profileDropdown,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: colors.text,
              opacity: opacityAnim,
              transform: [
                { scale: scaleAnim },
                ...(isWeb ? [{ translateX: slideAnim }] : []),
              ],
              ...(isWeb ? {
                position: 'absolute' as const,
                top: 16,
                right: 16,
                width: dropdownWidth,
                maxHeight: Dimensions.get('window').height - 32, // Allow scrolling if content is too tall
                pointerEvents: 'auto',
              } : {
                position: 'absolute' as const,
                top: mobileTop,
                left: mobileLeft,
                width: mobileWidth,
                maxHeight: mobileHeight, // Allow scrolling if content is too tall
                maxWidth: screenWidth - 24,
              }),
            },
          ]}
          {...Platform.select({
            web: {
              onClick: (e: any) => e.stopPropagation(),
              onMouseDown: (e: any) => e.stopPropagation(),
            },
          })}
        >
        <View style={[styles.dropdownHeader, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
          <View style={[styles.headerDivider, { backgroundColor: colors.border }]} />
          <View style={styles.headerLeft}>
            <Ionicons name="person" size={22} color={colors.primary} style={styles.headerIcon} />
            <ThemedText style={[styles.dropdownTitle, { color: colors.text }]}>
              Profile
            </ThemedText>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              onPress={() => {
                if (showEditProfile) {
                  // Close with animation
                  setIsEditPanelClosing(true);
                  setShowEditProfile(false);
                } else {
                  // Open
                  setShowEditProfile(true);
                }
              }}
              style={[styles.headerEditButton, { backgroundColor: `${colors.primary}15` }]}
              activeOpacity={0.7}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={closeProfile}
              style={[styles.closeButton, { backgroundColor: `${colors.text}08` }]}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView 
          style={styles.profileContent} 
          contentContainerStyle={styles.profileContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header Section */}
          <View style={styles.profileHeaderSection}>
            <View style={styles.avatarContainer}>
              <View style={[
                styles.profileAvatar,
                { 
                  backgroundColor: getUserTypeColor(user?.userType as any),
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                }
              ]}>
                {user?.avatarUrl && !profileImageError ? (
                  <Image 
                    source={{ uri: user.avatarUrl }} 
                    style={styles.profileAvatarImage}
                    resizeMode="cover"
                    onError={(error) => {
                      console.error('Error loading profile avatar:', error.nativeEvent?.error || error);
                      console.error('Failed URL:', user.avatarUrl);
                      setProfileImageError(true);
                    }}
                onLoad={() => {
                  setProfileImageError(false);
                }}
                  />
                ) : (
                  <ThemedText style={[styles.profileAvatarText, { fontSize: 32 }]} darkColor="#000" lightColor="#fff">
                    {nameInitial}
                  </ThemedText>
                )}
              </View>
              <TouchableOpacity
                style={[styles.editAvatarButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  // Track if profile was open
                  const profileWasOpen = profileVisible;
                  setWasProfileOpen(profileWasOpen);
                  
                  // On web, close profile modal first to avoid stacking context issues
                  if (isWeb && profileWasOpen) {
                    closeProfile();
                    // Small delay to ensure profile modal closes before opening image picker
                    setTimeout(() => {
                      setShowImagePicker(true);
                    }, 100);
                  } else {
                    setShowImagePicker(true);
                  }
                }}
                disabled={uploadingAvatar}
                activeOpacity={0.7}
              >
                {uploadingAvatar ? (
                  <Ionicons name="hourglass-outline" size={16} color="#fff" />
                ) : (
                  <Ionicons name="camera" size={16} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            <ThemedText style={[styles.profileName, { color: colors.text }]}>
              {user?.fullName || 'User'}
            </ThemedText>
            <View style={[styles.userTypeBadge, { backgroundColor: `${getUserTypeColor(user?.userType as any)}20` }]}>
              <ThemedText style={[styles.userTypeText, { color: getUserTypeColor(user?.userType as any) }]}>
                {getUserTypeLabel(user?.userType as any)}
              </ThemedText>
            </View>
          </View>

          {/* Profile Details Section */}
          <View style={styles.profileDetailsSection}>
            <View style={[styles.detailItem, { borderBottomColor: colors.border }]}>
              <View style={styles.detailItemLeft}>
                <Ionicons name="mail-outline" size={18} color={colors.text} style={{ opacity: 0.6 }} />
                <ThemedText style={[styles.detailLabel, { color: colors.text, opacity: 0.7 }]}>
                  Email
                </ThemedText>
              </View>
              <ThemedText style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
                {user?.email || 'N/A'}
              </ThemedText>
            </View>

            <View style={[styles.detailItem, { borderBottomColor: colors.border }]}>
              <View style={styles.detailItemLeft}>
                <Ionicons name="at-outline" size={18} color={colors.text} style={{ opacity: 0.6 }} />
                <ThemedText style={[styles.detailLabel, { color: colors.text, opacity: 0.7 }]}>
                  Username
                </ThemedText>
              </View>
              <ThemedText style={[styles.detailValue, { color: colors.text }]}>
                {user?.username || 'N/A'}
              </ThemedText>
            </View>

            <View style={[styles.detailItem, { borderBottomColor: colors.border }]}>
              <View style={styles.detailItemLeft}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.text} style={{ opacity: 0.6 }} />
                <ThemedText style={[styles.detailLabel, { color: colors.text, opacity: 0.7 }]}>
                  Status
                </ThemedText>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: user?.status === 'active' ? '#10B98120' : `${colors.text}15` }]}>
                <ThemedText style={[
                  styles.statusText,
                  { color: user?.status === 'active' ? '#10B981' : colors.text }
                ]}>
                  {user?.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Active'}
                </ThemedText>
              </View>
            </View>

            {user?.lastLoginAt && (
              <View style={[styles.detailItem, { borderBottomColor: colors.border }]}>
                <View style={styles.detailItemLeft}>
                  <Ionicons name="time-outline" size={18} color={colors.text} style={{ opacity: 0.6 }} />
                  <ThemedText style={[styles.detailLabel, { color: colors.text, opacity: 0.7 }]}>
                    Last Login
                  </ThemedText>
                </View>
                <ThemedText style={[styles.detailValue, { color: colors.text, opacity: 0.8 }]}>
                  {formatDate(user.lastLoginAt)}
                </ThemedText>
              </View>
            )}

            {user?.createdAt && (
              <View style={[styles.detailItem, { borderBottomColor: colors.border }]}>
                <View style={styles.detailItemLeft}>
                  <Ionicons name="calendar-outline" size={18} color={colors.text} style={{ opacity: 0.6 }} />
                  <ThemedText style={[styles.detailLabel, { color: colors.text, opacity: 0.7 }]}>
                    Member Since
                  </ThemedText>
                </View>
                <ThemedText style={[styles.detailValue, { color: colors.text, opacity: 0.8 }]}>
                  {formatDate(user.createdAt)}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Actions Section */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: `${colors.error}15`, borderColor: colors.error }]}
              onPress={handleLogoutPress}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <ThemedText style={[styles.logoutButtonText, { color: colors.error }]}>
                Logout
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </Animated.View>

      {/* Edit Profile Panel - Split View on Web */}
      {isWeb && (showEditProfile || isEditPanelClosing) && (
        <Animated.View
          style={[
            styles.editProfilePanel,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: opacityAnim,
              transform: [
                { translateX: editPanelSlideAnim },
              ],
              pointerEvents: 'auto',
              // Position it behind the profile dropdown initially, will slide out to the left
              right: -10, // Same right position as profile dropdown, but slides left via translateX
            },
          ]}
          {...Platform.select({
            web: {
              onClick: (e: any) => e.stopPropagation(),
              onMouseDown: (e: any) => e.stopPropagation(),
            },
          })}
        >
          <View style={[styles.editPanelHeader, { borderBottomColor: colors.border }]}>
            <ThemedText style={[styles.editModalTitle, { color: colors.text }]}>
              Edit Profile
            </ThemedText>
            <TouchableOpacity
              onPress={() => {
                if (isWeb) {
                  setIsEditPanelClosing(true);
                }
                setShowEditProfile(false);
              }}
              style={styles.editModalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.editModalBody} showsVerticalScrollIndicator={false}>
            {/* Full Name Input */}
            <View style={styles.editInputContainer}>
              <ThemedText style={[styles.editInputLabel, { color: colors.text }]}>
                Full Name
              </ThemedText>
              <TextInput
                style={[
                  styles.editInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: fullNameError ? colors.error : colors.border,
                    color: colors.text,
                  }
                ]}
                placeholder="Enter your full name"
                placeholderTextColor={colors.text + '60'}
                value={editFullName}
                onChangeText={(text) => {
                  setEditFullName(text);
                  if (fullNameError) setFullNameError('');
                }}
                editable={!isUpdatingProfile}
              />
              {fullNameError ? (
                <ThemedText style={[styles.editInputError, { color: colors.error }]}>
                  {fullNameError}
                </ThemedText>
              ) : null}
            </View>

            {/* Email Input */}
            <View style={styles.editInputContainer}>
              <ThemedText style={[styles.editInputLabel, { color: colors.text }]}>
                Email
              </ThemedText>
              <TextInput
                style={[
                  styles.editInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: emailError ? colors.error : colors.border,
                    color: colors.text,
                  }
                ]}
                placeholder="Enter your email"
                placeholderTextColor={colors.text + '60'}
                value={editEmail}
                onChangeText={(text) => {
                  setEditEmail(text);
                  if (emailError) setEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isUpdatingProfile}
              />
              {emailError ? (
                <ThemedText style={[styles.editInputError, { color: colors.error }]}>
                  {emailError}
                </ThemedText>
              ) : null}
            </View>

            {/* Username Input */}
            <View style={styles.editInputContainer}>
              <ThemedText style={[styles.editInputLabel, { color: colors.text }]}>
                Username
              </ThemedText>
              <TextInput
                style={[
                  styles.editInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: usernameError ? colors.error : colors.border,
                    color: colors.text,
                  }
                ]}
                placeholder="Enter your username"
                placeholderTextColor={colors.text + '60'}
                value={editUsername}
                onChangeText={(text) => {
                  setEditUsername(text);
                  if (usernameError) setUsernameError('');
                }}
                autoCapitalize="none"
                editable={!isUpdatingProfile}
              />
              {usernameError ? (
                <ThemedText style={[styles.editInputError, { color: colors.error }]}>
                  {usernameError}
                </ThemedText>
              ) : null}
            </View>
          </ScrollView>

          <View style={[styles.editModalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.editModalCancelButton, { borderColor: colors.border }]}
              onPress={() => {
                if (isWeb) {
                  setIsEditPanelClosing(true);
                }
                setShowEditProfile(false);
              }}
              disabled={isUpdatingProfile}
            >
              <ThemedText style={[styles.editModalButtonText, { color: colors.text }]}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editModalSaveButton, { backgroundColor: colors.primary }]}
              onPress={handleUpdateProfile}
              disabled={isUpdatingProfile}
            >
              {isUpdatingProfile ? (
                <ThemedText style={[styles.editModalButtonText, { color: '#fff' }]}>
                  Saving...
                </ThemedText>
              ) : (
                <ThemedText style={[styles.editModalButtonText, { color: '#fff' }]}>
                  Save Changes
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
      </View>
    </>
  );

  return (
    <>
      <View style={styles.profileContainer}>
        <View
          ref={buttonRef}
          collapsable={false}
          style={styles.buttonWrapper}
        >
          <TouchableOpacity 
            style={[
              styles.profileButton,
              {
                backgroundColor: user?.avatarUrl ? 'transparent' : getUserTypeColor(user?.userType as any),
                width: buttonSize,
                height: buttonSize,
                borderRadius: buttonSize / 2,
                overflow: 'visible',
              }
            ]}
            onPress={toggleProfile}
            activeOpacity={0.8}
            {...Platform.select({
              android: {
                android_ripple: { color: 'rgba(255, 255, 255, 0.2)' },
              },
            })}
          >
            {user?.avatarUrl && !buttonImageError ? (
              <Image 
                source={{ uri: user.avatarUrl }} 
                style={[styles.buttonAvatarImage, { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 }]}
                resizeMode="cover"
                onError={(error) => {
                  console.error('Error loading button avatar:', error.nativeEvent?.error || error);
                  console.error('Failed URL:', user.avatarUrl);
                  setButtonImageError(true);
                }}
                onLoad={() => {
                  setButtonImageError(false);
                }}
              />
            ) : (
              <ThemedText style={[styles.avatarText, { fontSize: iconSize }]} darkColor="#000" lightColor="#fff">
                {nameInitial}
              </ThemedText>
            )}
            <Animated.View
              style={[
                styles.chevronIcon,
                {
                  transform: [{
                    rotate: chevronRotate.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '180deg'],
                    }),
                  }],
                },
              ]}
            >
              <View style={[styles.chevronIconBackground, { backgroundColor: colors.surface }]}>
                <Ionicons 
                  name="chevron-down" 
                  size={10} 
                  color={colors.text} 
                />
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Profile Dropdown */}
        {profileVisible && (
          <Modal
            visible={profileVisible}
            transparent
            animationType="none"
            onRequestClose={closeProfile}
          >
            {dropdownContent}
          </Modal>
        )}
      </View>

      {/* Logout Modal */}
      <LogoutModal
        visible={showLogoutModal}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />

      {/* Image Selection Modal */}
      <ImageSelectionModal
        visible={showImagePicker}
        onClose={() => {
          setShowImagePicker(false);
          // Reopen profile modal if it was open before (on web)
          if (isWeb && wasProfileOpen) {
            setTimeout(() => {
              toggleProfile();
            }, 100);
            setWasProfileOpen(false);
          }
        }}
        onCameraPress={handleCameraPress}
        onLibraryPress={handleLibraryPress}
        maxImages={1}
      />

      {/* Edit Profile Modal - Mobile Only (Web uses split-view) */}
      {!isWeb && (
        <Modal
          visible={showEditProfile}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEditProfile(false)}
        >
        <View style={styles.editModalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowEditProfile(false)}>
            <View style={styles.editModalBackdrop} />
          </TouchableWithoutFeedback>
          <ThemedView style={[styles.editModalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.editModalHeader, { borderBottomColor: colors.border }]}>
              <ThemedText style={[styles.editModalTitle, { color: colors.text }]}>
                Edit Profile
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowEditProfile(false)}
                style={styles.editModalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.editModalBody} showsVerticalScrollIndicator={false}>
              {/* Full Name Input */}
              <View style={styles.editInputContainer}>
                <ThemedText style={[styles.editInputLabel, { color: colors.text }]}>
                  Full Name
                </ThemedText>
                <TextInput
                  style={[
                    styles.editInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: fullNameError ? colors.error : colors.border,
                      color: colors.text,
                    }
                  ]}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.text + '60'}
                  value={editFullName}
                  onChangeText={(text) => {
                    setEditFullName(text);
                    if (fullNameError) setFullNameError('');
                  }}
                  editable={!isUpdatingProfile}
                />
                {fullNameError ? (
                  <ThemedText style={[styles.editInputError, { color: colors.error }]}>
                    {fullNameError}
                  </ThemedText>
                ) : null}
              </View>

              {/* Email Input */}
              <View style={styles.editInputContainer}>
                <ThemedText style={[styles.editInputLabel, { color: colors.text }]}>
                  Email
                </ThemedText>
                <TextInput
                  style={[
                    styles.editInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: emailError ? colors.error : colors.border,
                      color: colors.text,
                    }
                  ]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.text + '60'}
                  value={editEmail}
                  onChangeText={(text) => {
                    setEditEmail(text);
                    if (emailError) setEmailError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isUpdatingProfile}
                />
                {emailError ? (
                  <ThemedText style={[styles.editInputError, { color: colors.error }]}>
                    {emailError}
                  </ThemedText>
                ) : null}
              </View>

              {/* Username Input */}
              <View style={styles.editInputContainer}>
                <ThemedText style={[styles.editInputLabel, { color: colors.text }]}>
                  Username
                </ThemedText>
                <TextInput
                  style={[
                    styles.editInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: usernameError ? colors.error : colors.border,
                      color: colors.text,
                    }
                  ]}
                  placeholder="Enter your username"
                  placeholderTextColor={colors.text + '60'}
                  value={editUsername}
                  onChangeText={(text) => {
                    setEditUsername(text);
                    if (usernameError) setUsernameError('');
                  }}
                  autoCapitalize="none"
                  editable={!isUpdatingProfile}
                />
                {usernameError ? (
                  <ThemedText style={[styles.editInputError, { color: colors.error }]}>
                    {usernameError}
                  </ThemedText>
                ) : null}
              </View>
            </ScrollView>

            <View style={[styles.editModalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.editModalCancelButton, { borderColor: colors.border }]}
                onPress={() => setShowEditProfile(false)}
                disabled={isUpdatingProfile}
              >
                <ThemedText style={[styles.editModalButtonText, { color: colors.text }]}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editModalSaveButton, { backgroundColor: colors.primary }]}
                onPress={handleUpdateProfile}
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? (
                  <ThemedText style={[styles.editModalButtonText, { color: '#fff' }]}>
                    Saving...
                  </ThemedText>
                ) : (
                  <ThemedText style={[styles.editModalButtonText, { color: '#fff' }]}>
                    Save Changes
                  </ThemedText>
                )}
              </TouchableOpacity>
            </View>
          </ThemedView>
        </View>
      </Modal>
      )}
    </>
  );
}