import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    fontFamily: 'Gabarito',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  qualityText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 20,
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
    borderRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
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
    fontSize: 11,
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
    fontSize: 12,
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
    fontSize: 11,
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
    fontSize: 11,
    fontFamily: 'Gabarito',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 16,
    marginBottom: 4,
  },
  predictionFutureValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    lineHeight: 24,
  },
  predictionTimeline: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
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
    fontSize: 10,
    fontFamily: 'Gabarito',
    lineHeight: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  timelineValue: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 16,
    textAlign: 'center',
  },
});

