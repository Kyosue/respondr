import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  header: {
    paddingTop: 0,
    ...Platform.select({
      web: {
        backgroundColor: 'transparent',
        position: 'relative',
        zIndex: 10,
      },
    }),
  },
  headerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  headerTitleSection: {
    flex: 1,
    paddingRight: 16,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subheader: {
    marginTop: 2,
    opacity: 0.75,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  headerActionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    minHeight: 44,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  signupButtonText: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.2,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
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
  searchSection: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  filtersSection: {
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
    zIndex: 10,
    position: 'relative',
    marginBottom: 4,
    ...Platform.select({
      web: {
        position: 'relative',
        zIndex: 10,
        backgroundColor: 'transparent',
        marginBottom: 8,
      },
    }),
  },
  // Legacy styles - keeping for backward compatibility with UserSearch component
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
      web: {
        outlineStyle: 'none',
        outlineWidth: 0,
      },
    }),
  },
  clearSearchButton: {
    position: 'absolute',
    right: 16,
    zIndex: 1,
    padding: 4,
  },
  filtersContainer: {
    marginBottom: 12,
    paddingVertical: 2,
    zIndex: 1000,
    position: 'relative',
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        position: 'relative',
        zIndex: 1000,
        isolation: 'isolate',
      },
    }),
  },
  filtersContent: {
    paddingHorizontal: 4,
    alignItems: 'center',
  },
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
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Enhanced filter styles
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
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
  // Dropdown styles
  dropdownContainer: {
    position: 'absolute',
    top: 50,
    left: 4,
    right: 4,
    borderRadius: 12,
    maxHeight: 200,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 20,
      },
      web: {
        zIndex: 9999,
        position: 'absolute',
        isolation: 'isolate',
      },
    }),
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  dropdownIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  dropdownItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
});
