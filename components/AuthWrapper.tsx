import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { router, useSegments } from 'expo-router';
import { useAuth } from '../lib/auth';

export const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';
    console.log('AuthWrapper - User:', !!user, 'InAuthGroup:', inAuthGroup, 'Segments:', segments);

    try {
      if (!user && !inAuthGroup) {
        // Redirect to signin if not authenticated
        console.log('Redirecting to signin - no user');
        router.replace('/auth/signin');
      } else if (user && inAuthGroup) {
        // Redirect to main app if authenticated
        console.log('Redirecting to dashboard - user authenticated');
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Navigation error in AuthWrapper:', error);
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Loading...</Text>
      </View>
    );
  }

  return <>{children}</>;
};