import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useBottomNavHeight } from '@/hooks/useBottomNavHeight';
import { useColorScheme } from '@/hooks/useColorScheme';
import { UserData } from '@/types/UserData';
import { UserType } from '@/types/UserType';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    View
} from 'react-native';
import { getAllUsers } from '../../firebase/auth';
import { UserCard } from './UserCard/UserCard';
import { UserHeader } from './UserHeader/UserHeader';
import { AddUserModal, UserDetailsModal } from './modals';
import { styles } from './styles/UserManagement.styles';

const UserManagement: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const bottomNavHeight = useBottomNavHeight();
  const { user, firebaseUser, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filterType, setFilterType] = useState<UserType | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

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
    // Only load users if user is authenticated
    if (user && firebaseUser && !authLoading) {
      fetchUsers();
    }
  }, [user, firebaseUser, authLoading]);

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

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = filterType === 'all' || user.userType === filterType;
      
      return matchesSearch && matchesFilter;
    });
  }, [users, searchQuery, filterType]);

  const handleUserPress = (user: UserData) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleCloseModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  const handleEditUser = (user: UserData) => {
    // TODO: Implement edit user functionality
    console.log('Edit user:', user);
    handleCloseModal();
  };

  const handleDeleteUser = (user: UserData) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.fullName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // TODO: Implement delete user functionality
            console.log('Delete user:', user);
            handleCloseModal();
          }
        }
      ]
    );
  };

  const handleAddUserPress = () => {
    setShowAddUserModal(true);
  };

  const handleCloseAddUserModal = () => {
    setShowAddUserModal(false);
  };

  const handleUserAdded = () => {
    // Refresh the users list when a new user is added
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
        onSignupPress={handleAddUserPress}
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
            filteredUsers.map((user: UserData) => (
              <UserCard
                key={user.id}
                user={user}
                onPress={handleUserPress}
                colors={colors}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        visible={showUserModal}
        onClose={handleCloseModal}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
      />

      {/* Add User Modal */}
      <AddUserModal
        visible={showAddUserModal}
        onClose={handleCloseAddUserModal}
        onUserAdded={handleUserAdded}
      />
    </ThemedView>
  );
};

// Styles will be moved to separate file

export { UserManagement };

