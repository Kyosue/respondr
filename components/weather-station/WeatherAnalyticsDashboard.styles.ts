import { Platform, StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    padding: 15,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
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
  dataCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
  },
  dataCountText: {
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
  chartCard: {
    borderRadius: 9,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
    width: '100%',
    ...Platform.select({
      web: {
        padding: 15,
        paddingHorizontal: 15,
        backgroundColor: 'transparent',
        maxWidth: '100%',
      },
      default: {
        padding: 10,
      },
    }),
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
    ...Platform.select({
      web: {
        marginBottom: 18,
      },
      default: {
        marginBottom: 12,
      },
    }),
  },
  chartHeaderLeft: {
    flex: 1,
  },
  intervalSelector: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    ...Platform.select({
      web: {
        marginTop: 0,
      },
      default: {
        marginTop: 2,
      },
    }),
  },
  intervalScroll: {
    maxWidth: Platform.select({
      web: 400,
      default: 200,
    }),
  },
  intervalScrollContent: {
    gap: 6,
    paddingRight: 4,
  },
  intervalButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  intervalButtonText: {
    fontSize: 14, // Small
  },
  chartTitle: {
    fontWeight: '800',
    marginBottom: 4,
    fontFamily: 'Gabarito',
    fontSize: 16,
    lineHeight: 21,
  },
  chartSubtitle: {
    fontFamily: 'Gabarito',
    opacity: 0.7,
    fontSize: 14,
    lineHeight: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    paddingVertical: 12,
    width: '100%',
    ...Platform.select({
      web: {
        maxWidth: '100%',
      },
    }),
  },
  tooltipBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  tooltip: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 1000,
    ...Platform.select({
      web: {
        minWidth: 180,
        maxWidth: 220,
        padding: 12,
      },
      default: {
        minWidth: 160,
        maxWidth: 200,
        padding: 10,
      },
    }),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
      },
    }),
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  tooltipHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  tooltipCloseButton: {
    padding: 4,
    marginRight: -4,
  },
  tooltipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tooltipMetricName: {
    fontSize: 14, // Body
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
  tooltipContent: {
    gap: 4,
  },
  tooltipValue: {
    fontSize: 20, // H3
    fontWeight: '700',
    fontFamily: 'Gabarito',
    lineHeight: 24,
  },
  tooltipTime: {
    fontSize: 14, // Small
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-start',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 14,
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statsGridMobile: {
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    borderRadius: 7,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: 10,
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
        boxShadow: '0 3px 10px rgba(16,42,61,0.04)',
      },
    }),
  },
  statCardMobile: {
    width: '48%',
    minWidth: '48%',
    flex: 0,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  statCardTitleContainer: {
    flex: 1,
    minWidth: 0,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
    minWidth: 50,
    justifyContent: 'flex-end',
  },
  statTrendText: {
    fontSize: 14,
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  statCurrentSection: {
    marginBottom: 8,
  },
  statCurrentValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  statCurrentValue: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Gabarito',
    lineHeight: 27,
  },
  statUnit: {
    fontSize: 14,
    fontFamily: 'Gabarito',
    lineHeight: 16,
  },
  statCurrentLabel: {
    fontSize: 14, // Small
    fontFamily: 'Gabarito',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  statRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statRangeItem: {
    flex: 1,
    alignItems: 'center',
  },
  statRangeDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 4,
  },
  statRangeLabel: {
    fontSize: 14, // Small
    fontFamily: 'Gabarito',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  statRangeValue: {
    fontSize: 14, // Body
    fontWeight: '600',
    fontFamily: 'Gabarito',
    lineHeight: 20,
  },
});

