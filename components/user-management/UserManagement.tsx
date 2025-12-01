import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { ConfirmationModal } from '@/components/modals/ConfirmationModal';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { UserData, UserStatus } from '@/firebase/auth';
import { useBottomNavHeight } from '@/hooks/useBottomNavHeight';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useConfirmationModal } from '@/hooks/useConfirmationModal';
import { usePermissions } from '@/hooks/usePermissions';
import { usePlatform } from '@/hooks/usePlatform';
import { UserType } from '@/types/UserType';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  View
} from 'react-native';
import { getAllUsers, reauthenticateUser, toggleUserStatus } from '../../firebase/auth';
import { deleteUserByAdmin } from '../../firebase/functions';
import { UserCard } from './UserCard/UserCard';
import { UserSortOption } from './UserHeader/UserFilterPopover';
import { UserHeader } from './UserHeader/UserHeader';
import { UsersTable } from './UsersTable';
import { EditUserModal, PasswordVerificationModal, UserDetailsModal } from './modals';
import { styles } from './styles/UserManagement.styles';

const UserManagement: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const bottomNavHeight = useBottomNavHeight();
  const { isWeb } = usePlatform();
  const { user, firebaseUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { canViewUserManagement, canManageUsers, canCreateUsers, canEditUsers, canDeleteUsers, canToggleUserStatus } = usePermissions();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterType, setFilterType] = useState<UserType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'all'>('all');
  const [sortOption, setSortOption] = useState<UserSortOption>('default');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  
  // Confirmation modal hook
  const confirmationModal = useConfirmationModal();

  // Responsive grid logic for mobile/tablet
  const screenWidth = Dimensions.get('window').width;
  const isTablet = screenWidth > 600 && screenWidth <= 768;
  
  // Calculate cards per row based on screen size (only for mobile/tablet)
  const getCardsPerRow = () => {
    if (isTablet) return 3; // 3 cards per row on tablet
    return 1; // 1 card per row on mobile
  };
  
  const cardsPerRow = getCardsPerRow();
  const cardWidth = (100 / cardsPerRow) - 2; // 2% margin between cards

  const fetchUsers = async (isInitialLoad = false) => {
    try {
      setError(null);
      if (isInitialLoad) {
        setIsLoading(true);
      }
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Only load users if user is authenticated and has permission
    if (user && firebaseUser && !authLoading && canViewUserManagement) {
      fetchUsers(true); // Pass true to indicate initial load
    } else if (!canViewUserManagement || !user || !firebaseUser) {
      setIsLoading(false); // Stop loading if no permission or not authenticated
    }
  }, [user, firebaseUser, authLoading, canViewUserManagement]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery('');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const handleFilterSelect = (type: UserType | 'all') => {
    setFilterType(type);
  };

  const handleStatusFilterSelect = (status: UserStatus | 'all') => {
    setFilterStatus(status);
  };

  const handleSortSelect = (sort: UserSortOption) => {
    setSortOption(sort);
  };

  // Filter, search, and sort users
  const filteredUsers = useMemo(() => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTypeFilter = filterType === 'all' || user.userType === filterType;
      const userStatus = user.status || 'active'; // Default to 'active' if status is undefined
      const matchesStatusFilter = filterStatus === 'all' || userStatus === filterStatus;
      
      return matchesSearch && matchesTypeFilter && matchesStatusFilter;
    });

    // Apply sorting
    // Note: When sortOption is not 'default', sorting completely ignores status/role hierarchy
    filtered = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'alphabetical-asc':
          // Sort alphabetically A-Z, ignoring status and role grouping
          return a.fullName.localeCompare(b.fullName);
        case 'alphabetical-desc':
          // Sort alphabetically Z-A, ignoring status and role grouping
          return b.fullName.localeCompare(a.fullName);
        case 'recently-added':
          // Sort by creation date (newest first), ignoring status and role grouping
          const dateA = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate?.() || new Date(0)) : new Date(0);
          const dateB = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate?.() || new Date(0)) : new Date(0);
          return dateB.getTime() - dateA.getTime();
        case 'default':
        default:
          // Default: Sort by status first (active, inactive, suspended), then by role (admin, supervisor, operator)
          const statusOrder: Record<UserStatus | 'default', number> = {
            active: 0,
            inactive: 1,
            suspended: 2,
            default: 0,
          };
          const roleOrder: Record<UserType, number> = {
            admin: 0,
            supervisor: 1,
            operator: 2,
          };
          const statusA = a.status || 'active';
          const statusB = b.status || 'active';
          const statusDiff = statusOrder[statusA] - statusOrder[statusB];
          if (statusDiff !== 0) {
            return statusDiff;
          }
          return roleOrder[a.userType] - roleOrder[b.userType];
      }
    });

    return filtered;
  }, [users, searchQuery, filterType, filterStatus, sortOption]);

  // Group users by role
  const groupedUsers = useMemo(() => {
    const groups: { [key: string]: UserData[] } = {
      admin: [],
      supervisor: [],
      operator: []
    };

    filteredUsers.forEach(user => {
      if (groups[user.userType]) {
        groups[user.userType].push(user);
      }
    });

    // Return groups in order: admin, supervisor, operator
    return [
      { role: 'admin', users: groups.admin, label: 'Administrators' },
      { role: 'supervisor', users: groups.supervisor, label: 'Supervisors' },
      { role: 'operator', users: groups.operator, label: 'Operators' }
    ].filter(group => group.users.length > 0);
  }, [filteredUsers]);

  const handleUserPress = (user: UserData) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleCloseModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const handleEditUser = (user: UserData) => {
    setEditingUser(user);
    setShowEditUserModal(true);
    handleCloseModal();
  };

  const handleDeleteUser = (user: UserData) => {
    // Check if trying to delete own account
    if (user.id === firebaseUser?.uid) {
      confirmationModal.showConfirmation({
        title: 'Cannot Delete Account',
        message: 'You cannot delete your own account. Please ask another administrator to delete your account.',
        variant: 'info',
        confirmLabel: 'OK',
        onConfirm: () => {
          // Modal will close automatically after onConfirm
        },
      });
      return;
    }

    confirmationModal.showConfirmation({
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.fullName}? This action cannot be undone and will require your password verification.`,
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: () => {
        setUserToDelete(user);
        setShowPasswordModal(true);
        // Modal will close automatically after onConfirm
      },
    });
  };

  const handlePasswordVerification = async (password: string) => {
    if (!userToDelete) return;

    try {
      // First, verify the admin's password for security
      await reauthenticateUser(password);
      
      // Then use Cloud Function to delete user (hard delete - removes from Firebase Auth and Firestore)
      await deleteUserByAdmin({
        userId: userToDelete.id,
        hardDelete: true, // This will delete from both Firebase Auth and Firestore
      });
      
      await fetchUsers(); // Refresh the list
      setShowPasswordModal(false);
      setUserToDelete(null);
      handleCloseModal();
      Alert.alert('Success', `${userToDelete.fullName} has been deleted successfully`);
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user. Please try again.';
      throw new Error(errorMessage); // This will be caught by the PasswordVerificationModal
    }
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setUserToDelete(null);
  };

  const handleToggleUserStatus = (user: UserData) => {
    const currentStatus = user.status || 'active'; // Default to 'active' if status is undefined
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    const actionCapitalized = action.charAt(0).toUpperCase() + action.slice(1);
    
    // Use green (warning variant) for activation, red (danger variant) for deactivation
    const variant = newStatus === 'active' ? 'warning' : 'danger';
    
    confirmationModal.showConfirmation({
      title: `${actionCapitalized} User`,
      message: `Are you sure you want to ${action} ${user.fullName}?`,
      variant: variant,
      confirmLabel: actionCapitalized,
      onConfirm: async () => {
        try {
          await toggleUserStatus(user.id, newStatus);
          await fetchUsers(); // Refresh the list
          Alert.alert('Success', `User ${action}d successfully`);
        } catch (error) {
          console.error(`Error ${action}ing user:`, error);
          Alert.alert('Error', `Failed to ${action} user. Please try again.`);
          // Don't hide modal on error - let user retry
          throw error;
        }
        // Modal will close automatically after successful onConfirm
      },
    });
  };

  

  const handleCloseEditUserModal = () => {
    setShowEditUserModal(false);
    setEditingUser(null);
  };

  const handleUserUpdated = () => {
    // Refresh the users list when a user is updated
    fetchUsers();
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <ThemedText style={styles.emptyTitle}>No users found</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        {searchQuery ? 'Try adjusting your search terms' : 'Users will appear here once they register'}
      </ThemedText>
    </View>
  );

  const renderUserList = () => {
    if (filteredUsers.length === 0) {
      return renderEmptyState();
    }

    if (isWeb) {
      return (
        <View style={{ flex: 1, minHeight: 400 }}>
          <UsersTable
            users={filteredUsers}
            onUserPress={handleUserPress}
            onEdit={canEditUsers ? handleEditUser : undefined}
            onDelete={canDeleteUsers ? handleDeleteUser : undefined}
            onToggleStatus={canToggleUserStatus ? handleToggleUserStatus : undefined}
            canEdit={canEditUsers}
            canDelete={canDeleteUsers}
            canToggleStatus={canToggleUserStatus}
          />
        </View>
      );
    }

    return (
      <View style={styles.usersContainer}>
        <View style={styles.groupsContainer}>
          {groupedUsers.map((group, groupIndex) => (
            <View key={group.role} style={styles.roleGroup}>
              {/* Role Header */}
              <View style={[styles.roleHeader, { borderBottomColor: colors.border }]}>
                <ThemedText style={[styles.roleTitle, { color: colors.text }]}>
                  {group.label}
                </ThemedText>
                <ThemedText style={[styles.roleCount, { color: colors.text + '60' }]}>
                  {group.users.length} {group.users.length === 1 ? 'user' : 'users'}
                </ThemedText>
              </View>

              {/* Users Grid for this role */}
              <View style={[
                styles.usersGrid,
                {
                  flexDirection: isTablet ? 'row' : 'column',
                  flexWrap: isTablet ? 'wrap' : 'nowrap',
                  justifyContent: 'flex-start',
                  alignItems: isTablet ? 'flex-start' : 'stretch',
                  gap: isTablet ? 12 : 0,
                }
              ]}>
                {group.users.map((user: UserData) => (
                  <View 
                    key={user.id}
                    style={[
                      styles.userCardWrapper,
                      {
                        width: isTablet ? `${cardWidth}%` : '100%',
                        marginBottom: isTablet ? 12 : 6,
                      }
                    ]}
                  >
                    <UserCard
                      user={user}
                      onPress={handleUserPress}
                      onEdit={canEditUsers ? handleEditUser : undefined}
                      onDelete={canDeleteUsers ? handleDeleteUser : undefined}
                      onToggleStatus={canToggleUserStatus ? handleToggleUserStatus : undefined}
                      colors={colors}
                    />
                  </View>
                ))}
              </View>

              {/* Divider between role groups (except for the last group) */}
              {groupIndex < groupedUsers.length - 1 && (
                <View style={[styles.roleDivider, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <ThemedView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText style={styles.loadingText}>Loading...</ThemedText>
      </ThemedView>
    );
  }

  // Check if user has permission to view user management
  if (!canViewUserManagement) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.accessDeniedContainer}>
          <Ionicons name="lock-closed" size={64} color={colors.error} style={styles.accessDeniedIcon} />
          <ThemedText style={[styles.accessDeniedTitle, { color: colors.error }]}>
            Access Denied
          </ThemedText>
          <ThemedText style={[styles.accessDeniedMessage, { color: colors.text }]}>
            You don't have permission to access user management. This feature is only available to administrators.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Show login prompt if not authenticated
  if (!user || !firebaseUser) {
    return (
      <ThemedView style={[styles.container, styles.emptyContainer]}>
        <ThemedText style={styles.emptyTitle}>User Management</ThemedText>
        <ThemedText style={styles.emptySubtitle}>
          {!firebaseUser ? 'Please log in to access user management' : 'Authentication in progress...'}
        </ThemedText>
        {error && (
          <ThemedText style={[styles.emptySubtitle, { color: colors.error }]}>
            Error: {error}
          </ThemedText>
        )}
      </ThemedView>
    );
  }

  // Show loading spinner when initially loading users (similar to Dashboard and SitRep)
  if (isLoading && users.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText style={{ marginTop: 16, opacity: 0.7, color: colors.text }}>
            Loading users...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <UserHeader
        showSearch={showSearch}
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onSearchToggle={handleSearchToggle}
        onClearSearch={handleClearSearch}
        selectedFilter={filterType}
        onFilterSelect={handleFilterSelect}
        selectedStatusFilter={filterStatus}
        onStatusFilterSelect={handleStatusFilterSelect}
        selectedSort={sortOption}
        onSortSelect={handleSortSelect}
      />

      {isWeb ? (
        <View style={styles.scrollView}>
          {renderUserList()}
        </View>
      ) : (
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: bottomNavHeight + 20 }
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
          {renderUserList()}
        </ScrollView>
      )}

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        visible={showUserModal}
        onClose={handleCloseModal}
        onEdit={canEditUsers ? handleEditUser : undefined}
        onDelete={canDeleteUsers ? handleDeleteUser : undefined}
        onToggleStatus={canToggleUserStatus ? handleToggleUserStatus : undefined}
      />

      

      {/* Edit User Modal */}
      <EditUserModal
        user={editingUser}
        visible={showEditUserModal}
        onClose={handleCloseEditUserModal}
        onUserUpdated={handleUserUpdated}
      />

      {/* Password Verification Modal */}
      <PasswordVerificationModal
        visible={showPasswordModal}
        onClose={handleClosePasswordModal}
        onVerify={handlePasswordVerification}
        title="Verify Password to Delete User"
        message="To delete this user, please enter your current password to confirm this action."
        userFullName={userToDelete?.fullName}
      />

      {/* Confirmation Modal */}
      {confirmationModal.options && (
        <ConfirmationModal
          visible={confirmationModal.visible}
          title={confirmationModal.options.title}
          message={confirmationModal.options.message}
          variant={confirmationModal.options.variant}
          confirmLabel={confirmationModal.options.confirmLabel}
          cancelLabel={confirmationModal.options.cancelLabel}
          icon={confirmationModal.options.icon}
          onConfirm={confirmationModal.handleConfirm}
          onCancel={confirmationModal.hideConfirmation}
        />
      )}
    </ThemedView>
  );
};

// Styles will be moved to separate file

export { UserManagement };

