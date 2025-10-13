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
        height: 180,
        width: 350,
        display: 'flex',
        flexDirection: 'column',
      },
    }),
  },
  cardContent: {
    flexDirection: 'row',
    padding: 8,
    ...Platform.select({
      web: {
        flex: 1,
        height: '100%',
      },
    }),
  },
  leftSection: {
    flex: 1,
    marginRight: 12,
    ...Platform.select({
      web: {
        overflow: 'hidden',
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  imageContainer: {
    width: 45,
    height: 45,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 10,
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
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
    ...Platform.select({
      web: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      },
    }),
  },
  conditionChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  conditionText: {
    fontSize: 10,
    fontWeight: '600',
  },
  resourceDescription: {
    fontSize: 12,
    opacity: 0.7,
    lineHeight: 16,
    ...Platform.select({
      web: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxHeight: 32,
      },
    }),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  resourceCategory: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginRight: 6,
  },
  resourceLocation: {
    fontSize: 10,
    opacity: 0.7,
    flex: 1,
  },
  externalBadge: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  externalIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    opacity: 0.7,
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: 10,
  },
  primaryActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  availabilityBar: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
    width: '95%',
    alignSelf: 'center',
    ...Platform.select({
      web: {
        marginTop: 'auto',
        marginBottom: 8,
      },
    }),
  },
  availabilityFill: {
    height: 3,
    borderRadius: 2,
  },
});
