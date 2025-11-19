import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePlatform } from '@/hooks/usePlatform';

import { Agency, ResourceCategory, ResourceCondition, ResourceStatus } from '@/types/Resource';
import { ResourceActiveFilterTags } from './ResourceActiveFilterTags';
import { ResourceFilterPopover, ResourceSortOption } from './ResourceFilterPopover';
import { styles } from './ResourceHeader.styles';
import { ResourceSearch } from './ResourceSearch';

interface ResourceHeaderProps {
  showSearch: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchToggle: () => void;
  onAddResource: () => void;
  showAddButton?: boolean;
  onMultiBorrow: () => void;
  onBorrowerDashboard: () => void;
  onClearSearch: () => void;
  selectedCategory?: ResourceCategory;
  selectedAgency?: string;
  selectedResourceType?: 'pdrrmo' | 'external';
  selectedStatus?: ResourceStatus;
  selectedCondition?: ResourceCondition;
  onCategorySelect?: (category: ResourceCategory | undefined) => void;
  onAgencySelect?: (agencyId: string | undefined) => void;
  onResourceTypeSelect?: (type: 'pdrrmo' | 'external' | undefined) => void;
  onStatusSelect?: (status: ResourceStatus | undefined) => void;
  onConditionSelect?: (condition: ResourceCondition | undefined) => void;
  selectedSort?: ResourceSortOption;
  onSortSelect?: (sort: ResourceSortOption) => void;
  onClearFilters?: () => void;
  agencies?: Agency[];
}

export function ResourceHeader({
  showSearch,
  searchQuery,
  onSearchChange,
  onSearchToggle,
  onAddResource,
  showAddButton = true,
  onMultiBorrow,
  onBorrowerDashboard,
  onClearSearch,
  selectedCategory,
  selectedAgency,
  selectedResourceType,
  selectedStatus,
  selectedCondition,
  selectedSort,
  onSortSelect,
  onCategorySelect,
  onAgencySelect,
  onResourceTypeSelect,
  onStatusSelect,
  onConditionSelect,
  onClearFilters,
  agencies
}: ResourceHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isWeb } = usePlatform();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.headerTitleContainer}>
          <ThemedText type="subtitle" style={styles.headerTitle}>Resources</ThemedText>
          <ThemedText style={styles.subheader}>Manage and track available resources</ThemedText>
        </View>
        <View style={styles.headerActions}>
          {showAddButton && (
            <TouchableOpacity 
              style={[styles.headerButton, { 
                backgroundColor: colors.primary,
                borderColor: colors.primary,
              }]}
              onPress={onAddResource}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          )}
          
          {/* Show all buttons on desktop, group some in "More" menu on mobile */}
          {isWeb ? (
            <>
          <TouchableOpacity 
            style={[styles.headerButton, { 
              backgroundColor: colors.success,
              borderColor: colors.success,
            }]}
            onPress={onMultiBorrow}
            activeOpacity={0.8}
          >
             <Ionicons name="layers" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.headerButton, { 
              backgroundColor: colors.warning,
              borderColor: colors.warning,
            }]}
            onPress={onBorrowerDashboard}
            activeOpacity={0.8}
          >
            <Ionicons name="people" size={16} color="#fff" />
          </TouchableOpacity>
            </>
          ) : (
            <>
              {/* More menu button on mobile */}
              <TouchableOpacity 
                style={[styles.headerButton, { 
                  backgroundColor: colors.surface, 
                  borderColor: colors.border,
                }]}
                onPress={() => setShowMoreMenu(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="ellipsis-horizontal" size={16} color={colors.text} />
              </TouchableOpacity>
              
              {/* More Menu Modal */}
              <Modal
                visible={showMoreMenu}
                transparent
                animationType="fade"
                onRequestClose={() => setShowMoreMenu(false)}
              >
                <TouchableWithoutFeedback onPress={() => setShowMoreMenu(false)}>
                  <View style={styles.moreMenuOverlay}>
                    <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                      <View style={[styles.moreMenuContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <TouchableOpacity
                          style={[styles.moreMenuItem, { borderBottomColor: colors.border }]}
                          onPress={() => {
                            onMultiBorrow();
                            setShowMoreMenu(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.moreMenuIcon, { backgroundColor: colors.success + '20' }]}>
                            <Ionicons name="layers" size={20} color={colors.success} />
                          </View>
                          <View style={styles.moreMenuTextContainer}>
                            <ThemedText style={[styles.moreMenuTitle, { color: colors.text }]}>Multi Borrow</ThemedText>
                            <ThemedText style={[styles.moreMenuSubtitle, { color: colors.text + '80' }]}>Borrow multiple resources</ThemedText>
                          </View>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.moreMenuItem}
                          onPress={() => {
                            onBorrowerDashboard();
                            setShowMoreMenu(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.moreMenuIcon, { backgroundColor: colors.warning + '20' }]}>
                            <Ionicons name="people" size={20} color={colors.warning} />
                          </View>
                          <View style={styles.moreMenuTextContainer}>
                            <ThemedText style={[styles.moreMenuTitle, { color: colors.text }]}>Borrower Dashboard</ThemedText>
                            <ThemedText style={[styles.moreMenuSubtitle, { color: colors.text + '80' }]}>View borrower information</ThemedText>
                          </View>
                        </TouchableOpacity>
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            </>
          )}
          
          <TouchableOpacity 
            style={[styles.headerButton, { 
              backgroundColor: colors.surface, 
              borderColor: colors.border,
            }]}
            onPress={onSearchToggle}
            activeOpacity={0.8}
          >
            <Ionicons name={showSearch ? "close" : "search"} size={16} color={colors.text} />
          </TouchableOpacity>
          
          <ResourceFilterPopover 
            selectedCategory={selectedCategory}
            selectedAgency={selectedAgency}
            selectedResourceType={selectedResourceType}
            selectedStatus={selectedStatus}
            selectedCondition={selectedCondition}
            selectedSort={selectedSort}
            onSortSelect={onSortSelect}
            onCategorySelect={onCategorySelect}
            onAgencySelect={onAgencySelect}
            onResourceTypeSelect={onResourceTypeSelect}
            onStatusSelect={onStatusSelect}
            onConditionSelect={onConditionSelect}
            agencies={agencies}
          />
        </View>
      </View>
      
      {showSearch && (
        <ResourceSearch
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onClearSearch={onClearSearch}
        />
      )}
      
      {/* Active Filter Tags Section */}
      <View style={styles.filtersSection}>
        <ResourceActiveFilterTags
        selectedCategory={selectedCategory}
        selectedAgency={selectedAgency}
        selectedResourceType={selectedResourceType}
        selectedStatus={selectedStatus}
        selectedCondition={selectedCondition}
          selectedSort={selectedSort}
          onSortSelect={onSortSelect}
        onCategorySelect={onCategorySelect}
        onAgencySelect={onAgencySelect}
        onResourceTypeSelect={onResourceTypeSelect}
        onStatusSelect={onStatusSelect}
        onConditionSelect={onConditionSelect}
        onClearFilters={onClearFilters}
        agencies={agencies}
      />
      </View>
    </View>
  );
}
