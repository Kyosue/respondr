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
  resourcesContainer: {
    marginTop: 2,
    paddingTop: 2,
    ...Platform.select({
      web: {
        paddingHorizontal: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
      },
    }),
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
  loadMoreContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    ...Platform.select({
      web: {
        display: 'none',
      },
    }),
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
    ...Platform.select({
      web: {
        display: 'none',
      },
    }),
  },
  loadMoreText: {
    color: 'black',
    fontSize: 14,
    fontWeight: '600',
  },
  endOfListContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
    ...Platform.select({
      web: {
        display: 'none',
      },
    }),
  },
  endOfListText: {
    fontSize: 14,
    opacity: 0.6,
    fontWeight: '500',
  },
  // Web table pagination
  tablePaginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 0,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  tablePaginationInfo: {
    fontSize: 14,
    opacity: 0.85,
  },
  tablePaginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tablePaginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tablePaginationPageSize: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tablePaginationPageSizeOption: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    minWidth: 36,
    alignItems: 'center',
  },
  // Error banner with retry
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    gap: 12,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  errorBannerRetry: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  errorBannerRetryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Smaller "Loading more..." indicator (below list)
  loadingMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  loadingMoreRowText: {
    fontSize: 14,
    opacity: 0.7,
    fontWeight: '500',
  },
});
