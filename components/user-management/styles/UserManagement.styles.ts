import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        position: 'relative',
        zIndex: 0,
      },
    }),
  },
  scrollView: {
    flex: 1,
    ...Platform.select({
      web: {
        position: 'relative',
        zIndex: 0,
      },
    }),
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  usersContainer: {
    marginTop: 2,
    paddingTop: 8,
    zIndex: 0,
  },
  usersGrid: {
    paddingHorizontal: 16,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  userCardWrapper: {
    // This will be styled dynamically based on screen size
  },
  groupsContainer: {
    paddingHorizontal: 16,
    marginHorizontal: 0,
  },
  roleGroup: {
    marginBottom: 0,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  roleDivider: {
    height: 1,
    marginTop: 24,
    marginHorizontal: 16,
    opacity: 0.3,
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
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    textAlign: 'center',
    fontWeight: '600',
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
  accessDeniedContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  accessDeniedIcon: {
    marginBottom: 16,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  accessDeniedMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },
});
