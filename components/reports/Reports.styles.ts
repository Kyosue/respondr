import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,

  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
    position: 'relative',
    zIndex: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonWrapper: {
    marginLeft: -8,
  },
  documentGroup: {
    marginBottom: 12,
    ...Platform.select({
      web: {
        marginBottom: 32,
      },
    }),
  },
  groupHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    opacity: 0.8,
    ...Platform.select({
      web: {
        paddingHorizontal: 20,
      },
      default: {
        paddingHorizontal: 16,
      },
    }),
  },
  documentsSectionContainer: {
    ...Platform.select({
      web: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: 16,
        paddingHorizontal: 20,
      },
      default: {
        paddingHorizontal: 16,
      },
    }),
  },
  filtersContainer: {
    borderBottomWidth: 1,
    maxHeight: 400,
  },
  filtersSection: {
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
    zIndex: 10,
    position: 'relative',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 70,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
  },
  documentsList: {
    paddingBottom: 20,
  },
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'flex-start',
    alignSelf: 'center',
  },
  documentItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    ...Platform.select({
      ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.2s ease',
      },
    }),
    position: 'relative',
  },
  documentItemSelected: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF5010',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)',
      },
    }),
  },
  documentCard: {
    width: 280,
    flexDirection: 'column',
    marginBottom: 0,
    padding: 14,
    minHeight: 140,
  },
  documentIcon: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 10,
    flexShrink: 0,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 20,
  },
  documentMeta: {
    fontSize: 12,
    marginBottom: 8,
    opacity: 0.7,
  },
  documentBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  documentDate: {
    fontSize: 11,
    marginLeft: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  moreButton: {
    justifyContent: 'center',
    paddingLeft: 8,
    padding: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    flex: 1,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 0,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
      },
    }),
  },
  multiSelectBar: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 12,
  },
  multiSelectContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  selectedCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  multiSelectActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  searchSection: {
    marginBottom: 16,
    paddingHorizontal: 20,
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
});

