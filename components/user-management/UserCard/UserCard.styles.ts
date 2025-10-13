import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  userCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardContent: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 16,
    position: 'relative',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  userInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  userTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    marginRight: 4,
  },
  userTypeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 4,
    marginBottom: 2,
  },
  metaIcon: {
    marginRight: 4,
    width: 12,
  },
  metaDot: {
    opacity: 0.5,
  },
  userUsername: {
    fontSize: 13,
    fontWeight: '500',
    maxWidth: '40%',
  },
  userEmail: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
    minWidth: 0,
  },
  userDate: {
    fontSize: 11,
    fontWeight: '500',
  },
  chevronContainer: {
    marginLeft: 10,
    padding: 2,
  },
});
