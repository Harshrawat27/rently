import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Tenant } from '../lib/types';

interface TenantCardProps {
  tenant: Tenant;
  onPress: () => void;
}

export const TenantCard: React.FC<TenantCardProps> = ({ tenant, onPress }) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200"
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-semibold text-gray-800">
          {tenant.name}
        </Text>
        <View className={`px-2 py-1 rounded-full ${tenant.is_active ? 'bg-green-100' : 'bg-red-100'}`}>
          <Text className={`text-xs font-medium ${tenant.is_active ? 'text-green-700' : 'text-red-700'}`}>
            {tenant.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      
      <Text className="text-gray-600 mb-1">
        Phone: {tenant.phone_number}
      </Text>
      
      <Text className="text-gray-600 mb-1">
        Persons: {tenant.number_of_persons}
      </Text>
      
      <View className="flex-row justify-between mt-2">
        <Text className="text-gray-600">
          Advance: ₹{tenant.advance_amount.toLocaleString()}
        </Text>
        <Text className="text-gray-600">
          Balance: ₹{tenant.balance_amount.toLocaleString()}
        </Text>
      </View>
      
      <Text className="text-gray-500 text-sm mt-2">
        Booking Date: {new Date(tenant.booking_date).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );
};