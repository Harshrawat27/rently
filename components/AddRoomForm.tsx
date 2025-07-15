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
    <View className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <Text className="text-xl font-bold text-gray-800 mb-6">Add New Room</Text>
      
      <View className="mb-4">
        <Text className="text-gray-700 mb-2 font-medium">Room Number *</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
          value={roomNumber}
          onChangeText={setRoomNumber}
          placeholder="Enter room number"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="mb-6">
        <Text className="text-gray-700 mb-2 font-medium">Rent Amount *</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
          value={rentAmount}
          onChangeText={setRentAmount}
          placeholder="Enter rent amount"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity
        className={`rounded-lg py-3 px-6 ${loading ? 'bg-gray-400' : 'bg-blue-600'}`}
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