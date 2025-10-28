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
    width: 280,
    flexDirection: 'column',
    marginBottom: 0,
    padding: 14,
  },
  documentIcon: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 20,
  },
  documentMeta: {
    fontSize: 12,
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 12,
  },
  categoryBadge: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});