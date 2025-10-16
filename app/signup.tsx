import { SignupForm } from '@/components/auth/SignupForm';
import { SuccessModal } from '@/components/modals/SuccessModal';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSignup } from '@/hooks/useSignup';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
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
  
  // No animations - instant rendering

  const handleSignup = async (
    fullName: string, 
    displayName: string,
    email: string, 
    password: string, 
    userType: string
  ) => {
    try {
      const success = await signup(fullName, displayName, email, password, userType);
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollView}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
          >
            <View style={styles.container}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('@/assets/images/logo-1.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              
              <View style={styles.header}>
                <ThemedText type="title" style={styles.title}>
                  Create Account
                </ThemedText>
                <ThemedText style={styles.subtitle}>
                  Sign up to get started with Respondr
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
        </KeyboardAvoidingView>
      </SafeAreaView>
      
      {/* Success Modal */}
      <SuccessModal
        visible={successModalVisible}
        message="Your account has been created successfully! You can now sign in with your credentials."
        onClose={handleCloseModal}
        timeout={5000} // 5 seconds timeout
      />
    </View>
  );
}

const { width, height } = Dimensions.get('window');
const logoSize = Math.min(width * 0.3, 110);

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: Platform.OS === 'android' ? 80 : 20, // Add padding at the bottom to ensure scrollability
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
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 16,
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