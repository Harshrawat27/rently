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
      className="bg-[#262624] rounded-lg p-4 mb-4 border border-gray-700"
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-semibold text-white">
          Room {room.room_number}
        </Text>
        <View className={`px-2 py-1 rounded-full ${room.is_occupied ? 'bg-red-800/20' : 'bg-green-800/20'}`}>
          <Text className={`text-xs font-medium ${room.is_occupied ? 'text-red-400' : 'text-green-400'}`}>
            {room.is_occupied ? 'Occupied' : 'Available'}
          </Text>
        </View>
      </View>
      
      <Text className="text-gray-300 mb-1">
        Rent: ₹{room.rent_amount.toLocaleString()}
      </Text>
    </TouchableOpacity>
  );
};