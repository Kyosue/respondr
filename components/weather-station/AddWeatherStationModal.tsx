import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { getMunicipalities, Municipality } from '@/data/davaoOrientalData';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useHybridRamp } from '@/hooks/useHybridRamp';
import { DeviceIdInfo, scanForUnusedDeviceIds } from '@/services/weatherApi';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface AddWeatherStationModalProps {
  visible: boolean;
  onClose: () => void;
  onAddStation: (deviceId: string, municipality: Municipality, locationName?: string) => Promise<void>;
  existingStations: Array<{ municipality: { name: string }; deviceId?: string }>;
}

export function AddWeatherStationModal({
  visible,
  onClose,
  onAddStation,
  existingStations,
}: AddWeatherStationModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Hybrid RAMP hook - handles animations and platform detection
  const { isWeb, fadeAnim, scaleAnim, slideAnim, handleClose: rampHandleClose } = useHybridRamp({
    visible,
    onClose
  });
  
  const [unusedDeviceIds, setUnusedDeviceIds] = useState<DeviceIdInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<Municipality | null>(null);
  const [showMunicipalityPicker, setShowMunicipalityPicker] = useState(false);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [locationName, setLocationName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [expandedDeviceIds, setExpandedDeviceIds] = useState<Set<string>>(new Set());

  const municipalities = getMunicipalities();

  // Scan for unused device IDs when modal opens
  useEffect(() => {
    if (visible) {
      // Reset state when modal opens to ensure clean state
      setSelectedDeviceId(null);
      setSelectedMunicipality(null);
      setShowMunicipalityPicker(false);
      setShowLocationInput(false);
      setLocationName('');
      setError(null);
      setExpandedDeviceIds(new Set());
      handleScan();
    } else {
      // Reset state when modal closes
      setUnusedDeviceIds([]);
      setSelectedDeviceId(null);
      setSelectedMunicipality(null);
      setShowMunicipalityPicker(false);
      setShowLocationInput(false);
      setLocationName('');
      setError(null);
      setExpandedDeviceIds(new Set());
    }
  }, [visible]);

  const handleScan = async () => {
    setIsScanning(true);
    setError(null);
    
    try {
      const unused = await scanForUnusedDeviceIds(existingStations);
      setUnusedDeviceIds(unused);
      
      if (unused.length === 0) {
        setError('No unused device IDs found. All device IDs in Firebase are already being displayed.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan for unused device IDs');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectDevice = (deviceId: string) => {
    // Toggle selection: if already selected, deselect it; otherwise select it
    if (selectedDeviceId === deviceId) {
      // Deselect
      setSelectedDeviceId(null);
      setSelectedMunicipality(null);
      setShowMunicipalityPicker(false);
      setShowLocationInput(false);
      setLocationName('');
    } else {
      // Select
      setSelectedDeviceId(deviceId);
      setShowMunicipalityPicker(false);
      setShowLocationInput(false);
      setLocationName('');
      
      // Try to auto-detect municipality from device ID (suggestion only, user can override)
      // Extract municipality name from device ID (e.g., WS-MATI-01 -> MATI)
      const deviceIdUpper = deviceId.toUpperCase();
      const match = deviceIdUpper.match(/WS-([A-Z-]+?)(?:-\d+|$)/);
      
      if (match) {
        const namePart = match[1].replace(/-/g, ' ');
        // Try to find matching municipality
        const matched = municipalities.find(m => {
          const mName = m.name.toUpperCase()
            .replace(/^CITY\s+OF\s+/i, '')
            .replace(/\s+CITY$/i, '')
            .replace(/\s+/g, '');
          return mName === namePart || mName.includes(namePart) || namePart.includes(mName);
        });
        
        // Auto-suggest if found, but don't auto-select municipality yet
        if (matched) {
          setSelectedMunicipality(matched);
        } else {
          // Clear selection if no match found
          setSelectedMunicipality(null);
        }
      } else {
        // Clear selection if device ID format doesn't match
        setSelectedMunicipality(null);
      }
    }
  };

  const handleSelectMunicipality = (municipality: Municipality) => {
    setSelectedMunicipality(municipality);
    setShowMunicipalityPicker(false);
    setShowLocationInput(true);
  };

  const handleConfirmAdd = async () => {
    if (selectedDeviceId && selectedMunicipality) {
      // Location name is always required for better identification
      if (!locationName.trim()) {
        setError('Please enter the exact location where this weather station is installed (e.g., "PDRRMO Office, Barangay Dahican")');
        return;
      }

      // Check if there are other stations in the same municipality with same location
      const hasDuplicateLocation = existingStations.some(
        s => s.municipality.name === selectedMunicipality.name
      );
      
      if (hasDuplicateLocation) {
        // Warn but don't block - user might intentionally have multiple stations at same location
        // Just show a warning in the hint
      }
      
      try {
        await onAddStation(
          selectedDeviceId, 
          selectedMunicipality,
          locationName.trim()
        );
        // Reset state only on success
        setUnusedDeviceIds([]);
        setSelectedDeviceId(null);
        setSelectedMunicipality(null);
        setShowMunicipalityPicker(false);
        setShowLocationInput(false);
        setLocationName('');
        setError(null);
        rampHandleClose();
      } catch (error) {
        // Display error to user
        setError(error instanceof Error ? error.message : 'Failed to add weather station. Please try again.');
      }
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setUnusedDeviceIds([]);
    setSelectedDeviceId(null);
    setSelectedMunicipality(null);
    setShowMunicipalityPicker(false);
    setError(null);
    rampHandleClose();
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffSeconds > 30) return `${diffSeconds} seconds ago`;
    return 'Just now';
  };

  const getDetailedLastSeen = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}, ${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
    if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}, ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
    if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
    return 'Just now';
  };

  // Render modal content (shared between web and mobile)
  const renderModalContent = () => (
    <>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Ionicons name="add-circle" size={24} color={colors.primary} />
          </View>
          <View style={styles.headerTextContainer}>
            <ThemedText type="subtitle" style={[styles.title, { color: colors.text }]}>
              Add Weather Station
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.text }]}>
              Discover and add new weather stations from Firebase
            </ThemedText>
          </View>
        </View>
        <TouchableOpacity
          onPress={handleClose}
          style={[styles.closeButton, { backgroundColor: `${colors.text}08` }]}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isScanning ? (
          <View style={styles.scanningContainer}>
            <View style={[styles.scanningIconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
            <ThemedText style={[styles.scanningText, { color: colors.text }]}>
              Scanning Firebase
            </ThemedText>
            <ThemedText style={[styles.scanningSubtext, { color: colors.text }]}>
              Searching for unused device IDs... This may take a few moments
            </ThemedText>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <View style={[styles.errorIconContainer, { backgroundColor: `${colors.error || '#FF3B30'}15` }]}>
              <Ionicons name="alert-circle" size={48} color={colors.error || '#FF3B30'} />
            </View>
            <ThemedText style={[styles.errorTitle, { color: colors.text }]}>
              Scan Failed
            </ThemedText>
            <ThemedText style={[styles.errorText, { color: colors.text }]}>
              {error}
            </ThemedText>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={handleScan}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={18} color="#FFFFFF" />
              <ThemedText style={styles.retryButtonText}>Retry Scan</ThemedText>
            </TouchableOpacity>
          </View>
        ) : unusedDeviceIds.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: `${colors.success || '#4CAF50'}15` }]}>
              <Ionicons name="checkmark-circle" size={56} color={colors.success || '#4CAF50'} />
            </View>
            <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>
              All Stations Added
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: colors.text }]}>
              All device IDs in Firebase are already being displayed as weather stations.
            </ThemedText>
          </View>
        ) : showMunicipalityPicker ? (
          <>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="location" size={20} color={colors.primary} />
              </View>
              <View style={styles.sectionHeaderText}>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  Select Municipality
                </ThemedText>
                <ThemedText style={[styles.sectionDescription, { color: colors.text }]}>
                  Choose the municipality for {selectedDeviceId}
                  {selectedMunicipality && (
                    <ThemedText style={{ fontStyle: 'italic', opacity: 0.7 }}>
                      {' '}(Auto-suggested: {selectedMunicipality.name})
                    </ThemedText>
                  )}
                </ThemedText>
              </View>
            </View>
            
            <ScrollView
              style={styles.municipalityList}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
            >
              {municipalities.map((municipality) => (
                <TouchableOpacity
                  key={municipality.id}
                  onPress={() => handleSelectMunicipality(municipality)}
                  activeOpacity={0.7}
                  style={[
                    styles.municipalityItem,
                    {
                      backgroundColor: selectedMunicipality?.id === municipality.id
                        ? `${colors.primary}08`
                        : colors.surface,
                      borderColor: selectedMunicipality?.id === municipality.id
                        ? colors.primary
                        : colors.border,
                      borderWidth: selectedMunicipality?.id === municipality.id ? 2 : StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <View style={styles.municipalityContent}>
                    <View style={[
                      styles.municipalityIconContainer,
                      {
                        backgroundColor: selectedMunicipality?.id === municipality.id
                          ? `${colors.primary}15`
                          : `${colors.text}08`,
                      }
                    ]}>
                      <Ionicons
                        name="location"
                        size={18}
                        color={selectedMunicipality?.id === municipality.id ? colors.primary : colors.text}
                      />
                    </View>
                    <ThemedText
                      style={[
                        styles.municipalityName,
                        {
                          color: selectedMunicipality?.id === municipality.id ? colors.primary : colors.text,
                          fontWeight: selectedMunicipality?.id === municipality.id ? '600' : '500',
                        },
                      ]}
                    >
                      {municipality.name}
                    </ThemedText>
                  </View>
                  {selectedMunicipality?.id === municipality.id && (
                    <View style={[styles.checkmarkContainer, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        ) : showLocationInput ? (
          <>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="pin" size={20} color={colors.primary} />
              </View>
              <View style={styles.sectionHeaderText}>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  Exact Station Location
                </ThemedText>
                <ThemedText style={[styles.sectionDescription, { color: colors.text }]}>
                  {existingStations.some(s => s.municipality.name === selectedMunicipality?.name)
                    ? `Enter the exact location to distinguish this station from others in ${selectedMunicipality?.name}`
                    : `Enter the exact location where this weather station is installed`}
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.locationInputContainer}>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                <Ionicons name="location" size={20} color={colors.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.locationInput, { color: colors.text }]}
                  placeholder="e.g., PDRRMO Office, Barangay Dahican"
                  placeholderTextColor={colors.text ? `${colors.text}60` : '#999'}
                  value={locationName}
                  onChangeText={(text) => {
                    setLocationName(text);
                    setError(null); // Clear error when user types
                  }}
                  autoCapitalize="words"
                  returnKeyType="done"
                  multiline={false}
                />
              </View>
              
              {existingStations.some(s => s.municipality.name === selectedMunicipality?.name) && (
                <View style={[styles.existingStationsHint, { backgroundColor: `${colors.primary}08` }]}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                  <View style={styles.hintTextContainer}>
                    <ThemedText style={[styles.hintTitle, { color: colors.text }]}>
                      Other stations in {selectedMunicipality?.name}:
                    </ThemedText>
                    <ThemedText style={[styles.hintText, { color: colors.text }]}>
                      {existingStations
                        .filter(s => s.municipality.name === selectedMunicipality?.name)
                        .map(s => s.deviceId || 'Base Station')
                        .join(', ')}
                    </ThemedText>
                  </View>
                </View>
              )}
              
              <View style={[styles.locationHelpCard, { backgroundColor: `${colors.text}05` }]}>
                <Ionicons name="help-circle-outline" size={16} color={colors.primary} />
                <ThemedText style={[styles.helpText, { color: colors.text }]}>
                  Include specific details like building name, barangay, or landmark to help identify the exact location
                </ThemedText>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="hardware-chip" size={20} color={colors.primary} />
              </View>
              <View style={styles.sectionHeaderText}>
                <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
                  Available Device IDs
                </ThemedText>
                <ThemedText style={[styles.sectionDescription, { color: colors.text }]}>
                  {unusedDeviceIds.length} device{unusedDeviceIds.length !== 1 ? 's' : ''} found • Select one to add
                </ThemedText>
              </View>
            </View>
            
            {unusedDeviceIds.map((deviceInfo) => (
              <TouchableOpacity
                key={deviceInfo.deviceId}
                onPress={() => handleSelectDevice(deviceInfo.deviceId)}
                activeOpacity={0.7}
                style={[
                  styles.deviceCard,
                  {
                    backgroundColor: selectedDeviceId === deviceInfo.deviceId
                      ? `${colors.primary}08`
                      : colors.surface,
                    borderColor: selectedDeviceId === deviceInfo.deviceId
                      ? colors.primary
                      : colors.border,
                    borderWidth: selectedDeviceId === deviceInfo.deviceId ? 2 : StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <View style={styles.deviceCardHeader}>
                  <View style={styles.deviceIdContainer}>
                    <View style={[styles.deviceIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                      <Ionicons name="hardware-chip" size={18} color={colors.primary} />
                    </View>
                    <View style={styles.deviceIdTextContainer}>
                      <ThemedText style={[styles.deviceId, { color: colors.text }]}>
                        {deviceInfo.deviceId}
                      </ThemedText>
                      <ThemedText style={[styles.deviceIdLabel, { color: colors.text }]}>
                        Device ID
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${colors.success || '#4CAF50'}20` }]}>
                    <View style={[styles.statusDot, { backgroundColor: colors.success || '#4CAF50' }]} />
                    <ThemedText style={[styles.statusText, { color: colors.success || '#4CAF50' }]}>
                      Active
                    </ThemedText>
                  </View>
                </View>
                
                <View style={styles.deviceCardBody}>
                  {deviceInfo.lastData && (
                    <View style={styles.deviceDataContainer}>
                      <TouchableOpacity
                        style={styles.dataSectionHeader}
                        onPress={() => {
                          setExpandedDeviceIds(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(deviceInfo.deviceId)) {
                              newSet.delete(deviceInfo.deviceId);
                            } else {
                              newSet.add(deviceInfo.deviceId);
                            }
                            return newSet;
                          });
                        }}
                        activeOpacity={0.7}
                      >
                        <ThemedText style={[styles.dataSectionTitle, { color: colors.text }]}>
                          Latest Reading
                        </ThemedText>
                        <Ionicons
                          name={expandedDeviceIds.has(deviceInfo.deviceId) ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={colors.text}
                          style={{ opacity: 0.6 }}
                        />
                      </TouchableOpacity>
                      {expandedDeviceIds.has(deviceInfo.deviceId) && (
                        <View style={styles.deviceDataRow}>
                          <View style={[styles.dataCard, { backgroundColor: `${colors.text}05` }]}>
                            <Ionicons name="thermometer" size={18} color="#FF6B35" />
                            <ThemedText style={[styles.dataValue, { color: colors.text }]}>
                              {deviceInfo.lastData.temperature.toFixed(1)}°C
                            </ThemedText>
                            <ThemedText style={[styles.dataLabel, { color: colors.text }]}>
                              Temperature
                            </ThemedText>
                          </View>
                          <View style={[styles.dataCard, { backgroundColor: `${colors.text}05` }]}>
                            <Ionicons name="water" size={18} color="#4A90E2" />
                            <ThemedText style={[styles.dataValue, { color: colors.text }]}>
                              {deviceInfo.lastData.humidity.toFixed(1)}%
                            </ThemedText>
                            <ThemedText style={[styles.dataLabel, { color: colors.text }]}>
                              Humidity
                            </ThemedText>
                          </View>
                          <View style={[styles.dataCard, { backgroundColor: `${colors.text}05` }]}>
                            <Ionicons name="rainy" size={18} color="#5B9BD5" />
                            <ThemedText style={[styles.dataValue, { color: colors.text }]}>
                              {deviceInfo.lastData.rainfall.toFixed(1)}mm
                            </ThemedText>
                            <ThemedText style={[styles.dataLabel, { color: colors.text }]}>
                              Rainfall
                            </ThemedText>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                
                {selectedDeviceId === deviceInfo.deviceId && (
                  <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    <ThemedText style={styles.selectedText}>Selected</ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      {/* Footer Actions */}
      {!isScanning && !error && !showMunicipalityPicker && !showLocationInput && (
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[
              styles.footerButton,
              styles.confirmButton,
              { backgroundColor: colors.primary },
              !selectedDeviceId && styles.disabledButton,
            ]}
            onPress={() => {
              if (selectedDeviceId) {
                // Auto-detect municipality if possible, then show picker
                const deviceIdUpper = selectedDeviceId.toUpperCase();
                const match = deviceIdUpper.match(/WS-([A-Z-]+?)(?:-\d+|$)/);
                
                if (match) {
                  const namePart = match[1].replace(/-/g, ' ');
                  const matched = municipalities.find(m => {
                    const mName = m.name.toUpperCase()
                      .replace(/^CITY\s+OF\s+/i, '')
                      .replace(/\s+CITY$/i, '')
                      .replace(/\s+/g, '');
                    return mName === namePart || mName.includes(namePart) || namePart.includes(mName);
                  });
                  
                  if (matched) {
                    setSelectedMunicipality(matched);
                  }
                }
                setShowMunicipalityPicker(true);
              }
            }}
            disabled={!selectedDeviceId}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            <ThemedText style={styles.confirmButtonText}>Next</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerButton, styles.cancelButton, { borderColor: colors.border }]}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={18} color={colors.text} />
            <ThemedText style={[styles.footerButtonText, { color: colors.text }]}>
              Close
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
      {!isScanning && !error && showMunicipalityPicker && (
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
            <>
              <TouchableOpacity
                style={[styles.footerButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setShowMunicipalityPicker(false);
                  setSelectedMunicipality(null);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={18} color={colors.text} />
                <ThemedText style={[styles.footerButtonText, { color: colors.text }]}>
                  Back
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.footerButton,
                  styles.confirmButton,
                  { backgroundColor: colors.primary },
                  (!selectedMunicipality || !selectedDeviceId) && styles.disabledButton,
                ]}
                onPress={() => {
                  if (selectedMunicipality) {
                    handleSelectMunicipality(selectedMunicipality);
                  }
                }}
                disabled={!selectedMunicipality || !selectedDeviceId}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                <ThemedText style={styles.confirmButtonText}>Next</ThemedText>
              </TouchableOpacity>
            </>
        </View>
      )}
      {!isScanning && !error && showLocationInput && (
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.footerButton, styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => {
              setShowLocationInput(false);
              setLocationName('');
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
            <ThemedText style={[styles.footerButtonText, { color: colors.text }]}>
              Back
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.footerButton,
              styles.confirmButton,
              { backgroundColor: colors.primary },
              (!selectedMunicipality || !selectedDeviceId) && styles.disabledButton,
            ]}
            onPress={handleConfirmAdd}
            disabled={!selectedMunicipality || !selectedDeviceId}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <ThemedText style={styles.confirmButtonText}>Add Station</ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  // Return null if not visible
  if (!visible) return null;

  // Platform-specific modal rendering
  if (isWeb) {
    // Hybrid RAMP implementation for web with animations
    return (
      <Modal
        visible={visible}
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
            styles.modalContent,
            { 
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim }
              ]
            }
          ]}>
            {renderModalContent()}
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  }

  // Mobile bottom sheet rendering (no complex animations needed)
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {renderModalContent()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayCloseButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    height: '85%',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scanningContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  scanningText: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  scanningSubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 20,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    opacity: 0.6,
    lineHeight: 18,
  },
  deviceCard: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 12,
    position: 'relative',
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
      },
    }),
  },
  deviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  deviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceIdTextContainer: {
    flex: 1,
  },
  deviceId: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  deviceIdLabel: {
    fontSize: 11,
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deviceCardBody: {
    gap: 12,
  },
  infoCard: {
    padding: 12,
    borderRadius: 12,
  },
  deviceInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  deviceInfoTextContainer: {
    flex: 1,
  },
  deviceInfoLabel: {
    fontSize: 11,
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  deviceInfoText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  deviceInfoSubtext: {
    fontSize: 12,
    opacity: 0.6,
  },
  deviceDataContainer: {
    marginTop: 4,
  },
  dataSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dataSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deviceDataRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dataCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  dataValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  dataLabel: {
    fontSize: 10,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  municipalityList: {
    maxHeight: 300,
    marginTop: 8,
  },
  municipalityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
      },
    }),
  },
  municipalityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  municipalityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  municipalityName: {
    fontSize: 15,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    paddingTop: 16,
    borderRadius: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 48,
    ...Platform.select({
      web: {
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      },
    }),
  },
  cancelButton: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  confirmButton: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  disabledButton: {
    opacity: 0.5,
  },
  footerButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  locationInputContainer: {
    gap: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  locationInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 14,
  },
  existingStationsHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  hintTextContainer: {
    flex: 1,
    gap: 4,
  },
  hintTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  hintText: {
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.8,
  },
  locationHelpCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  helpText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.7,
  },
});

