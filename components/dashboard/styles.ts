import { Platform, StyleSheet } from 'react-native';

export const dashboardStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'web' ? 100 : 120, // Extra padding to prevent content from being cut off by bottom nav
  },
  header: {
    marginBottom: Platform.OS === 'web' ? 24 : 20,
    paddingBottom: Platform.OS === 'web' ? 16 : 12,
  },
  title: {
    fontSize: Platform.OS === 'web' ? 32 : 28,
    fontWeight: '700',
    marginBottom: Platform.OS === 'web' ? 8 : 6,
    fontFamily: 'Gabarito',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Platform.OS === 'web' ? 15 : 13,
    fontFamily: 'Gabarito',
    opacity: 0.7,
    lineHeight: Platform.OS === 'web' ? 20 : 18,
  },
  desktopLayout: {
    flex: 1,
    width: '100%',
  },
  desktopContentRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 20,
    alignItems: 'flex-start',
  },
  desktopLeftColumn: {
    flex: 1,
    minWidth: 0,
    gap: 20,
  },
  desktopRightColumn: {
    width: 400,
    flexShrink: 0,
  },
  desktopFullWidth: {
    width: '100%',
    gap: 20,
  },
  mobileLayout: {
    flex: 1,
    gap: Platform.OS === 'web' ? 20 : 16,
  },
});

