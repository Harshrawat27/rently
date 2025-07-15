// app/auth/signin.tsx
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSignIn = () => {
    // TODO: Implement Supabase sign in logic
    console.log('Sign in with:', { email, password });
  };

  const handleGoogleSignIn = () => {
    // TODO: Implement Google sign in with Supabase
    console.log('Sign in with Google');
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
            Welcome Back
          </Text>
          <Text className='text-gray-300 text-base'>
            Sign in to continue to Rently
          </Text>
        </View>

        {/* Sign In Form */}
        <View className='space-y-6'>
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
                placeholder='Enter your password'
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
          </View>

          {/* Forgot Password */}
          <TouchableOpacity className='self-end'>
            <Text className='text-[#C96342] text-sm font-medium'>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            onPress={handleSignIn}
            className='bg-[#C96342] py-4 rounded-lg mt-6'
          >
            <Text className='text-white text-center text-base font-semibold'>
              Sign In
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View className='flex-row items-center my-6'>
            <View className='flex-1 h-px bg-gray-600' />
            <Text className='text-gray-400 mx-4 text-sm'>or continue with</Text>
            <View className='flex-1 h-px bg-gray-600' />
          </View>

          {/* Google Sign In Button */}
          <TouchableOpacity
            onPress={handleGoogleSignIn}
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

        {/* Sign Up Link */}
        <View className='flex-row justify-center mt-8 mb-8'>
          <Text className='text-gray-300 text-sm'>Don't have an account? </Text>
          <Link href='/auth/signin' asChild>
            <TouchableOpacity>
              <Text className='text-[#C96342] text-sm font-medium'>
                Sign Up
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
