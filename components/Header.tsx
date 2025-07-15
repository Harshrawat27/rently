import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  rightComponent?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  showBackButton = true, 
  rightComponent 
}) => {
  return (
    <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
      <View className="flex-row items-center flex-1">
        {showBackButton && (
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-2 -ml-2"
          >
            <Text className="text-blue-600 text-lg">←</Text>
          </TouchableOpacity>
        )}
        <Text className="text-xl font-bold text-gray-800 flex-1" numberOfLines={1}>
          {title}
        </Text>
      </View>
      {rightComponent && (
        <View className="ml-2">
          {rightComponent}
        </View>
      )}
    </View>
  );
};