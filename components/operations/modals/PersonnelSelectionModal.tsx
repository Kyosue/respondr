import { getUsersWithFilters } from '@/firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
    Animated,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { useHybridRamp } from '../../../hooks/useHybridRamp';
import { UserData } from '../../../types/UserData';
import { getModalConfig } from '../../../utils/modalUtils';
import { ThemedText } from '../../ThemedText';

interface PersonnelSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedPersonnel: string[]) => void;
  selectedPersonnel: string[];
  colors: any;
}

// Helper function to extract last name from fullName
const getLastName = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : fullName;
};

// Helper function to sort users by last name
const sortUsersByLastName = (users: UserData[]): UserData[] => {
  return [...users].sort((a, b) => {
    const lastNameA = getLastName(a.fullName).toLowerCase();
    const lastNameB = getLastName(b.fullName).toLowerCase();
    return lastNameA.localeCompare(lastNameB);
  });
};

export function PersonnelSelectionModal({
  visible,
  onClose,
  onConfirm,
  selectedPersonnel,
  colors
}: PersonnelSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelectedPersonnel, setTempSelectedPersonnel] = useState<string[]>(selectedPersonnel);
  const [availablePersonnel, setAvailablePersonnel] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  
  // Hybrid RAMP hook
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose: rampHandleClose } = useHybridRamp({
    visible,
    onClose: () => {
      setSearchQuery('');
      onClose();
    }
  });

  // Fetch operators
  useEffect(() => {
    const fetchOperators = async () => {
      try {
        setLoading(true);
        console.log('Fetching operators with filters: userType=operator, status=active');
        const users = await getUsersWithFilters({
          userType: 'operator',
          status: 'active'
        });
        
        console.log(`Fetched ${users.length} operators:`, users.map(u => ({ 
          id: u.id, 
          name: u.fullName, 
          email: u.email, 
          userType: u.userType, 
          status: u.status 
        })));
        
        // Sort by last name
        const sortedOperators = sortUsersByLastName(users);
        console.log(`Sorted ${sortedOperators.length} operators`);
        setAvailablePersonnel(sortedOperators);
      } catch (error) {
        console.error('Error fetching operators:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        setAvailablePersonnel([]);
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchOperators();
    }
  }, [visible]);
  
  // Sync tempSelectedPersonnel with selectedPersonnel prop changes
  useEffect(() => {
    setTempSelectedPersonnel(selectedPersonnel);
  }, [selectedPersonnel]);
  
  // Memoize filtered personnel to prevent unnecessary recalculations
  const filteredPersonnel = useMemo(() => {
    if (!searchQuery) return availablePersonnel;
    
    const query = searchQuery.toLowerCase();
    return availablePersonnel.filter(person =>
      person.fullName.toLowerCase().includes(query) ||
      person.email.toLowerCase().includes(query) ||
      person.displayName.toLowerCase().includes(query)
    );
  }, [availablePersonnel, searchQuery]);

  const isPersonnelSelected = (userId: string) => {
    return tempSelectedPersonnel.includes(userId);
  };

  const handlePersonnelToggle = (userId: string) => {
    if (isPersonnelSelected(userId)) {
      setTempSelectedPersonnel(prev => prev.filter(id => id !== userId));
    } else {
      setTempSelectedPersonnel(prev => [...prev, userId]);
    }
  };

  const handleConfirm = () => {
    onConfirm(tempSelectedPersonnel);
    onClose();
  };

  const handleClose = rampHandleClose;

  // Platform-specific modal rendering
  if (isWeb) {
    // Hybrid RAMP implementation for web
    return (
      <Modal
        visible={visible}
        {...getModalConfig()}
        onRequestClose={handleClose}
        transparent={true}
        animationType="fade"
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <TouchableOpacity 
            style={styles.overlayCloseButton} 
            onPress={handleClose}
            activeOpacity={0.7}
          />
          <Animated.View style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ]
            }
          ]}>
            <View style={{
              backgroundColor: colors.background,
              borderRadius: 12,
              overflow: 'hidden',
              width: '100%',
              maxWidth: 600,
              maxHeight: '100%',
              height: '100%'
            }}>
              {/* Header */}
              <View style={{
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                backgroundColor: colors.surface,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <View>
                  <ThemedText style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: colors.text
                  }}>
                    Assign Personnel
                  </ThemedText>
                  <ThemedText style={{
                    fontSize: 14,
                    color: colors.text + '80',
                    marginTop: 2
                  }}>
                    {tempSelectedPersonnel.length} selected
                  </ThemedText>
                </View>
                <TouchableOpacity onPress={handleClose}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Search */}
              <View style={{
                padding: 16,
                backgroundColor: colors.surface,
                borderBottomWidth: 1,
                borderBottomColor: colors.border
              }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                    fontSize: 16,
                    color: colors.text,
                    backgroundColor: colors.background
                  }}
                  placeholder="Search by name or email..."
                  placeholderTextColor={colors.text + '60'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Personnel List */}
              <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16 }}
                showsVerticalScrollIndicator={false}
              >
                {loading ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <ThemedText style={{ color: colors.text, opacity: 0.7 }}>
                      Loading personnel...
                    </ThemedText>
                  </View>
                ) : filteredPersonnel.length === 0 ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <ThemedText style={{ color: colors.text, opacity: 0.7 }}>
                      {searchQuery ? 'No personnel found' : 'No active operators available'}
                    </ThemedText>
                  </View>
                ) : (
                  filteredPersonnel.map((person) => {
                    const isSelected = isPersonnelSelected(person.id);
                    const lastName = getLastName(person.fullName);
                    const firstName = person.fullName.replace(lastName, '').trim();
                    const displayName = `${lastName}, ${firstName}`;
                    
                    return (
                      <TouchableOpacity
                        key={person.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: 12,
                          marginBottom: 8,
                          backgroundColor: colors.surface,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.primary : colors.border
                        }}
                        onPress={() => handlePersonnelToggle(person.id)}
                        activeOpacity={0.7}
                      >
                        {/* Checkbox */}
                        <View style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          borderWidth: 2,
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                          marginRight: 12,
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={16} color="white" />
                          )}
                        </View>

                        {/* User Info */}
                        <View style={{ flex: 1 }}>
                          <ThemedText style={{
                            fontSize: 15,
                            fontWeight: '600',
                            color: colors.text,
                            marginBottom: 2
                          }}>
                            {displayName}
                          </ThemedText>
                          <ThemedText style={{
                            fontSize: 13,
                            color: colors.text,
                            opacity: 0.7
                          }}>
                            {person.email}
                          </ThemedText>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              {/* Footer */}
              <View style={{
                padding: 16,
                borderTopWidth: 1,
                borderTopColor: colors.border,
                backgroundColor: colors.surface,
                flexDirection: 'row',
                gap: 12
              }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.border,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center'
                  }}
                  onPress={handleClose}
                >
                  <ThemedText style={{
                    color: colors.text,
                    fontSize: 16,
                    fontWeight: '600'
                  }}>
                    Cancel
                  </ThemedText>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center'
                  }}
                  onPress={handleConfirm}
                >
                  <ThemedText style={{
                    color: 'white',
                    fontSize: 16,
                    fontWeight: '600'
                  }}>
                    Confirm ({tempSelectedPersonnel.length})
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }

  // Original mobile implementation
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView 
        style={{
          flex: 1,
          backgroundColor: colors.background
        }}
        edges={['top']}
      >
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        {/* Header */}
        <View style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <View>
            <ThemedText style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.text
            }}>
              Assign Personnel
            </ThemedText>
            <ThemedText style={{
              fontSize: 14,
              color: colors.text + '80',
              marginTop: 2
            }}>
              {tempSelectedPersonnel.length} selected
            </ThemedText>
          </View>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={{
          padding: 16,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border
        }}>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 12,
              fontSize: 16,
              color: colors.text,
              backgroundColor: colors.background
            }}
            placeholder="Search by name or email..."
            placeholderTextColor={colors.text + '60'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Personnel List */}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ThemedText style={{ color: colors.text, opacity: 0.7 }}>
                Loading personnel...
              </ThemedText>
            </View>
          ) : filteredPersonnel.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ThemedText style={{ color: colors.text, opacity: 0.7 }}>
                {searchQuery ? 'No personnel found' : 'No active operators available'}
              </ThemedText>
            </View>
          ) : (
            filteredPersonnel.map((person) => {
              const isSelected = isPersonnelSelected(person.id);
              const lastName = getLastName(person.fullName);
              const firstName = person.fullName.replace(lastName, '').trim();
              const displayName = `${lastName}, ${firstName}`;
              
              return (
                <TouchableOpacity
                  key={person.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    marginBottom: 8,
                    backgroundColor: colors.surface,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.border
                  }}
                  onPress={() => handlePersonnelToggle(person.id)}
                  activeOpacity={0.7}
                >
                  {/* Checkbox */}
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    borderWidth: 2,
                    borderColor: isSelected ? colors.primary : colors.border,
                    backgroundColor: isSelected ? colors.primary : 'transparent',
                    marginRight: 12,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>

                  {/* User Info */}
                  <View style={{ flex: 1 }}>
                    <ThemedText style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: colors.text,
                      marginBottom: 2
                    }}>
                      {displayName}
                    </ThemedText>
                    <ThemedText style={{
                      fontSize: 13,
                      color: colors.text,
                      opacity: 0.7
                    }}>
                      {person.email}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Footer */}
        <View style={{
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          flexDirection: 'row',
          gap: 12
        }}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.border,
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center'
            }}
            onPress={handleClose}
          >
            <ThemedText style={{
              color: colors.text,
              fontSize: 16,
              fontWeight: '600'
            }}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: colors.primary,
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center'
            }}
            onPress={handleConfirm}
          >
            <ThemedText style={{
              color: 'white',
              fontSize: 16,
              fontWeight: '600'
            }}>
              Confirm ({tempSelectedPersonnel.length})
            </ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// Hybrid RAMP styles
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  overlayCloseButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  container: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2,
  },
});

