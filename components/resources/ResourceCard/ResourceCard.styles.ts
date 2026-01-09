import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  resourceCard: {
    marginHorizontal: 5,
    marginVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        marginHorizontal: 8,
        marginVertical: 8,
        width: 350,
        display: 'flex',
        flexDirection: 'column',
      },
    }),
  },
  cardContent: {
    flexDirection: 'column',
    padding: 10,
    paddingVertical: 10,
  },
  mainSection: {
    flexDirection: 'row',
  },
  imageContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 10,
    flexShrink: 0,
    
  },
  resourceImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentSection: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 6,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    minWidth: 0,
    ...Platform.select({
      web: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
    }),
  },
  conditionChip: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    flexShrink: 0,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: 'Gabarito',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    opacity: 0.7,
    fontFamily: 'Gabarito',
  },
  metaSeparator: {
    fontSize: 12,
    opacity: 0.4,
    marginHorizontal: 4,
  },
  externalBadgeInline: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  externalTextInline: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    letterSpacing: 0.5,
  },
  externalIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    flexShrink: 0,
    minWidth: 30,
    textAlign: 'left',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 16,
    flex: 1,
    ...(Platform.OS !== 'web' && {
      height: 14,
    }),
  },
  progressBarItem: {
    width: 3,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 1.5,
    ...(Platform.OS !== 'web' && {
      width: 2.5,
    }),
  },
  progressBarItemSpacing: {
    marginRight: 2,
    ...(Platform.OS !== 'web' && {
      marginRight: 1.5,
    }),
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  menuButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
