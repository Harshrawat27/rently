// app/auth/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

export default function AuthLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1F1E1D' },
        }}
      >
        <Stack.Screen name='signin' />
        <Stack.Screen name='signup' />
      </Stack>
      <StatusBar style='light' backgroundColor='#1F1E1D' />
    </>
  );
}
