import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 15,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#173648',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 5px 18px rgba(16,42,61,0.06)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 3,
    fontFamily: 'Gabarito',
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
  },
  qualityText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 7,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'Gabarito',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    lineHeight: 16,
  },
  filterScroll: {
    marginTop: 4,
  },
  filterScrollContent: {
    gap: 8,
    paddingRight: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Gabarito',
    lineHeight: 24,
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
  predictionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  predictionsGridMobile: {
    gap: 10,
  },
  predictionCard: {
    flex: 1,
    minWidth: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#173648',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 5,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 3px 10px rgba(16,42,61,0.04)',
      },
    }),
  },
  predictionCardMobile: {
    width: '100%',
    minWidth: '100%',
    flex: 0,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  predictionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  predictionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  predictionTitleContainer: {
    flex: 1,
    minWidth: 0,
  },
  predictionLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
  modelQuality: {
    fontSize: 14,
    fontFamily: 'Gabarito',
    lineHeight: 16,
    marginTop: 2,
  },
  predictionTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  predictionTrendText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  predictionValueSection: {
    marginBottom: 12,
  },
  predictionValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  predictionCurrentLabel: {
    fontSize: 14,
    fontFamily: 'Gabarito',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 16,
    marginBottom: 4,
  },
  predictionCurrentValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 22,
  },
  predictionArrow: {
    flexShrink: 0,
  },
  predictionFuture: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  predictionFutureLabel: {
    fontSize: 14,
    fontFamily: 'Gabarito',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 16,
    marginBottom: 4,
  },
  predictionFutureValue: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    lineHeight: 24,
  },
  predictionTimeline: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  timelineScrollView: {
    marginHorizontal: -14, // Extend to card edges
    paddingHorizontal: 14, // Compensate for content padding
  },
  timelineScrollContent: {
    paddingRight: 14, // Extra padding on right for scroll indicator
  },
  timelineContent: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 4,
  },
  timelinePoint: {
    alignItems: 'center',
    minWidth: 80,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  timelineTime: {
    fontSize: 14,
    fontFamily: 'Gabarito',
    lineHeight: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  timelineValue: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 16,
    textAlign: 'center',
  },
});

