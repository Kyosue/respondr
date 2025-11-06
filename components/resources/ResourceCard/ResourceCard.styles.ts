import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  resourceCard: {
    marginHorizontal: 16,
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
    flexDirection: 'row',
    padding: 12,
    paddingVertical: 12,
  },
  imageContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  topRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  conditionChip: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
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
    marginBottom: 8,
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
    flexDirection: 'column',
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    marginBottom: 4,
  },
  availabilityBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
  },
  availabilityFill: {
    height: '100%',
    borderRadius: 2,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
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
