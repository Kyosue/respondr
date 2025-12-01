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
  onConfirm: (result: { personnel: string[]; teamLeader?: string }) => void;
  selectedPersonnel: string[];
  selectedTeamLeader?: string;
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
  selectedTeamLeader,
  colors
}: PersonnelSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tempSelectedPersonnel, setTempSelectedPersonnel] = useState<string[]>(selectedPersonnel);
  const [tempTeamLeader, setTempTeamLeader] = useState<string | undefined>(selectedTeamLeader);
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

  // Fetch operators and supervisors
  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        setLoading(true);
        console.log('Fetching operators and supervisors with filters: status=active');
        
        // Fetch both operators and supervisors
        const [operators, supervisors] = await Promise.all([
          getUsersWithFilters({
            userType: 'operator',
            status: 'active'
          }),
          getUsersWithFilters({
            userType: 'supervisor',
            status: 'active'
          })
        ]);
        
        // Combine and sort by last name
        const allPersonnel = [...operators, ...supervisors];
        const sortedPersonnel = sortUsersByLastName(allPersonnel);
        
        console.log(`Fetched ${operators.length} operators and ${supervisors.length} supervisors (${sortedPersonnel.length} total)`);
        setAvailablePersonnel(sortedPersonnel);
      } catch (error) {
        console.error('Error fetching personnel:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        setAvailablePersonnel([]);
      } finally {
        setLoading(false);
      }
    };

    if (visible) {
      fetchPersonnel();
    }
  }, [visible]);
  
  // Sync tempSelectedPersonnel and tempTeamLeader with prop changes
  useEffect(() => {
    setTempSelectedPersonnel(selectedPersonnel);
    setTempTeamLeader(selectedTeamLeader);
  }, [selectedPersonnel, selectedTeamLeader]);
  
  // Memoize filtered and grouped personnel by role
  const groupedPersonnel = useMemo(() => {
    let filtered = availablePersonnel;
    
    // Apply search filter if query exists
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = availablePersonnel.filter(person =>
        person.fullName.toLowerCase().includes(query) ||
        person.email.toLowerCase().includes(query) ||
        person.displayName?.toLowerCase().includes(query)
      );
    }
    
    // Group by role and sort each group alphabetically
    const supervisors = filtered
      .filter(person => person.userType === 'supervisor')
      .sort((a, b) => {
        const lastNameA = getLastName(a.fullName).toLowerCase();
        const lastNameB = getLastName(b.fullName).toLowerCase();
        return lastNameA.localeCompare(lastNameB);
      });
    
    const operators = filtered
      .filter(person => person.userType === 'operator')
      .sort((a, b) => {
        const lastNameA = getLastName(a.fullName).toLowerCase();
        const lastNameB = getLastName(b.fullName).toLowerCase();
        return lastNameA.localeCompare(lastNameB);
      });
    
    return { supervisors, operators };
  }, [availablePersonnel, searchQuery]);

  const isPersonnelSelected = (userId: string) => {
    return tempSelectedPersonnel.includes(userId);
  };

  const handlePersonnelToggle = (userId: string) => {
    if (isPersonnelSelected(userId)) {
      setTempSelectedPersonnel(prev => prev.filter(id => id !== userId));
      // If removing the team leader, clear team leader selection
      if (tempTeamLeader === userId) {
        setTempTeamLeader(undefined);
      }
    } else {
      setTempSelectedPersonnel(prev => [...prev, userId]);
    }
  };

  const handleTeamLeaderToggle = (userId: string) => {
    // Team leader must be in selected personnel
    if (!isPersonnelSelected(userId)) {
      // Auto-select if not already selected
      setTempSelectedPersonnel(prev => [...prev, userId]);
    }
    // Toggle team leader
    setTempTeamLeader(prev => prev === userId ? undefined : userId);
  };

  const handleConfirm = () => {
    onConfirm({
      personnel: tempSelectedPersonnel,
      teamLeader: tempTeamLeader
    });
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
                    {tempSelectedPersonnel.length} selected{tempTeamLeader ? ` • Team Leader: ${availablePersonnel.find(p => p.id === tempTeamLeader)?.fullName || 'Selected'}` : ''}
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
                ) : groupedPersonnel.supervisors.length === 0 && groupedPersonnel.operators.length === 0 ? (
                  <View style={{ padding: 20, alignItems: 'center' }}>
                    <ThemedText style={{ color: colors.text, opacity: 0.7 }}>
                      {searchQuery ? 'No personnel found' : 'No active personnel available'}
                    </ThemedText>
                  </View>
                ) : (
                  <>
                    {/* Supervisors Section */}
                    {groupedPersonnel.supervisors.length > 0 && (
                      <>
                        <View style={{ marginBottom: 12, marginTop: 4 }}>
                          <ThemedText style={{
                            fontSize: 14,
                            fontWeight: '700',
                            color: colors.text,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5
                          }}>
                            Supervisors ({groupedPersonnel.supervisors.length})
                          </ThemedText>
                        </View>
                        {groupedPersonnel.supervisors.map((person) => {
                          const isSelected = isPersonnelSelected(person.id);
                          const isTeamLeader = tempTeamLeader === person.id;
                          const isSupervisor = person.userType === 'supervisor';
                          const lastName = getLastName(person.fullName);
                          const firstName = person.fullName.replace(lastName, '').trim();
                          const displayName = `${lastName}, ${firstName}`;
                          
                          return (
                            <View
                              key={person.id}
                              style={{
                                marginBottom: 8,
                                backgroundColor: colors.surface,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: isSelected ? colors.primary : colors.border,
                                overflow: 'hidden'
                              }}
                            >
                              <TouchableOpacity
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  padding: 12,
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
                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                    <ThemedText style={{
                                      fontSize: 15,
                                      fontWeight: '600',
                                      color: colors.text,
                                      marginRight: 8
                                    }}>
                                      {displayName}
                                    </ThemedText>
                                    {/* Role Badge */}
                                    <View style={{
                                      backgroundColor: isSupervisor ? '#FF6B35' : '#4A90E2',
                                      paddingHorizontal: 6,
                                      paddingVertical: 2,
                                      borderRadius: 4
                                    }}>
                                      <ThemedText style={{
                                        fontSize: 10,
                                        fontWeight: '700',
                                        color: 'white',
                                        textTransform: 'uppercase'
                                      }}>
                                        {isSupervisor ? 'Supervisor' : 'Operator'}
                                      </ThemedText>
                                    </View>
                                  </View>
                                  <ThemedText style={{
                                    fontSize: 13,
                                    color: colors.text,
                                    opacity: 0.7
                                  }}>
                                    {person.email}
                                  </ThemedText>
                                </View>
                              </TouchableOpacity>
                              
                              {/* Team Leader Selection */}
                              {isSelected && (
                                <TouchableOpacity
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 10,
                                    paddingLeft: 48,
                                    backgroundColor: isTeamLeader ? colors.primary + '15' : 'transparent',
                                    borderTopWidth: 1,
                                    borderTopColor: colors.border
                                  }}
                                  onPress={() => handleTeamLeaderToggle(person.id)}
                                  activeOpacity={0.7}
                                >
                                  <View style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 10,
                                    borderWidth: 2,
                                    borderColor: isTeamLeader ? colors.primary : colors.border,
                                    backgroundColor: isTeamLeader ? colors.primary : 'transparent',
                                    marginRight: 8,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                  }}>
                                    {isTeamLeader && (
                                      <View style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: 'white'
                                      }} />
                                    )}
                                  </View>
                                  <ThemedText style={{
                                    fontSize: 13,
                                    fontWeight: isTeamLeader ? '600' : '400',
                                    color: isTeamLeader ? colors.primary : colors.text,
                                    opacity: isTeamLeader ? 1 : 0.7
                                  }}>
                                    Set as Team Leader
                                  </ThemedText>
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        })}
                      </>
                    )}

                    {/* Operators Section */}
                    {groupedPersonnel.operators.length > 0 && (
                      <>
                        <View style={{ marginBottom: 12, marginTop: groupedPersonnel.supervisors.length > 0 ? 16 : 4 }}>
                          <ThemedText style={{
                            fontSize: 14,
                            fontWeight: '700',
                            color: colors.text,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5
                          }}>
                            Operators ({groupedPersonnel.operators.length})
                          </ThemedText>
                        </View>
                        {groupedPersonnel.operators.map((person) => {
                          const isSelected = isPersonnelSelected(person.id);
                          const isTeamLeader = tempTeamLeader === person.id;
                          const isSupervisor = person.userType === 'supervisor';
                          const lastName = getLastName(person.fullName);
                          const firstName = person.fullName.replace(lastName, '').trim();
                          const displayName = `${lastName}, ${firstName}`;
                          
                          return (
                            <View
                              key={person.id}
                              style={{
                                marginBottom: 8,
                                backgroundColor: colors.surface,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: isSelected ? colors.primary : colors.border,
                                overflow: 'hidden'
                              }}
                            >
                              <TouchableOpacity
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  padding: 12,
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
                                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                    <ThemedText style={{
                                      fontSize: 15,
                                      fontWeight: '600',
                                      color: colors.text,
                                      marginRight: 8
                                    }}>
                                      {displayName}
                                    </ThemedText>
                                    {/* Role Badge */}
                                    <View style={{
                                      backgroundColor: isSupervisor ? '#FF6B35' : '#4A90E2',
                                      paddingHorizontal: 6,
                                      paddingVertical: 2,
                                      borderRadius: 4
                                    }}>
                                      <ThemedText style={{
                                        fontSize: 10,
                                        fontWeight: '700',
                                        color: 'white',
                                        textTransform: 'uppercase'
                                      }}>
                                        {isSupervisor ? 'Supervisor' : 'Operator'}
                                      </ThemedText>
                                    </View>
                                  </View>
                                  <ThemedText style={{
                                    fontSize: 13,
                                    color: colors.text,
                                    opacity: 0.7
                                  }}>
                                    {person.email}
                                  </ThemedText>
                                </View>
                              </TouchableOpacity>
                              
                              {/* Team Leader Selection */}
                              {isSelected && (
                                <TouchableOpacity
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 10,
                                    paddingLeft: 48,
                                    backgroundColor: isTeamLeader ? colors.primary + '15' : 'transparent',
                                    borderTopWidth: 1,
                                    borderTopColor: colors.border
                                  }}
                                  onPress={() => handleTeamLeaderToggle(person.id)}
                                  activeOpacity={0.7}
                                >
                                  <View style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 10,
                                    borderWidth: 2,
                                    borderColor: isTeamLeader ? colors.primary : colors.border,
                                    backgroundColor: isTeamLeader ? colors.primary : 'transparent',
                                    marginRight: 8,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                  }}>
                                    {isTeamLeader && (
                                      <View style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: 'white'
                                      }} />
                                    )}
                                  </View>
                                  <ThemedText style={{
                                    fontSize: 13,
                                    fontWeight: isTeamLeader ? '600' : '400',
                                    color: isTeamLeader ? colors.primary : colors.text,
                                    opacity: isTeamLeader ? 1 : 0.7
                                  }}>
                                    Set as Team Leader
                                  </ThemedText>
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        })}
                      </>
                    )}
                  </>
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
                    Confirm ({tempSelectedPersonnel.length}{tempTeamLeader ? ', 1 Leader' : ''})
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
              {tempSelectedPersonnel.length} selected{tempTeamLeader ? ` • Team Leader: ${availablePersonnel.find(p => p.id === tempTeamLeader)?.fullName || 'Selected'}` : ''}
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
          ) : groupedPersonnel.supervisors.length === 0 && groupedPersonnel.operators.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ThemedText style={{ color: colors.text, opacity: 0.7 }}>
                {searchQuery ? 'No personnel found' : 'No active personnel available'}
              </ThemedText>
            </View>
          ) : (
            <>
              {/* Supervisors Section */}
              {groupedPersonnel.supervisors.length > 0 && (
                <>
                  <View style={{ marginBottom: 12, marginTop: 4 }}>
                    <ThemedText style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: colors.text,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}>
                      Supervisors ({groupedPersonnel.supervisors.length})
                    </ThemedText>
                  </View>
                  {groupedPersonnel.supervisors.map((person) => {
                    const isSelected = isPersonnelSelected(person.id);
                    const isTeamLeader = tempTeamLeader === person.id;
                    const isSupervisor = person.userType === 'supervisor';
                    const lastName = getLastName(person.fullName);
                    const firstName = person.fullName.replace(lastName, '').trim();
                    const displayName = `${lastName}, ${firstName}`;
                    
                    return (
                      <View
                        key={person.id}
                        style={{
                          marginBottom: 8,
                          backgroundColor: colors.surface,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.primary : colors.border,
                          overflow: 'hidden'
                        }}
                      >
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: 12,
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
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                              <ThemedText style={{
                                fontSize: 15,
                                fontWeight: '600',
                                color: colors.text,
                                marginRight: 8
                              }}>
                                {displayName}
                              </ThemedText>
                              {/* Role Badge */}
                              <View style={{
                                backgroundColor: isSupervisor ? '#FF6B35' : '#4A90E2',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4
                              }}>
                                <ThemedText style={{
                                  fontSize: 10,
                                  fontWeight: '700',
                                  color: 'white',
                                  textTransform: 'uppercase'
                                }}>
                                  {isSupervisor ? 'Supervisor' : 'Operator'}
                                </ThemedText>
                              </View>
                            </View>
                            <ThemedText style={{
                              fontSize: 13,
                              color: colors.text,
                              opacity: 0.7
                            }}>
                              {person.email}
                            </ThemedText>
                          </View>
                        </TouchableOpacity>
                        
                        {/* Team Leader Selection */}
                        {isSelected && (
                          <TouchableOpacity
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              padding: 10,
                              paddingLeft: 48,
                              backgroundColor: isTeamLeader ? colors.primary + '15' : 'transparent',
                              borderTopWidth: 1,
                              borderTopColor: colors.border
                            }}
                            onPress={() => handleTeamLeaderToggle(person.id)}
                            activeOpacity={0.7}
                          >
                            <View style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              borderWidth: 2,
                              borderColor: isTeamLeader ? colors.primary : colors.border,
                              backgroundColor: isTeamLeader ? colors.primary : 'transparent',
                              marginRight: 8,
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}>
                              {isTeamLeader && (
                                <View style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: 'white'
                                }} />
                              )}
                            </View>
                            <ThemedText style={{
                              fontSize: 13,
                              fontWeight: isTeamLeader ? '600' : '400',
                              color: isTeamLeader ? colors.primary : colors.text,
                              opacity: isTeamLeader ? 1 : 0.7
                            }}>
                              Set as Team Leader
                            </ThemedText>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </>
              )}

              {/* Operators Section */}
              {groupedPersonnel.operators.length > 0 && (
                <>
                  <View style={{ marginBottom: 12, marginTop: groupedPersonnel.supervisors.length > 0 ? 16 : 4 }}>
                    <ThemedText style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: colors.text,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}>
                      Operators ({groupedPersonnel.operators.length})
                    </ThemedText>
                  </View>
                  {groupedPersonnel.operators.map((person) => {
                    const isSelected = isPersonnelSelected(person.id);
                    const isTeamLeader = tempTeamLeader === person.id;
                    const isSupervisor = person.userType === 'supervisor';
                    const lastName = getLastName(person.fullName);
                    const firstName = person.fullName.replace(lastName, '').trim();
                    const displayName = `${lastName}, ${firstName}`;
                    
                    return (
                      <View
                        key={person.id}
                        style={{
                          marginBottom: 8,
                          backgroundColor: colors.surface,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: isSelected ? colors.primary : colors.border,
                          overflow: 'hidden'
                        }}
                      >
                        <TouchableOpacity
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            padding: 12,
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
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                              <ThemedText style={{
                                fontSize: 15,
                                fontWeight: '600',
                                color: colors.text,
                                marginRight: 8
                              }}>
                                {displayName}
                              </ThemedText>
                              {/* Role Badge */}
                              <View style={{
                                backgroundColor: isSupervisor ? '#FF6B35' : '#4A90E2',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4
                              }}>
                                <ThemedText style={{
                                  fontSize: 10,
                                  fontWeight: '700',
                                  color: 'white',
                                  textTransform: 'uppercase'
                                }}>
                                  {isSupervisor ? 'Supervisor' : 'Operator'}
                                </ThemedText>
                              </View>
                            </View>
                            <ThemedText style={{
                              fontSize: 13,
                              color: colors.text,
                              opacity: 0.7
                            }}>
                              {person.email}
                            </ThemedText>
                          </View>
                        </TouchableOpacity>
                        
                        {/* Team Leader Selection */}
                        {isSelected && (
                          <TouchableOpacity
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              padding: 10,
                              paddingLeft: 48,
                              backgroundColor: isTeamLeader ? colors.primary + '15' : 'transparent',
                              borderTopWidth: 1,
                              borderTopColor: colors.border
                            }}
                            onPress={() => handleTeamLeaderToggle(person.id)}
                            activeOpacity={0.7}
                          >
                            <View style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              borderWidth: 2,
                              borderColor: isTeamLeader ? colors.primary : colors.border,
                              backgroundColor: isTeamLeader ? colors.primary : 'transparent',
                              marginRight: 8,
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}>
                              {isTeamLeader && (
                                <View style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: 'white'
                                }} />
                              )}
                            </View>
                            <ThemedText style={{
                              fontSize: 13,
                              fontWeight: isTeamLeader ? '600' : '400',
                              color: isTeamLeader ? colors.primary : colors.text,
                              opacity: isTeamLeader ? 1 : 0.7
                            }}>
                              Set as Team Leader
                            </ThemedText>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </>
              )}
            </>
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
              Confirm ({tempSelectedPersonnel.length}{tempTeamLeader ? ', 1 Leader' : ''})
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

