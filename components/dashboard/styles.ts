import { StyleSheet } from 'react-native';

export const dashboardStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 5,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Gabarito',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Gabarito',
  },
  desktopLayout: {
    flexDirection: 'row',
    flex: 1,
    gap: 20,
  },
  desktopLeft: {
    flex: 0.6,
  },
  desktopRight: {
    flex: 0.4,
  },
  mobileLayout: {
    flex: 1,
  },
});

