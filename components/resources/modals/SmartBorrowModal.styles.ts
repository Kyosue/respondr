import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  overlayCloseButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  container: {
    width: '100%',
    maxWidth: 800,
    maxHeight: '90%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2,
  },
  modalContent: {
    flex: 1,
  },
  mobileContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  mobileContentContainer: {
    flex: 1,
    ...Platform.select({
      default: {
        // On mobile, ensure proper flex layout for header, content, and footer
        flexDirection: 'column',
      },
    }),
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    justifyContent: 'center',
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  stepDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    minWidth: 80,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: {
        paddingBottom: 16,
      },
      default: {
        paddingBottom: 12,
        // Ensure footer is always visible on mobile
        minHeight: 75,
      },
    }),
  },
  footerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    justifyContent: 'space-between',
  },
  footerButtonContainer: {
    flex: 1,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    gap: 8,
  },
  addMoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  resourcesSectionHeader: {
    marginBottom: 16,
  },
  resourcesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  resourceCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  resourceImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  resourceImage: {
    width: '100%',
    height: '100%',
  },
  resourceCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceCategory: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  availabilityInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderRadius: 8,
  },
  availabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  availabilityLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  availabilityValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    ...Platform.select({
      ios: {
        // On iOS, allow suggestions to extend beyond the scroll view
        overflow: 'visible',
      },
      default: {
        // On Android, prevent content from showing behind status bar
        overflow: 'hidden',
      },
    }),
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
  },
  step2Wrapper: {
    flex: 1,
    padding: 16,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resourceDetails: {
    flex: 1,
  },
  resourceName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  addResourcesSection: {
    marginTop: 16,
  },
  resourcesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resourcesHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewModeToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
  },
  viewModeButton: {
    padding: 8,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 36,
  },
  viewModeButtonLeft: {
    borderRightWidth: 1,
  },
  viewModeButtonRight: {
    borderLeftWidth: 0,
  },
  addResourcesTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  searchFiltersContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 40,
    paddingVertical: 12,
    fontSize: 16,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 12,
    opacity: 0.7,
  },
  sortScroll: {
    flex: 1,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  resourcesScrollContainer: {
    marginBottom: 16,
    ...Platform.select({
      default: {
        // On mobile, make it scrollable - takes remaining space
        flex: 1,
        minHeight: '95%',
      },
      web: {
        maxHeight: 360,
      },
    }),
  },
  resourcesScroll: {
    flex: 1,
    ...Platform.select({
      default: {
        // Enable scrolling on mobile
      },
    }),
  },
  resourcesGridContent: {
    paddingHorizontal: 4,
    ...Platform.select({
      default: {
        paddingBottom: 8,
      },
    }),
  },
  resourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    ...Platform.select({
      web: {
        justifyContent: 'space-between',
        paddingHorizontal: 4,
      },
      default: {
        justifyContent: 'space-between',
        paddingHorizontal: 2,
      },
    }),
  },
  resourceGridCard: {
    ...Platform.select({
      web: {
        width: '31%',
        minHeight: 180,
        justifyContent: 'flex-start',
      },
      default: {
        width: '48%',
        minHeight: 170,
        justifyContent: 'flex-start',
      },
    }),
    padding: 14,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      default: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  resourceGridImageContainer: {
    ...Platform.select({
      web: {
        width: 70,
        height: 70,
        borderRadius: 14,
        marginBottom: 12,
      },
      default: {
        width: 64,
        height: 64,
        borderRadius: 12,
        marginBottom: 10,
      },
    }),
    overflow: 'hidden',
  },
  resourceGridImage: {
    width: '100%',
    height: '100%',
  },
  resourceGridIconContainer: {
    ...Platform.select({
      web: {
        width: 70,
        height: 70,
        borderRadius: 35,
      },
      default: {
        width: 64,
        height: 64,
        borderRadius: 32,
      },
    }),
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceCardContent: {
    width: '100%',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resourceCardName: {
    ...Platform.select({
      web: {
        fontSize: 15,
        lineHeight: 20,
        marginBottom: 8,
      },
      default: {
        fontSize: 14,
        lineHeight: 18,
        marginBottom: 8,
        minHeight: 36,
      },
    }),
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  resourceCardMeta: {
    width: '100%',
    marginBottom: 8,
    alignItems: 'center',
  },
  resourceCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  resourceCategoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  resourceAvailabilityContainer: {
    width: '100%',
    marginTop: 'auto',
    alignItems: 'center',
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  resourceQuantity: {
    ...Platform.select({
      web: {
        fontSize: 13,
      },
      default: {
        fontSize: 12,
      },
    }),
    textAlign: 'center',
    fontWeight: '600',
  },
  resourcesList: {
    width: '100%',
  },
  resourceListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    ...Platform.select({
      web: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      default: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  resourceListImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 10,
    marginRight: 12,
    overflow: 'hidden',
  },
  resourceListImage: {
    width: '100%',
    height: '100%',
  },
  resourceListIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  resourceListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  resourceListItemName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  resourceListMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resourceListDescription: {
    fontSize: 12,
    flex: 1,
  },
  resourceListAction: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResourcesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  noResourcesText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  transactionInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  termsContainer: {
    borderRadius: 8,
    padding: 16,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});

