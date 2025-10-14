import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

import { Agency, ResourceCategory, ResourceCondition, ResourceStatus } from '@/types/Resource';
import { ResourceFilters } from './ResourceFilters';
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
              <Ionicons name="cube-outline" size={18} color="#fff" />
            </TouchableOpacity>
          )}
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
        </View>
      </View>
      
      {showSearch && (
        <ResourceSearch
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onClearSearch={onClearSearch}
        />
      )}
      
      <ResourceFilters 
        selectedCategory={selectedCategory}
        selectedAgency={selectedAgency}
        selectedResourceType={selectedResourceType}
        selectedStatus={selectedStatus}
        selectedCondition={selectedCondition}
        onCategorySelect={onCategorySelect}
        onAgencySelect={onAgencySelect}
        onResourceTypeSelect={onResourceTypeSelect}
        onStatusSelect={onStatusSelect}
        onConditionSelect={onConditionSelect}
        onClearFilters={onClearFilters}
        agencies={agencies}
      />
    </View>
  );
}
