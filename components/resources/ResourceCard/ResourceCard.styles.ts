import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // ---- Card container (compact) ----
  resourceCard: {
    marginHorizontal: 6,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        marginHorizontal: 6,
        marginVertical: 6,
        width: 300,
      },
    }),
  },
  cardContent: {
    padding: 10,
  },

  // ---- Header: image + title + actions ----
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  imageWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 10,
    flexShrink: 0,
  },
  resourceImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    minWidth: 0,
  },
  conditionPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  conditionPillText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  actionsWrap: {
    flexShrink: 0,
    marginLeft: 2,
  },

  // ---- Meta: one tight line (category · location) ----
  metaSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    maxWidth: '50%',
  },
  metaText: {
    fontSize: 10,
    opacity: 0.75,
  },
  metaDot: {
    fontSize: 10,
    opacity: 0.4,
  },
  externalPill: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 2,
  },
  externalPillText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // ---- Availability (compact) ----
  availabilitySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 16,
  },
  availabilityLabel: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 36,
  },
  progressBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 14,
    gap: 1,
  },
  progressBarItem: {
    width: 2.5,
    height: '100%',
    borderRadius: 1.25,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  progressBarItemSpacing: {
    marginRight: 1.5,
  },

  // ---- Actions (shared, compact) ----
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  primaryActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  externalIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
