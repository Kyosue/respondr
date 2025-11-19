import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useScreenSize } from '@/hooks/useScreenSize';
import { UserData, UserStatus, UserType } from '@/firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface UsersTableProps {
  users: UserData[];
  onUserPress?: (user: UserData) => void;
  onEdit?: (user: UserData) => void;
  onDelete?: (user: UserData) => void;
  onToggleStatus?: (user: UserData) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canToggleStatus?: boolean;
}

function getUserTypeColor(userType: UserType): string {
  switch (userType) {
    case 'admin': return '#DC2626';
    case 'supervisor': return '#F59E0B';
    case 'operator': return '#3B82F6';
    default: return '#6B7280';
  }
}

function getUserTypeIcon(userType: UserType): string {
  switch (userType) {
    case 'admin': return 'shield-outline';
    case 'supervisor': return 'eye-outline';
    case 'operator': return 'person-outline';
    default: return 'person-outline';
  }
}

function getStatusColor(status: UserStatus | undefined): string {
  switch (status) {
    case 'active': return '#10B981';
    case 'inactive': return '#6B7280';
    case 'suspended': return '#EF4444';
    default: return '#10B981'; // Default to active
  }
}

function getStatusText(status: UserStatus | undefined): string {
  switch (status) {
    case 'active': return 'ACTIVE';
    case 'inactive': return 'INACTIVE';
    case 'suspended': return 'SUSPENDED';
    default: return 'ACTIVE';
  }
}

// Sort users by status first (active first, then inactive, then suspended)
// Then within each status group, sort by role (admin, supervisor, operator)
function sortUsersByStatusAndRole(users: UserData[]): UserData[] {
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

  return [...users].sort((a, b) => {
    // First, sort by status
    const statusA = a.status || 'active';
    const statusB = b.status || 'active';
    const statusDiff = statusOrder[statusA] - statusOrder[statusB];
    
    // If status is different, return the status difference
    if (statusDiff !== 0) {
      return statusDiff;
    }
    
    // If status is the same, sort by role (admin, supervisor, operator)
    return roleOrder[a.userType] - roleOrder[b.userType];
  });
}

