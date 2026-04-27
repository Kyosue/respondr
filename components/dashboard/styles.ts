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
    paddingBottom: Platform.OS === 'web' ? 20 : 108,
    flexGrow: 1,
  },
  header: {
    marginBottom: Platform.OS === 'web' ? 16 : 14,
  },
  webHeaderCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: Platform.OS === 'web' ? 30 : 24,
    fontWeight: '700',
    marginBottom: Platform.OS === 'web' ? 4 : 3,
    fontFamily: 'Gabarito',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: Platform.OS === 'web' ? 14 : 12,
    fontFamily: 'Gabarito',
    opacity: 0.7,
    lineHeight: Platform.OS === 'web' ? 18 : 16,
  },
  bentoGrid: {
    width: '100%',
    gap: Platform.OS === 'web' ? 14 : 16,
  },
  bentoTileFull: {
    width: '100%',
  },
  bentoMainRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Platform.OS === 'web' ? 14 : 16,
    alignItems: 'stretch',
  },
  bentoTileTall: {
    flex: Platform.OS === 'web' ? 1.3 : 1,
    minWidth: 0,
  },
  bentoRightColumn: {
    flex: 1,
    minWidth: 0,
    gap: Platform.OS === 'web' ? 10 : 12,
    justifyContent: 'flex-start',
  },
  bentoTileTopRight: {
    width: '100%',
  },
  bentoTileBottomRight: {
    width: '100%',
  },
  mobileLayout: {
    flex: 1,
    gap: Platform.OS === 'web' ? 16 : 14,
  },
});

