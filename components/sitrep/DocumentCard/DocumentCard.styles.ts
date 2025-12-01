import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  documentItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentItemSelected: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  documentCard: {
    width: '100%',
    flexDirection: 'column',
    marginBottom: 0,
    padding: 12,
    minHeight: 120,
  },
  documentIcon: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
    borderRadius: 10,
    flexShrink: 0,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    flex: 1,
  },
  documentMeta: {
    fontSize: 12,
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 11,
    marginLeft: 4,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    flex: 1,
  },
  titleContainer: {
    flex: 1,
    marginLeft: 0,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 6,
    borderTopWidth: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  metaSeparator: {
    fontSize: 10,
    marginHorizontal: 4,
    opacity: 0.5,
  },
  fileSize: {
    fontSize: 11,
    marginLeft: 4,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});