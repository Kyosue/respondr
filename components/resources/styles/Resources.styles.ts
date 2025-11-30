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
});
