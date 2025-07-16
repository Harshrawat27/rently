import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Property } from '../lib/types';

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress }) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-[#262624] rounded-lg p-4 mb-4 border border-gray-700"
    >
      <Text className="text-lg font-semibold text-white mb-2">
        {property.name}
      </Text>
      <Text className="text-gray-300 mb-2">
        {property.address}
      </Text>
      {property.description && (
        <Text className="text-gray-400 text-sm">
          {property.description}
        </Text>
      )}
    </TouchableOpacity>
  );
};