import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    position: 'relative',
    ...Platform.select({
      web: {
        zIndex: 10000,
      },
      default: {
        zIndex: 1000,
      },
    }),
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative',
    marginLeft: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Gabarito',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  activeFilterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  activeFilterTagText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    marginRight: 6,
  },
  activeFilterTagClose: {
    padding: 2,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Gabarito',
  },
  popoverOverlay: {
    ...Platform.select({
      web: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99998,
        backgroundColor: 'transparent',
      },
      default: {},
    }),
  },
  popoverWrapper: {
    ...Platform.select({
      web: {
        position: 'absolute',
        top: '100%',
        right: 0,
        marginTop: 8,
        zIndex: 99999,
        minWidth: 320,
        maxWidth: 400,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      },
      default: {},
    }),
  },
  popoverContainer: {
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 600,
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
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        zIndex: 99999,
        position: 'relative',
      },
    }),
  },
  popoverHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  popoverTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Gabarito',
  },
  popoverContent: {
    maxHeight: 400,
  },
  filterSection: {
    borderBottomWidth: 1,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  filterSectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Gabarito',
  },
  filterSectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Gabarito',
  },
  filterOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  filterOptionContent: {
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
  filterOptionText: {
    fontSize: 14,
    fontFamily: 'Gabarito',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 12,
    overflow: 'hidden',
  },
});

