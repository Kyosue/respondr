import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  header: {
    paddingTop: 0,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 2,
  },
  subheader: {
    marginTop: 2,
    opacity: 0.8,
    fontSize: 13,
    lineHeight: 18,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    height: 44,
    paddingHorizontal: 16,
    paddingLeft: 48,
    paddingRight: 48,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  clearSearchButton: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  categoriesContainer: {
    marginBottom: 12,
    paddingVertical: 2,
    position: 'relative',
    zIndex: 10000,
  },
  categoriesContent: {
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 1,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // New filter button styles
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 1,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Dropdown styles
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 16,
    right: 16,
    zIndex: 99999,
    maxHeight: 600,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 24,
      },
      web: {
        zIndex: 99999,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
    }),
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'left',
    flex: 1,
    letterSpacing: 0.3,
  },
  dropdownIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 0,
        backgroundColor: 'transparent',
        borderWidth: 0.5,
        borderColor: 'rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    letterSpacing: 0.2,
  },
  // Clear filters button styles
  clearFiltersButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 1,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
  },
});