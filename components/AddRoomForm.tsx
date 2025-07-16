import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

interface AddRoomFormProps {
  propertyId: string;
  onRoomAdded: () => void;
}

export const AddRoomForm: React.FC<AddRoomFormProps> = ({ propertyId, onRoomAdded }) => {
  const [roomNumber, setRoomNumber] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!roomNumber.trim() || !rentAmount.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const rentAmountNumber = parseFloat(rentAmount);
    if (isNaN(rentAmountNumber) || rentAmountNumber <= 0) {
      Alert.alert('Error', 'Please enter a valid rent amount');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('rooms')
        .insert([{ 
          property_id: propertyId,
          room_number: roomNumber.trim(),
          rent_amount: rentAmountNumber
        }]);

      if (error) throw error;

      Alert.alert('Success', 'Room added successfully');
      setRoomNumber('');
      setRentAmount('');
      onRoomAdded();
    } catch (error) {
      Alert.alert('Error', 'Failed to add room');
      console.error('Error adding room:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="bg-[#262624] rounded-lg p-6 border border-gray-700">
      <Text className="text-xl font-bold text-white mb-6">Add New Room</Text>
      
      <View className="mb-4">
        <Text className="text-white mb-2 font-medium">Room Number *</Text>
        <TextInput
          className="bg-[#1F1E1D] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#C96342]"
          value={roomNumber}
          onChangeText={setRoomNumber}
          placeholder="Enter room number"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="mb-6">
        <Text className="text-white mb-2 font-medium">Rent Amount *</Text>
        <TextInput
          className="bg-[#1F1E1D] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#C96342]"
          value={rentAmount}
          onChangeText={setRentAmount}
          placeholder="Enter rent amount"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity
        className={`rounded-lg py-3 px-6 ${loading ? 'bg-gray-600' : 'bg-[#C96342]'}`}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text className="text-white text-center font-semibold">
          {loading ? 'Adding...' : 'Add Room'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};