import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#C96342',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#262624',
          borderTopColor: '#374151',
          borderTopWidth: 1,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name='index'
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name='house.fill' color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='properties'
        options={{
          title: 'Properties',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name='building.2.fill' color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name='rent-collections'
        options={{
          title: 'Rent',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name='creditcard.fill' color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