export function UsersTable({ 
  users, 
  onUserPress,
  onEdit,
  onDelete,
  onToggleStatus,
  canEdit = false,
  canDelete = false,
  canToggleStatus = false
}: UsersTableProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isMobile } = useScreenSize();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sort users by status first (active first), then by role within each status group
  // Users are already sorted in UserManagement, so we just use them as-is
  const sortedUsers = useMemo(() => users, [users]);

  // Calculate pagination
  const totalItems = sortedUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);
  const showingCount = paginatedUsers.length;
  const startCount = startIndex + 1;
  const endCount = startIndex + showingCount;

  // Reset to page 1 if current page is out of bounds or when users list changes
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Reset to page 1 when users list changes (e.g., filters applied)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [users.length]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the start
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (users.length === 0) {
    return null;
  }

  if (isMobile) {
    return (
      <ThemedView style={[styles.card, styles.cardMobile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.headerSection}>
          <View style={styles.titleContainer}>
            <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="people" size={20} color={colors.primary} />
            </View>
            <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
              Users
            </ThemedText>
          </View>
          <ThemedText style={[styles.countBadge, { backgroundColor: colors.primary }]}>
            {users.length}
          </ThemedText>
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {users.map((user) => {
            const userTypeColor = getUserTypeColor(user.userType);
            const statusColor = getStatusColor(user.status);
            const statusText = getStatusText(user.status);

            return (
              <TouchableOpacity
                key={user.id}
                style={[styles.mobileItem, { borderColor: colors.border }]}
                onPress={() => onUserPress?.(user)}
                activeOpacity={0.7}
              >
                <View style={styles.mobileItemHeader}>
                  <View style={[styles.avatarContainer, { backgroundColor: `${userTypeColor}20` }]}>
                    {user.avatarUrl ? (
                      <View style={styles.avatarImage}>
                        <Ionicons name="person" size={20} color={userTypeColor} />
                      </View>
                    ) : (
                      <Ionicons 
                        name={getUserTypeIcon(user.userType) as any} 
                        size={20} 
                        color={userTypeColor} 
                      />
                    )}
                  </View>
                  <View style={styles.mobileTitleContainer}>
                    <ThemedText
                      style={[styles.mobileTitle, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {user.fullName}
                    </ThemedText>
                    <View style={styles.mobileMetaRow}>
                      <View style={[styles.typeBadge, { backgroundColor: `${userTypeColor}20` }]}>
                        <ThemedText style={[styles.typeText, { color: userTypeColor }]}>
                          {user.userType.toUpperCase()}
                        </ThemedText>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                        <ThemedText style={[styles.statusText, { color: statusColor }]}>
                          {statusText}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.mobileMeta}>
                  <View style={styles.mobileMetaItem}>
                    <Ionicons name="mail-outline" size={14} color={colors.text} style={{ opacity: 0.6, marginRight: 6 }} />
                    <ThemedText style={[styles.mobileText, { color: colors.text, opacity: 0.7 }]} numberOfLines={1}>
                      {user.email}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.mobileFooter}>
                  <View style={styles.mobileActions}>
                    {canEdit && onEdit && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.secondaryButton, { backgroundColor: `${colors.primary}20` }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          onEdit(user);
                        }}
                      >
                        <Ionicons name="create-outline" size={14} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                    {canToggleStatus && onToggleStatus && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.secondaryButton, { backgroundColor: `${statusColor}20` }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          onToggleStatus(user);
                        }}
                      >
                        <Ionicons 
                          name={user.status === 'active' ? 'pause-outline' : 'play-outline'} 
                          size={14} 
                          color={statusColor} 
                        />
                      </TouchableOpacity>
                    )}
                    {canDelete && onDelete && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.dangerButton, { backgroundColor: `${colors.error}20` }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          onDelete(user);
                        }}
                      >
                        <Ionicons name="trash-outline" size={14} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <View style={[styles.tableContainer, { borderColor: colors.border }]}>
      {/* Sticky Header */}
      <View style={[styles.tableHeader, { borderBottomColor: colors.border, backgroundColor: `${colors.primary}05` }]}>
        <View style={[styles.tableHeaderCell, styles.tableHeaderCellName]}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="person-outline" size={14} color={colors.text} style={{ opacity: 0.8, marginRight: 6 }} />
            <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
              User
            </ThemedText>
          </View>
        </View>
        <View style={styles.tableHeaderCell}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="mail-outline" size={14} color={colors.text} style={{ opacity: 0.8, marginRight: 6 }} />
            <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
              Email
            </ThemedText>
          </View>
        </View>
        <View style={styles.tableHeaderCell}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="shield-outline" size={14} color={colors.text} style={{ opacity: 0.8, marginRight: 6 }} />
            <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
              Role
            </ThemedText>
          </View>
        </View>
        <View style={styles.tableHeaderCell}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="checkmark-circle-outline" size={14} color={colors.text} style={{ opacity: 0.8, marginRight: 6 }} />
            <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
              Status
            </ThemedText>
          </View>
        </View>
        <View style={[styles.tableHeaderCell, styles.tableHeaderCellActions]}>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="settings-outline" size={14} color={colors.text} style={{ opacity: 0.8, marginRight: 6 }} />
            <ThemedText style={[styles.tableHeaderText, { color: colors.text }]}>
              Actions
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Scrollable Table Body */}
      <ScrollView 
        style={styles.tableBodyScroll}
        contentContainerStyle={styles.tableBodyContent}
        showsVerticalScrollIndicator={true}
      >
        {paginatedUsers.map((user, index) => {
        const userTypeColor = getUserTypeColor(user.userType);
        const statusColor = getStatusColor(user.status);
        const statusText = getStatusText(user.status);

        return (
          <TouchableOpacity
            key={user.id}
            style={[
              styles.tableRow,
              { 
                borderBottomColor: colors.border,
                backgroundColor: index % 2 === 0 ? 'transparent' : `${colors.primary}02`
              }
            ]}
            onPress={() => onUserPress?.(user)}
            activeOpacity={0.7}
          >
            <View style={[styles.tableCell, styles.tableCellName]}>
              <View style={styles.userNameCell}>
                <View style={[styles.avatarContainer, styles.tableAvatarContainer, { backgroundColor: `${userTypeColor}20` }]}>
                  {user.avatarUrl ? (
                    <View style={styles.avatarImage}>
                      <Ionicons name="person" size={18} color={userTypeColor} />
                    </View>
                  ) : (
                    <Ionicons 
                      name={getUserTypeIcon(user.userType) as any} 
                      size={18} 
                      color={userTypeColor} 
                    />
                  )}
                </View>
                <View style={styles.nameTextContainer}>
                  <ThemedText style={[styles.tableCellText, { color: colors.text }]} numberOfLines={1}>
                    {user.fullName}
                  </ThemedText>
                  {user.displayName !== user.fullName && (
                    <ThemedText style={[styles.tableCellSubtext, { color: colors.text, opacity: 0.6 }]} numberOfLines={1}>
                      {user.displayName}
                    </ThemedText>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.tableCell}>
              <ThemedText style={[styles.tableCellText, { color: colors.text, opacity: 0.8 }]} numberOfLines={1}>
                {user.email}
              </ThemedText>
            </View>
            <View style={styles.tableCell}>
              <View style={[styles.typeBadge, { backgroundColor: `${userTypeColor}20` }]}>
                <Ionicons name={getUserTypeIcon(user.userType) as any} size={12} color={userTypeColor} style={{ marginRight: 4 }} />
                <ThemedText style={[styles.typeText, { color: userTypeColor }]}>
                  {user.userType.toUpperCase()}
                </ThemedText>
              </View>
            </View>
            <View style={styles.tableCell}>
              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
                <ThemedText style={[styles.statusText, { color: statusColor }]}>
                  {statusText}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.tableCell, styles.tableCellActions]}>
              <View style={styles.actionsCell}>
                {canEdit && onEdit && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.iconButton, { backgroundColor: `${colors.primary}20` }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      onEdit(user);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.primary} />
                  </TouchableOpacity>
                )}
                {canToggleStatus && onToggleStatus && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.iconButton, { backgroundColor: `${statusColor}20` }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      onToggleStatus(user);
                    }}
                  >
                    <Ionicons 
                      name={user.status === 'active' ? 'pause-outline' : 'play-outline'} 
                      size={16} 
                      color={statusColor} 
                    />
                  </TouchableOpacity>
                )}
                {canDelete && onDelete && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.iconButton, { backgroundColor: `${colors.error}20` }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      onDelete(user);
                    }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
        })}
      </ScrollView>

      {/* Sticky Pagination Footer */}
      {totalPages > 1 && (
        <View style={[styles.paginationFooter, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          {/* Counter on the left */}
          <View style={styles.paginationCounter}>
            <ThemedText style={[styles.paginationCounterText, { color: colors.text }]}>
              {showingCount > 0 ? `${startCount}-${endCount}` : '0'} of {totalItems}
            </ThemedText>
          </View>

          {/* Pagination controls on the right */}
          <View style={styles.paginationControls}>
            <TouchableOpacity
              style={[
                styles.paginationButton,
                { 
                  backgroundColor: currentPage === 1 ? 'transparent' : `${colors.primary}20`,
                  borderColor: colors.border,
                  opacity: currentPage === 1 ? 0.5 : 1,
                }
              ]}
              onPress={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <Ionicons 
                name="chevron-back" 
                size={16} 
                color={currentPage === 1 ? colors.text : colors.primary} 
              />
            </TouchableOpacity>

            {getPageNumbers().map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <View key={`ellipsis-${index}`} style={styles.paginationEllipsis}>
                    <ThemedText style={[styles.paginationEllipsisText, { color: colors.text }]}>
                      ...
                    </ThemedText>
                  </View>
                );
              }

              const isActive = page === currentPage;
              return (
                <TouchableOpacity
                  key={page}
                  style={[
                    styles.paginationPageButton,
                    {
                      backgroundColor: isActive ? colors.primary : 'transparent',
                      borderColor: isActive ? colors.primary : colors.border,
                    }
                  ]}
                  onPress={() => handlePageChange(page as number)}
                >
                  <ThemedText
                    style={[
                      styles.paginationPageButtonText,
                      {
                        color: isActive ? '#FFFFFF' : colors.text,
                        fontWeight: isActive ? '700' : '500',
                      }
                    ]}
                  >
                    {page}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[
                styles.paginationButton,
                { 
                  backgroundColor: currentPage === totalPages ? 'transparent' : `${colors.primary}20`,
                  borderColor: colors.border,
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }
              ]}
              onPress={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <Ionicons 
                name="chevron-forward" 
                size={16} 
                color={currentPage === totalPages ? colors.text : colors.primary} 
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardMobile: {
    padding: 16,
    marginBottom: 16,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Gabarito',
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Gabarito',
  },
  tableContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
    minHeight: 400,
  },
  tableBodyScroll: {
    flex: 1,
  },
  tableBodyContent: {
    flexGrow: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    alignItems: 'center',
    position: 'sticky' as any,
    top: 0,
    zIndex: 10,
  },
  tableHeaderCell: {
    flex: 1,
    alignItems: 'flex-start',
  },
  tableHeaderCellName: {
    flex: 1.5,
  },
  tableHeaderCellActions: {
    flex: 1.2,
    alignItems: 'center',
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: 'Gabarito',
    opacity: 0.8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
    minHeight: 56,
  },
  tableCell: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  tableCellName: {
    flex: 1.5,
  },
  tableCellActions: {
    flex: 1.2,
    alignItems: 'center',
  },
  tableCellText: {
    fontSize: 14,
    fontFamily: 'Gabarito',
  },
  tableCellSubtext: {
    fontSize: 12,
    fontFamily: 'Gabarito',
    marginTop: 2,
  },
  userNameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableAvatarContainer: {
    width: 36,
    height: 36,
    marginRight: 10,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameTextContainer: {
    flex: 1,
    minWidth: 0,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    letterSpacing: 0.5,
  },
  actionsCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  secondaryButton: {
    // backgroundColor set dynamically
  },
  dangerButton: {
    // backgroundColor set dynamically
  },
  iconButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  scrollView: {
    flex: 1,
  },
  mobileItem: {
    padding: 16,
    borderBottomWidth: 1,
    marginBottom: 0,
    backgroundColor: 'transparent',
    borderRadius: 12,
    marginVertical: 6,
    borderWidth: 1,
  },
  mobileItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  mobileTitleContainer: {
    flex: 1,
    minWidth: 0,
  },
  mobileTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 22,
    marginBottom: 6,
  },
  mobileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  mobileMeta: {
    flexDirection: 'column',
    marginBottom: 12,
    gap: 8,
    paddingLeft: 50,
  },
  mobileMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mobileText: {
    fontSize: 13,
    fontFamily: 'Gabarito',
    flex: 1,
  },
  mobileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 50,
    gap: 8,
  },
  mobileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  paginationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    position: 'sticky' as any,
    bottom: 0,
    zIndex: 10,
  },
  paginationCounter: {
    flex: 1,
  },
  paginationCounterText: {
    fontSize: 13,
    fontFamily: 'Gabarito',
    opacity: 0.7,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginationButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationPageButton: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationPageButtonText: {
    fontSize: 13,
    fontFamily: 'Gabarito',
  },
  paginationEllipsis: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationEllipsisText: {
    fontSize: 13,
    fontFamily: 'Gabarito',
    opacity: 0.5,
  },
});

