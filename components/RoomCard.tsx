import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Room } from '../lib/types';

interface RoomCardProps {
  room: Room;
  onPress: () => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onPress }) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200"
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-semibold text-gray-800">
          Room {room.room_number}
        </Text>
        <View className={`px-2 py-1 rounded-full ${room.is_occupied ? 'bg-red-100' : 'bg-green-100'}`}>
          <Text className={`text-xs font-medium ${room.is_occupied ? 'text-red-700' : 'text-green-700'}`}>
            {room.is_occupied ? 'Occupied' : 'Available'}
          </Text>
        </View>
      </View>
      
      <Text className="text-gray-600 mb-1">
        Rent: ₹{room.rent_amount.toLocaleString()}
      </Text>
    </TouchableOpacity>
  );
};