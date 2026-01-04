import { SignupForm } from '@/components/auth/SignupForm';
import { SuccessModal } from '@/components/modals/SuccessModal';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSignup } from '@/hooks/useSignup';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignupScreen() {
  const { signup, isLoading, error } = useSignup();
  const colorScheme = useColorScheme();
  const { isDark } = useTheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  // State for success modal
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  // Listen to keyboard show/hide events
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handleSignup = async (
    fullName: string, 
    displayName: string,
    username: string,
    email: string, 
    password: string
  ) => {
    try {
      const success = await signup(fullName, displayName, username, email, password);
      if (success) {
        // Show success modal instead of alert
        setSuccessModalVisible(true);
      }
    } catch (err) {
      // Error handling is already done in the useSignup hook
    }
  };
  
  const handleCloseModal = () => {
    setSuccessModalVisible(false);
    
    // Force form to remount by changing the key
    // This ensures a completely fresh form state
    setFormKey(prev => prev + 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      
      {/* Background gradient */}
      <LinearGradient
        colors={isDark ? 
          ['#121212', '#1E1E1E', '#121212'] : 
          [colors.background, '#f5f7fa', colors.background]}
        style={styles.backgroundGradient}
      />
      
      {/* Decorative elements */}
      <View style={styles.decorationContainer}>
        <View style={[styles.decorationCircle, { backgroundColor: `${colors.primary}15` }]} />
        <View style={[styles.decorationCircle, styles.decorationCircle2, { backgroundColor: `${colors.secondary}10` }]} />
      </View>
      
      <SafeAreaView style={{ flex: 1 }}>
        {/* Back to Home Button - Web Only */}
        {Platform.OS === 'web' && (
          <View style={styles.topNavContainer}>
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push('/home')}
            >
              <Ionicons name="arrow-back" size={18} color={colors.primary} />
              <ThemedText style={[styles.backButtonText, { color: colors.primary }]}>
                Back to Home
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
        
        <ScrollView 
          style={styles.scrollViewContainer}
          contentContainerStyle={[
            styles.scrollView,
            { paddingBottom: isKeyboardVisible 
              ? (Platform.OS === 'android' ? 200 : 150) 
              : (Platform.OS === 'android' ? 40 : 30)
            }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
          keyboardDismissMode="interactive"
          nestedScrollEnabled={true}
          bounces={true}
          scrollEnabled={true}
          alwaysBounceVertical={false}
        >
          <View style={styles.container}>
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/respondr_foreground.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            
            <View style={styles.header}>
              <ThemedText type="title" style={styles.title}>
                Self Signup
              </ThemedText>
              <ThemedText style={styles.subtitle}>
                Create your account - activation required by administrator
              </ThemedText>
            </View>
            
            <View style={styles.formContainer}>
              <SignupForm 
                key={formKey}
                onSubmit={handleSignup}
                isLoading={isLoading}
                error={error}
              />
            </View>
            
          </View>
        </ScrollView>
      </SafeAreaView>
      
      {/* Success Modal */}
      <SuccessModal
        visible={successModalVisible}
        message="Your account has been created successfully! However, your account is currently inactive and needs to be activated by an administrator before you can sign in. Please contact an administrator to activate your account."
        onClose={handleCloseModal}
        timeout={8000} // 8 seconds timeout for longer message
      />
    </View>
  );
}

const { width, height } = Dimensions.get('window');
const logoSize = Math.min(width * 0.3, 110);

const styles = StyleSheet.create({
  topNavContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    ...Platform.select({
      web: {
        paddingTop: 20,
      },
    }),
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'flex-start',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      } as any,
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Gabarito',
    marginLeft: 8,
  },
  scrollViewContainer: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    // paddingBottom is set dynamically based on keyboard visibility
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  decorationContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  decorationCircle: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    top: -width * 0.2,
    right: -width * 0.2,
    opacity: 0.8,
  },
  decorationCircle2: {
    width: width * 0.6,
    height: width * 0.6,
    top: height * 0.6,
    left: -width * 0.3,
    opacity: 0.6,
  },
  container: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30, // Extra bottom padding to ensure footer is fully visible
  },
  logoContainer: {
    marginTop: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  logo: {
    width: logoSize,
    height: logoSize,
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: -5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    maxWidth: 300,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.5)' : undefined,
    backdropFilter: Platform.OS === 'ios' ? 'blur(10px)' : undefined,
    borderRadius: 16,
    padding: Platform.OS === 'ios' ? 16 : 0,
    marginVertical: 12,
  },

});