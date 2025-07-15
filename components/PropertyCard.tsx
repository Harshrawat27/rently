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
      className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200"
    >
      <Text className="text-lg font-semibold text-gray-800 mb-2">
        {property.name}
      </Text>
      <Text className="text-gray-600 mb-2">
        {property.address}
      </Text>
      {property.description && (
        <Text className="text-gray-500 text-sm">
          {property.description}
        </Text>
      )}
    </TouchableOpacity>
  );
};