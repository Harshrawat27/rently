import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Room } from '../lib/types';

interface EditRoomFormProps {
  room: Room;
  onRoomUpdated: () => void;
  onCancel: () => void;
}

export function EditRoomForm({ room, onRoomUpdated, onCancel }: EditRoomFormProps) {
  const [roomNumber, setRoomNumber] = useState(room.room_number);
  const [rentAmount, setRentAmount] = useState(room.rent_amount.toString());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!roomNumber.trim()) {
      Alert.alert('Error', 'Please enter a room number');
      return;
    }

    if (!rentAmount.trim()) {
      Alert.alert('Error', 'Please enter rent amount');
      return;
    }

    const rentAmountNum = parseFloat(rentAmount);
    if (isNaN(rentAmountNum) || rentAmountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid rent amount');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('rooms')
        .update({
          room_number: roomNumber.trim(),
          rent_amount: rentAmountNum,
        })
        .eq('id', room.id);

      if (error) throw error;

      Alert.alert('Success', 'Room updated successfully');
      onRoomUpdated();
    } catch (error) {
      console.error('Error updating room:', error);
      Alert.alert('Error', 'Failed to update room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="bg-[#262624] rounded-lg p-4 border border-gray-700">
      <Text className="text-lg font-semibold text-white mb-4">Edit Room</Text>
      
      <View className="mb-4">
        <Text className="text-gray-300 mb-2">Room Number</Text>
        <TextInput
          className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
          value={roomNumber}
          onChangeText={setRoomNumber}
          placeholder="Enter room number"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="mb-6">
        <Text className="text-gray-300 mb-2">Rent Amount (₹)</Text>
        <TextInput
          className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
          value={rentAmount}
          onChangeText={setRentAmount}
          placeholder="Enter rent amount"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>

      <View className="flex-row space-x-3">
        <TouchableOpacity
          className="flex-1 bg-[#C96342] rounded-lg py-3"
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-center">
            {loading ? 'Updating...' : 'Update Room'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="flex-1 bg-gray-600 rounded-lg py-3"
          onPress={onCancel}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-center">Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}