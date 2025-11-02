import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Municipality } from '@/data/davaoOrientalData';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CurrentOperationsTab } from './CurrentOperationsTab';
import { HistoryOperationsTab } from './HistoryOperationsTab';

interface MunicipalityDetailModalProps {
  visible: boolean;
  municipality: Municipality | null;
  onClose: () => void;
  onAddOperation?: () => void;
  recentOperations?: any[];
  onConcludeOperation?: (operationId: string) => void;
  concludedOperations?: any[];
}

type TabType = 'current' | 'history';

export function MunicipalityDetailModal({ 
  visible, 
  municipality, 
  onClose,
  onAddOperation,
  recentOperations = [],
  onConcludeOperation,
  concludedOperations = []
}: MunicipalityDetailModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const screenHeight = Dimensions.get('window').height;
  const [activeTab, setActiveTab] = useState<TabType>('current');
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose } = useHybridRamp({ visible, onClose });
  const scrollRef = useRef<ScrollView | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollBtnAnim = useRef(new Animated.Value(0)).current;

  const handleScroll = useCallback((event: any) => {
    const y = event?.nativeEvent?.contentOffset?.y ?? 0;
    setShowScrollTop(y > 200);
  }, []);

  const scrollToTop = useCallback(() => {
    try {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch {}
  }, []);

  useEffect(() => {
    Animated.timing(scrollBtnAnim, {
      toValue: showScrollTop ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showScrollTop, scrollBtnAnim]);

  // Weather-based gradient colors and icons
  const getWeatherGradient = (weatherCondition: string) => {
    const condition = weatherCondition.toLowerCase();
    
    if (condition.includes('sunny') || condition.includes('clear')) {
      return ['#FFD700', '#FFA500', '#FF8C00']; // Sunny: Gold to Orange
    } else if (condition.includes('cloudy') || condition.includes('overcast')) {
      return ['#87CEEB', '#B0C4DE', '#708090']; // Cloudy: Sky Blue to Gray
    } else if (condition.includes('rain') || condition.includes('drizzle')) {
      return ['#4682B4', '#5F9EA0', '#2F4F4F']; // Rainy: Steel Blue to Dark Slate
    } else if (condition.includes('storm') || condition.includes('thunder')) {
      return ['#483D8B', '#6A5ACD', '#8A2BE2']; // Stormy: Dark Slate to Purple
    } else if (condition.includes('snow') || condition.includes('blizzard')) {
      return ['#F0F8FF', '#E6E6FA', '#D3D3D3']; // Snowy: Light Blue to Light Gray
    } else if (condition.includes('fog') || condition.includes('mist')) {
      return ['#DCDCDC', '#C0C0C0', '#A9A9A9']; // Foggy: Light Gray to Dark Gray
    } else {
      return ['#667eea', '#764ba2', '#f093fb']; // Default: Purple gradient
    }
  };

  const getWeatherIcon = (weatherCondition: string) => {
    const condition = weatherCondition.toLowerCase();
    
    if (condition.includes('sunny') || condition.includes('clear')) {
      return { name: 'sunny', color: '#FF8C00' };
    } else if (condition.includes('cloudy') || condition.includes('overcast')) {
      return { name: 'cloudy', color: '#708090' };
    } else if (condition.includes('rain') || condition.includes('drizzle')) {
      return { name: 'rainy', color: '#4682B4' };
    } else if (condition.includes('storm') || condition.includes('thunder')) {
      return { name: 'thunderstorm', color: '#8A2BE2' };
    } else if (condition.includes('snow') || condition.includes('blizzard')) {
      return { name: 'snow', color: '#D3D3D3' };
    } else if (condition.includes('fog') || condition.includes('mist')) {
      return { name: 'partly-sunny', color: '#A9A9A9' };
    } else {
      return { name: 'partly-sunny', color: '#764ba2' };
    }
  };

  if (!municipality) return null;

  if (isWeb) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
        <Animated.View style={[styles.overlayWeb, { opacity: fadeAnim }] }>
          <TouchableOpacity style={styles.overlayCloseButton} onPress={handleClose} activeOpacity={0.7} />
          <Animated.View
            style={[
              styles.containerWeb,
              { backgroundColor: colors.surface, opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] }
            ]}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <View style={styles.headerContent}>
                <View style={styles.titleContainer}>
                  <ThemedText style={[styles.title, { color: colors.primary }]}>
                    {municipality.name}
                  </ThemedText>
                  <ThemedText style={[styles.subtitle, { color: colors.text, opacity: 0.7 }]}>
                    {municipality.type === 'City' ? 'City' : 'Municipality'} • Davao Oriental
                  </ThemedText>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content */}
            <ScrollView
              ref={scrollRef}
              style={styles.content}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              {/* Weather Information */}
              <View style={styles.section}>
                <View style={styles.weatherCard}>
                  <LinearGradient
                    colors={getWeatherGradient('Rainy') as [string, string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.weatherGradient}
                  >
                    {/* Decorative Elements */}
                    <View style={styles.decorativeElements}>
                      <View style={styles.whiteCircle1} />
                      <View style={styles.whiteCircle2} />
                      <View style={styles.whiteTriangle} />
                    </View>

                    {/* Weather Content */}
                    <View style={styles.weatherContent}>
                      {/* Weather Condition and Temperature */}
                      <View style={styles.weatherMainInfo}>
                        <View style={styles.weatherConditionContainer}>
                          <View style={styles.weatherIconContainer}>
                            <Ionicons 
                              name={getWeatherIcon('Rainy').name as any} 
                              size={20} 
                              color={getWeatherIcon('Rainy').color} 
                            />
                          </View> 
                          <View style={styles.weatherTextContainer}>
                            <ThemedText style={styles.weatherCondition}>
                              Rainy
                            </ThemedText>
                            <ThemedText style={styles.temperature}>
                              36°
                            </ThemedText>
                          </View>
                        </View>
                      </View>

                      {/* Weather Details - Horizontal Layout */}
                      <View style={styles.weatherDetailsContainer}>
                        <View style={styles.weatherDetailItem}>
                          <View style={styles.detailIconContainer}>
                            <Ionicons name="water" size={12} color="white" />
                          </View>
                          <ThemedText style={styles.weatherDetailLabel}>
                            Rain
                          </ThemedText>
                          <ThemedText style={styles.weatherDetailValue}>
                            0.2 mm/h
                          </ThemedText>
                        </View>

                        <View style={styles.weatherDetailItem}>
                          <View style={styles.detailIconContainer}>
                            <Ionicons name="leaf" size={12} color="white" />
                          </View>
                          <ThemedText style={styles.weatherDetailLabel}>
                            Wind
                          </ThemedText>
                          <ThemedText style={styles.weatherDetailValue}>
                            12 km/h
                          </ThemedText>
                        </View>

                        <View style={styles.weatherDetailItem}>
                          <View style={styles.detailIconContainer}>
                            <Ionicons name="compass" size={12} color="white" />
                          </View>
                          <ThemedText style={styles.weatherDetailLabel}>
                            Direction
                          </ThemedText>
                          <ThemedText style={styles.weatherDetailValue}>
                            NE
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </View>

              {/* Operations Section with Tabs */}
              <View style={styles.section}>
                {/* Tab Navigation */}
                <View style={[styles.tabContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeTab === 'current' && [styles.activeTab, { backgroundColor: colors.primary }]
                    ]}
                    onPress={() => setActiveTab('current')}
                  >
                    <Ionicons 
                      name="list" 
                      size={16} 
                      color={activeTab === 'current' ? 'white' : colors.text} 
                    />
                    <ThemedText style={[
                      styles.tabText,
                      { color: activeTab === 'current' ? 'white' : colors.text }
                    ]}>
                      Current ({recentOperations?.length || 0})
                    </ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tabButton,
                      activeTab === 'history' && [styles.activeTab, { backgroundColor: colors.primary }]
                    ]}
                    onPress={() => setActiveTab('history')}
                  >
                    <Ionicons 
                      name="time" 
                      size={16} 
                      color={activeTab === 'history' ? 'white' : colors.text} 
                    />
                    <ThemedText style={[
                      styles.tabText,
                      { color: activeTab === 'history' ? 'white' : colors.text }
                    ]}>
                      History ({concludedOperations?.length || 0})
                    </ThemedText>
                  </TouchableOpacity>
                </View>
                
                {/* Tab Content */}
                <View style={styles.tabContent}>
                  {activeTab === 'current' ? (
                    <CurrentOperationsTab
                      operations={recentOperations || []}
                      onConcludeOperation={onConcludeOperation}
                      onAddOperation={onAddOperation}
                    />
                  ) : (
                    <HistoryOperationsTab
                      operations={concludedOperations || []}
                    />
                  )}
                </View>
              </View>
            </ScrollView>
            <Animated.View
              pointerEvents={showScrollTop ? 'auto' : 'none'}
              style={[
                styles.scrollTopButton,
                {
                  backgroundColor: colors.primary,
                  opacity: scrollBtnAnim,
                  transform: [
                    {
                      scale: scrollBtnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] })
                    }
                  ]
                }
              ]}
            >
              <TouchableOpacity onPress={scrollToTop} activeOpacity={0.85} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 22 }}>
                <Ionicons name="arrow-up" size={20} color={'white'} />
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerContent}>
              <View style={styles.titleContainer}>
                <ThemedText style={[styles.title, { color: colors.primary }]}>
                  {municipality.name}
                </ThemedText>
                <ThemedText style={[styles.subtitle, { color: colors.text, opacity: 0.7 }]}>
                  {municipality.type === 'City' ? 'City' : 'Municipality'} • Davao Oriental
                </ThemedText>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <ScrollView
            ref={scrollRef}
            style={styles.content}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {/* Weather Information */}
            <View style={styles.section}>
              <View style={styles.weatherCard}>
                <LinearGradient
                  colors={getWeatherGradient('Rainy') as [string, string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.weatherGradient}
                >
                  {/* Decorative Elements */}
                  <View style={styles.decorativeElements}>
                    <View style={styles.whiteCircle1} />
                    <View style={styles.whiteCircle2} />
                    <View style={styles.whiteTriangle} />
                  </View>

                  {/* Weather Content */}
                  <View style={styles.weatherContent}>
                    {/* Weather Condition and Temperature */}
                    <View style={styles.weatherMainInfo}>
                      <View style={styles.weatherConditionContainer}>
                        <View style={styles.weatherIconContainer}>
                          <Ionicons 
                            name={getWeatherIcon('Rainy').name as any} 
                            size={20} 
                            color={getWeatherIcon('Rainy').color} 
                          />
                        </View> 
                        <View style={styles.weatherTextContainer}>
                          <ThemedText style={styles.weatherCondition}>
                            Rainy
                          </ThemedText>
                          <ThemedText style={styles.temperature}>
                            36°
                          </ThemedText>
                        </View>
                      </View>
                    </View>

                    {/* Weather Details - Horizontal Layout */}
                    <View style={styles.weatherDetailsContainer}>
                      <View style={styles.weatherDetailItem}>
                        <View style={styles.detailIconContainer}>
                          <Ionicons name="water" size={12} color="white" />
                        </View>
                        <ThemedText style={styles.weatherDetailLabel}>
                          Rain
                        </ThemedText>
                        <ThemedText style={styles.weatherDetailValue}>
                          0.2 mm/h
                        </ThemedText>
                      </View>

                      <View style={styles.weatherDetailItem}>
                        <View style={styles.detailIconContainer}>
                          <Ionicons name="leaf" size={12} color="white" />
                        </View>
                        <ThemedText style={styles.weatherDetailLabel}>
                          Wind
                        </ThemedText>
                        <ThemedText style={styles.weatherDetailValue}>
                          12 km/h
                        </ThemedText>
                      </View>

                      <View style={styles.weatherDetailItem}>
                        <View style={styles.detailIconContainer}>
                          <Ionicons name="compass" size={12} color="white" />
                        </View>
                        <ThemedText style={styles.weatherDetailLabel}>
                          Direction
                        </ThemedText>
                        <ThemedText style={styles.weatherDetailValue}>
                          NE
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </View>

            {/* Operations Section with Tabs */}
            <View style={styles.section}>
              {/* Tab Navigation */}
              <View style={[styles.tabContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === 'current' && [styles.activeTab, { backgroundColor: colors.primary }]
                  ]}
                  onPress={() => setActiveTab('current')}
                >
                  <Ionicons 
                    name="list" 
                    size={16} 
                    color={activeTab === 'current' ? 'white' : colors.text} 
                  />
                  <ThemedText style={[
                    styles.tabText,
                    { color: activeTab === 'current' ? 'white' : colors.text }
                  ]}>
                    Current ({recentOperations?.length || 0})
                  </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tabButton,
                    activeTab === 'history' && [styles.activeTab, { backgroundColor: colors.primary }]
                  ]}
                  onPress={() => setActiveTab('history')}
                >
                  <Ionicons 
                    name="time" 
                    size={16} 
                    color={activeTab === 'history' ? 'white' : colors.text} 
                  />
                  <ThemedText style={[
                    styles.tabText,
                    { color: activeTab === 'history' ? 'white' : colors.text }
                  ]}>
                    History ({concludedOperations?.length || 0})
                  </ThemedText>
                </TouchableOpacity>
              </View>
              
              {/* Tab Content */}
              <View style={styles.tabContent}>
                {activeTab === 'current' ? (
                  <CurrentOperationsTab
                    operations={recentOperations || []}
                    onConcludeOperation={onConcludeOperation}
                    onAddOperation={onAddOperation}
                  />
                ) : (
                  <HistoryOperationsTab
                    operations={concludedOperations || []}
                  />
                )}
              </View>
            </View>
          </ScrollView>
          <Animated.View
            pointerEvents={showScrollTop ? 'auto' : 'none'}
            style={[
              styles.scrollTopButton,
              {
                backgroundColor: colors.primary,
                opacity: scrollBtnAnim,
                transform: [
                  {
                    scale: scrollBtnAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] })
                  }
                ]
              }
            ]}
          >
            <TouchableOpacity onPress={scrollToTop} activeOpacity={0.85} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 22 }}>
              <Ionicons name="arrow-up" size={20} color={'white'} />
            </TouchableOpacity>
          </Animated.View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayWeb: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)'
  },
  overlayCloseButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  containerWeb: {
    width: '100%',
    maxWidth: 1030,
    height: '85%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 5,
    height: 25,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 16,
    ...Platform.select({ web: { height: '100%' }, default: { flex: 1 } }),
  },
  scrollTopButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  section: {
    marginBottom: 16,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  weatherCard: {
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  weatherGradient: {
    padding: 12,
    position: 'relative',
  },
  decorativeElements: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  whiteCircle1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  whiteCircle2: {
    position: 'absolute',
    bottom: -10,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  whiteTriangle: {
    position: 'absolute',
    top: 20,
    right: 40,
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 25,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  weatherContent: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherMainInfo: {
    flex: 0.6,
    marginRight: 12,
  },
  weatherConditionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  weatherIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    marginTop: 1,
  },
  weatherTextContainer: {
    flex: 1,
  },
  weatherCondition: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  temperature: {
    color: 'white',
    fontSize: 24,
    fontWeight: '800',
  },
  weatherDetailsContainer: {
    flex: 1.4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weatherDetailItem: {
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginHorizontal: 2,
  },
  detailIconContainer: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  weatherDetailLabel: {
    color: 'white',
    fontSize: 9,
    fontWeight: '500',
    marginBottom: 1,
    opacity: 0.9,
  },
  weatherDetailValue: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  // Tab Styles
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    // backgroundColor set dynamically
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    minHeight: 200,
  },
});
