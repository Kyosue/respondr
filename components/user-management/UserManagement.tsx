import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { UserData, UserStatus } from '@/firebase/auth';
import { useBottomNavHeight } from '@/hooks/useBottomNavHeight';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePermissions } from '@/hooks/usePermissions';
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
import { UserHeader } from './UserHeader/UserHeader';
import { EditUserModal, PasswordVerificationModal, UserDetailsModal } from './modals';
import { styles } from './styles/UserManagement.styles';

const UserManagement: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const bottomNavHeight = useBottomNavHeight();
  const { user, firebaseUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const { canViewUserManagement, canManageUsers, canCreateUsers, canEditUsers, canDeleteUsers, canToggleUserStatus } = usePermissions();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterType, setFilterType] = useState<UserType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);

  // Responsive grid logic
  const screenWidth = Dimensions.get('window').width;
  const isWeb = screenWidth > 768;
  const isTablet = screenWidth > 600 && screenWidth <= 768;
  
  // Calculate cards per row based on screen size
  const getCardsPerRow = () => {
    if (isWeb) return 4; // 3 cards per row on web
    if (isTablet) return 3; // 2 cards per row on tablet
    return 1; // 1 card per row on mobile
  };
  
  const cardsPerRow = getCardsPerRow();
  const cardWidth = (100 / cardsPerRow) - 2; // 2% margin between cards

  const fetchUsers = async () => {
    try {
      setError(null);
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Only load users if user is authenticated and has permission
    if (user && firebaseUser && !authLoading && canViewUserManagement) {
      fetchUsers();
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

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTypeFilter = filterType === 'all' || user.userType === filterType;
      const userStatus = user.status || 'active'; // Default to 'active' if status is undefined
      const matchesStatusFilter = filterStatus === 'all' || userStatus === filterStatus;
      
      return matchesSearch && matchesTypeFilter && matchesStatusFilter;
    });
  }, [users, searchQuery, filterType, filterStatus]);

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

  const handleDeleteUser = async (user: UserData) => {
    // Check if trying to delete own account
    if (user.id === firebaseUser?.uid) {
      Alert.alert(
        'Cannot Delete Account',
        'You cannot delete your own account. Please ask another administrator to delete your account.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.fullName}? This action cannot be undone and will require your password verification.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setUserToDelete(user);
            setShowPasswordModal(true);
          }
        }
      ]
    );
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

  const handleToggleUserStatus = async (user: UserData) => {
    const currentStatus = user.status || 'active'; // Default to 'active' if status is undefined
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${user.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: action.charAt(0).toUpperCase() + action.slice(1), 
          onPress: async () => {
            try {
              await toggleUserStatus(user.id, newStatus);
              await fetchUsers(); // Refresh the list
              Alert.alert('Success', `User ${action}d successfully`);
            } catch (error) {
              console.error(`Error ${action}ing user:`, error);
              Alert.alert('Error', `Failed to ${action} user. Please try again.`);
            }
          }
        }
      ]
    );
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
            You don't have permission to access user management. This feature is only available to administrators and supervisors.
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
      />

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
        <View style={styles.usersContainer}>
          {filteredUsers.length === 0 ? (
            renderEmptyState()
          ) : (
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
                      flexDirection: isWeb || isTablet ? 'row' : 'column',
                      flexWrap: isWeb || isTablet ? 'wrap' : 'nowrap',
                      justifyContent: 'flex-start',
                      alignItems: isWeb || isTablet ? 'flex-start' : 'stretch',
                      gap: isWeb || isTablet ? 12 : 0,
                    }
                  ]}>
                    {group.users.map((user: UserData) => (
                      <View 
                        key={user.id}
                        style={[
                          styles.userCardWrapper,
                          {
                            width: isWeb || isTablet ? `${cardWidth}%` : '100%',
                            marginBottom: isWeb || isTablet ? 12 : 6,
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
          )}
        </View>
      </ScrollView>

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
    </ThemedView>
  );
};

// Styles will be moved to separate file

export { UserManagement };

