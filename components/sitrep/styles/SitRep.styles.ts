import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  documentsContainer: {
    marginTop: -30,
    marginBottom: 20,
    paddingTop: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    ...Platform.select({
      web: {
        paddingHorizontal: 20,
        gap: 16,
      },
      default: {
        paddingHorizontal: 16,
        gap: 12,
      },
    }),
  },
  sectionContainer: {
    marginBottom: 24,
  },
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  documentsGridMobile: {
    flexDirection: 'column',
    gap: 0,
  },
  gridItem: {
    // Base styles - margin handled by specific variants
  },
  gridItemMobile: {
    width: '100%',
    marginBottom: 12,
  },
  gridItemDesktop: {
    flexShrink: 0,
    flexGrow: 0,
    minWidth: 200,
    marginBottom: 16,
  },
  documentGroup: {
    marginBottom: 8,
  },
  groupHeader: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 16,
    opacity: 0.8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 22,
  },
  multiSelectBar: {
    marginBottom: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  multiSelectContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  multiSelectActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
