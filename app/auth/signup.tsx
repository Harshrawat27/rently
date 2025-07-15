import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useAuth } from '../../lib/auth';

export default function SignUpScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    if (!agreeToTerms) {
      Alert.alert('Error', 'Please agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      Alert.alert(
        'Success', 
        'Account created successfully! If email confirmation is enabled, please check your email for verification before signing in.',
        [
          { text: 'OK', onPress: () => router.replace('/auth/signin') }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    // TODO: Implement Google sign up with Supabase
    console.log('Sign up with Google');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className='flex-1 bg-[#1F1E1D]'
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        className='px-6'
      >
        {/* Header */}
        <View className='mt-16 mb-8'>
          <Text className='text-white text-3xl font-bold mb-2'>
            Create Account
          </Text>
          <Text className='text-gray-300 text-base'>
            Join Rently and start your journey
          </Text>
        </View>

        {/* Sign Up Form */}
        <View className='space-y-6'>
          {/* Full Name Input */}
          <View>
            <Text className='text-white text-sm font-medium mb-2'>
              Full Name
            </Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder='Enter your full name'
              placeholderTextColor='#9CA3AF'
              autoCapitalize='words'
              className='bg-[#262624] text-white px-4 py-4 rounded-lg border border-gray-600 focus:border-[#C96342]'
            />
          </View>

          {/* Email Input */}
          <View>
            <Text className='text-white text-sm font-medium mb-2'>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder='Enter your email'
              placeholderTextColor='#9CA3AF'
              keyboardType='email-address'
              autoCapitalize='none'
              autoCorrect={false}
              className='bg-[#262624] text-white px-4 py-4 rounded-lg border border-gray-600 focus:border-[#C96342]'
            />
          </View>

          {/* Password Input */}
          <View>
            <Text className='text-white text-sm font-medium mb-2'>
              Password
            </Text>
            <View className='relative'>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder='Create a password'
                placeholderTextColor='#9CA3AF'
                secureTextEntry={!showPassword}
                className='bg-[#262624] text-white px-4 py-4 pr-12 rounded-lg border border-gray-600 focus:border-[#C96342]'
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className='absolute right-4 top-4'
              >
                <Text className='text-gray-400 text-sm'>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text className='text-gray-400 text-xs mt-1'>
              Must be at least 8 characters long
            </Text>
          </View>

          {/* Confirm Password Input */}
          <View>
            <Text className='text-white text-sm font-medium mb-2'>
              Confirm Password
            </Text>
            <View className='relative'>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder='Confirm your password'
                placeholderTextColor='#9CA3AF'
                secureTextEntry={!showConfirmPassword}
                className='bg-[#262624] text-white px-4 py-4 pr-12 rounded-lg border border-gray-600 focus:border-[#C96342]'
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className='absolute right-4 top-4'
              >
                <Text className='text-gray-400 text-sm'>
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Terms and Conditions */}
          <TouchableOpacity
            onPress={() => setAgreeToTerms(!agreeToTerms)}
            className='flex-row items-center space-x-3'
          >
            <View
              className={`w-5 h-5 rounded border-2 ${
                agreeToTerms
                  ? 'bg-[#C96342] border-[#C96342]'
                  : 'border-gray-600'
              } flex items-center justify-center`}
            >
              {agreeToTerms && <Text className='text-white text-xs'>✓</Text>}
            </View>
            <View className='flex-1 flex-row flex-wrap'>
              <Text className='text-gray-300 text-sm'>I agree to the </Text>
              <TouchableOpacity>
                <Text className='text-[#C96342] text-sm'>Terms of Service</Text>
              </TouchableOpacity>
              <Text className='text-gray-300 text-sm'> and </Text>
              <TouchableOpacity>
                <Text className='text-[#C96342] text-sm'>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={!agreeToTerms || loading}
            className={`py-4 rounded-lg mt-6 ${
              agreeToTerms && !loading ? 'bg-[#C96342]' : 'bg-gray-600'
            }`}
          >
            <Text className='text-white text-center text-base font-semibold'>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className='flex-row items-center my-6'>
            <View className='flex-1 h-px bg-gray-600' />
            <Text className='text-gray-400 mx-4 text-sm'>or continue with</Text>
            <View className='flex-1 h-px bg-gray-600' />
          </View>

          {/* Google Sign Up Button */}
          <TouchableOpacity
            onPress={handleGoogleSignUp}
            className='bg-[#262624] border border-gray-600 py-4 rounded-lg flex-row items-center justify-center space-x-3'
          >
            <View className='w-5 h-5 bg-white rounded-full flex items-center justify-center'>
              <Text className='text-[#1F1E1D] text-xs font-bold'>G</Text>
            </View>
            <Text className='text-white text-base font-medium'>
              Continue with Google
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Link */}
        <View className='flex-row justify-center mt-8 mb-8'>
          <Text className='text-gray-300 text-sm'>
            Already have an account?{' '}
          </Text>
          <Link href='/auth/signin' asChild>
            <TouchableOpacity>
              <Text className='text-[#C96342] text-sm font-medium'>
                Sign In
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
