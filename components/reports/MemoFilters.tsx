import { Ionicons } from '@expo/vector-icons';
import { Animated, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';
import { MemoFilter } from '@/types/MemoDocument';

interface MemoFiltersProps {
  visible: boolean;
  filters: MemoFilter;
  onFilterChange: (filters: MemoFilter) => void;
  onClose: () => void;
}

export function MemoFilters({ visible, filters, onFilterChange, onClose }: MemoFiltersProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Hybrid RAMP hook for animations
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose: rampHandleClose } = useHybridRamp({
    visible,
    onClose,
  });

  const updateFilter = (key: keyof MemoFilter, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  if (!visible) return null;

  const agencyLevels = [
    { value: 'national', label: 'National', icon: 'flag' },
    { value: 'regional', label: 'Regional', icon: 'location' },
    { value: 'provincial', label: 'Provincial', icon: 'map' },
    { value: 'municipal', label: 'Municipal', icon: 'business' },
    { value: 'barangay', label: 'Barangay', icon: 'home' },
  ];

  const documentTypes = [
    { value: 'memorandum', label: 'Memorandum' },
    { value: 'circular', label: 'Circular' },
    { value: 'advisory', label: 'Advisory' },
    { value: 'directive', label: 'Directive' },
    { value: 'executive-order', label: 'Executive Order' },
    { value: 'ordinance', label: 'Ordinance' },
    { value: 'policy', label: 'Policy' },
  ];

  const priorities = [
    { value: 'urgent', label: 'Urgent', color: '#FF3B30' },
    { value: 'high', label: 'High', color: '#FF9500' },
    { value: 'normal', label: 'Normal', color: '#34C759' },
    { value: 'low', label: 'Low', color: '#8E8E93' },
  ];

  // Platform-specific modal rendering
  if (isWeb) {
    // Hybrid RAMP implementation for web
    return (
      <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={rampHandleClose}>
        <Animated.View style={[styles.overlayWeb, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.overlayCloseButton} onPress={rampHandleClose} activeOpacity={0.7} />
          <Animated.View
              style={[
              styles.containerWeb,
              { backgroundColor: colors.background },
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
              },
            ]}
          >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Filters</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Search</Text>
          <View style={[styles.searchContainer, { borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.tabIconDefault} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search documents..."
              placeholderTextColor={colors.tabIconDefault}
              value={filters.searchQuery || ''}
              onChangeText={(text) => updateFilter('searchQuery', text)}
            />
            {filters.searchQuery && (
              <TouchableOpacity onPress={() => updateFilter('searchQuery', undefined)}>
                <Ionicons name="close-circle" size={20} color={colors.tabIconDefault} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Agency Level */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Agency Level</Text>
          <View style={styles.buttonContainer}>
            {agencyLevels.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor:
                      filters.agencyLevel === level.value ? colors.tint : 'transparent',
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  if (filters.agencyLevel === level.value) {
                    updateFilter('agencyLevel', undefined);
                  } else {
                    updateFilter('agencyLevel', level.value);
                  }
                }}
              >
                <Ionicons
                  name={level.icon as any}
                  size={16}
                  color={filters.agencyLevel === level.value ? '#fff' : colors.text}
                />
                <Text
                  style={[
                    styles.filterButtonText,
                    {
                      color: filters.agencyLevel === level.value ? '#fff' : colors.text,
                    },
                  ]}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Document Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Document Type</Text>
          <View style={styles.checkboxContainer}>
            {documentTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={styles.checkboxRow}
                onPress={() => {
                  if (filters.documentType === type.value) {
                    updateFilter('documentType', undefined);
                  } else {
                    updateFilter('documentType', type.value);
                  }
                }}
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: colors.border,
                      backgroundColor: filters.documentType === type.value ? colors.tint : 'transparent',
                    },
                  ]}
                >
                  {filters.documentType === type.value && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Priority */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Priority</Text>
          <View style={styles.buttonContainer}>
            {priorities.map((priority) => (
              <TouchableOpacity
                key={priority.value}
                style={[
                  styles.priorityButton,
                  {
                    backgroundColor:
                      filters.priority === priority.value ? priority.color : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => {
                  if (filters.priority === priority.value) {
                    updateFilter('priority', undefined);
                  } else {
                    updateFilter('priority', priority.value);
                  }
                }}
              >
                <Text
                  style={[
                    styles.priorityButtonText,
                    {
                      color: filters.priority === priority.value ? '#fff' : colors.text,
                    },
                  ]}
                >
                  {priority.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Clear Filters */}
        <TouchableOpacity
          style={[styles.clearButton, { backgroundColor: colors.surface }]}
          onPress={() => onFilterChange({})}
        >
          <Ionicons name="refresh" size={18} color={colors.tint} />
          <Text style={[styles.clearButtonText, { color: colors.tint }]}>Clear All Filters</Text>
        </TouchableOpacity>
      </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }

  // Mobile bottom sheet implementation
  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Filters</Text>
            <TouchableOpacity onPress={rampHandleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Search */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Search</Text>
              <View style={[styles.searchContainer, { borderColor: colors.border }]}>
                <Ionicons name="search" size={20} color={colors.tabIconDefault} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Search documents..."
                  placeholderTextColor={colors.tabIconDefault}
                  value={filters.searchQuery || ''}
                  onChangeText={(text) => updateFilter('searchQuery', text)}
                />
                {filters.searchQuery && (
                  <TouchableOpacity onPress={() => updateFilter('searchQuery', undefined)}>
                    <Ionicons name="close-circle" size={20} color={colors.tabIconDefault} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Agency Level */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Agency Level</Text>
              <View style={styles.buttonContainer}>
                {agencyLevels.map((level) => (
                  <TouchableOpacity
                    key={level.value}
                    style={[
                      styles.filterButton,
                      {
                        backgroundColor:
                          filters.agencyLevel === level.value ? colors.tint : 'transparent',
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      if (filters.agencyLevel === level.value) {
                        updateFilter('agencyLevel', undefined);
                      } else {
                        updateFilter('agencyLevel', level.value);
                      }
                    }}
                  >
                    <Ionicons
                      name={level.icon as any}
                      size={16}
                      color={filters.agencyLevel === level.value ? '#fff' : colors.text}
                    />
                    <Text
                      style={[
                        styles.filterButtonText,
                        {
                          color: filters.agencyLevel === level.value ? '#fff' : colors.text,
                        },
                      ]}
                    >
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Document Type */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Document Type</Text>
              <View style={styles.checkboxContainer}>
                {documentTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    style={styles.checkboxRow}
                    onPress={() => {
                      if (filters.documentType === type.value) {
                        updateFilter('documentType', undefined);
                      } else {
                        updateFilter('documentType', type.value);
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: colors.border,
                          backgroundColor: filters.documentType === type.value ? colors.tint : 'transparent',
                        },
                      ]}
                    >
                      {filters.documentType === type.value && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </View>
                    <Text style={[styles.checkboxLabel, { color: colors.text }]}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Priority */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Priority</Text>
              <View style={styles.buttonContainer}>
                {priorities.map((priority) => (
                  <TouchableOpacity
                    key={priority.value}
                    style={[
                      styles.priorityButton,
                      {
                        backgroundColor:
                          filters.priority === priority.value ? priority.color : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => {
                      if (filters.priority === priority.value) {
                        updateFilter('priority', undefined);
                      } else {
                        updateFilter('priority', priority.value);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.priorityButtonText,
                        {
                          color: filters.priority === priority.value ? '#fff' : colors.text,
                        },
                      ]}
                    >
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Clear Filters */}
            <TouchableOpacity
              style={[styles.clearButton, { backgroundColor: colors.surface }]}
              onPress={() => onFilterChange({})}
            >
              <Ionicons name="refresh" size={18} color={colors.tint} />
              <Text style={[styles.clearButtonText, { color: colors.tint }]}>Clear All Filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayWeb: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayCloseButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    overflow: 'hidden',
    minHeight: 400,
  },
  containerWeb: {
    width: '90%',
    maxWidth: 600,
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkboxContainer: {
    gap: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 15,
  },
  priorityButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 32,
    gap: 8,
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

