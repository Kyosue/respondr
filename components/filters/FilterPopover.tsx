import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { usePlatform } from '@/hooks/usePlatform';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { styles } from './FilterPopover.styles';

export interface FilterOption {
  value: string;
  label: string;
  icon?: string;
  color?: string;
}

export interface FilterSection {
  id: string;
  title: string;
  icon: string;
  options: FilterOption[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
}

interface FilterPopoverProps {
  sections: FilterSection[];
  activeFilterCount?: number;
  showActiveFilters?: boolean;
}

interface FilterSectionProps {
  title: string;
  icon: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
}

function FilterSectionComponent({
  title,
  icon,
  isExpanded,
  onToggle,
  children,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
}: FilterSectionProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.filterSection, { borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={styles.filterSectionHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={styles.filterSectionTitleContainer}>
          <Ionicons
            name={icon as any}
            size={18}
            color={colors.text}
            style={{ marginRight: 8, opacity: 0.7 }}
          />
          <ThemedText style={[styles.filterSectionTitle, { color: colors.text }]}>
            {title}
          </ThemedText>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
          size={18}
          color={colors.text}
          style={{ opacity: 0.5 }}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.filterSectionContent}>
          {onSearchChange && (
            <View style={[styles.searchInputContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Ionicons name="search-outline" size={16} color={colors.text} style={{ opacity: 0.5, marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={searchPlaceholder || 'Search...'}
                placeholderTextColor={colors.text + '80'}
                value={searchQuery}
                onChangeText={onSearchChange}
              />
            </View>
          )}
          {children}
        </View>
      )}
    </View>
  );
}

interface FilterOptionProps {
  label: string;
  value: string;
  icon?: string;
  isSelected: boolean;
  onSelect: () => void;
  color?: string;
}

function FilterOptionComponent({ label, value, icon, isSelected, onSelect, color }: FilterOptionProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const optionColor = color || colors.primary;

  return (
    <TouchableOpacity
      style={[
        styles.filterOption,
        {
          backgroundColor: isSelected ? `${optionColor}15` : 'transparent',
          borderColor: isSelected ? optionColor : colors.border,
        },
      ]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.filterOptionContent}>
        <View
          style={[
            styles.checkbox,
            {
              borderColor: isSelected ? optionColor : colors.border,
              backgroundColor: isSelected ? optionColor : 'transparent',
            },
          ]}
        >
          {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        {icon && (
          <Ionicons
            name={icon as any}
            size={16}
            color={isSelected ? optionColor : colors.text}
            style={{ marginRight: 8, opacity: isSelected ? 1 : 0.6 }}
          />
        )}
        <ThemedText
          style={[
            styles.filterOptionText,
            {
              color: isSelected ? colors.text : colors.text,
              fontWeight: isSelected ? '600' : '400',
            },
          ]}
        >
          {label}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
}

export function FilterPopover({
  sections,
  activeFilterCount = 0,
  showActiveFilters = false,
}: FilterPopoverProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isWeb } = usePlatform();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleSearchChange = (sectionId: string, query: string) => {
    setSearchQueries((prev) => ({
      ...prev,
      [sectionId]: query,
    }));
  };

  const getFilteredOptions = (section: FilterSection): FilterOption[] => {
    const searchQuery = searchQueries[section.id] || '';
    if (!searchQuery || !section.searchable) {
      return section.options;
    }
    return section.options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const popoverContent = (
    <View style={[styles.popoverContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={[styles.popoverHeader, { borderBottomColor: colors.border }]}>
        <ThemedText style={[styles.popoverTitle, { color: colors.text }]}>Filters</ThemedText>
      </View>

      {/* Filter Sections */}
      <ScrollView style={styles.popoverContent} showsVerticalScrollIndicator={false}>
        {sections.map((section) => {
          const filteredOptions = getFilteredOptions(section);
          return (
            <FilterSectionComponent
              key={section.id}
              title={section.title}
              icon={section.icon}
              isExpanded={expandedSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
              searchQuery={searchQueries[section.id]}
              onSearchChange={section.searchable ? (query) => handleSearchChange(section.id, query) : undefined}
              searchPlaceholder={section.searchPlaceholder}
            >
              {filteredOptions.map((option) => (
                <FilterOptionComponent
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  icon={option.icon}
                  isSelected={section.selectedValue === option.value}
                  onSelect={() => section.onSelect(option.value)}
                  color={option.color}
                />
              ))}
            </FilterSectionComponent>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Filter Button */}
      <TouchableOpacity
        style={[styles.filterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.8}
      >
        <Ionicons name="filter-outline" size={16} color={colors.text} />
        {activeFilterCount > 0 && (
          <View style={[styles.filterBadge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
            <ThemedText style={styles.filterBadgeText}>{activeFilterCount}</ThemedText>
          </View>
        )}
      </TouchableOpacity>

      {/* Popover */}
      {isWeb ? (
        // Web: Positioned popover
        isOpen && (
          <>
            <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
              <View style={styles.popoverOverlay} />
            </TouchableWithoutFeedback>
            <View style={styles.popoverWrapper}>{popoverContent}</View>
          </>
        )
      ) : (
        // Mobile: Modal
        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsOpen(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContent}>{popoverContent}</View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
}

