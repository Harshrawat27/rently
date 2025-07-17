import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { CustomDatePicker } from './DatePicker';

interface AddTenantFormProps {
  roomId: string;
  onTenantAdded: () => void;
}

export const AddTenantForm: React.FC<AddTenantFormProps> = ({ roomId, onTenantAdded }) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [numberOfPersons, setNumberOfPersons] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !phoneNumber.trim() || !bookingDate || !numberOfPersons) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(bookingDate)) {
      Alert.alert('Error', 'Please enter date in YYYY-MM-DD format');
      return;
    }

    const parsedDate = new Date(bookingDate);
    if (isNaN(parsedDate.getTime()) || parsedDate.toISOString().split('T')[0] !== bookingDate) {
      Alert.alert('Error', 'Please enter a valid date in YYYY-MM-DD format');
      return;
    }

    const persons = parseInt(numberOfPersons);

    if (isNaN(persons) || persons <= 0) {
      Alert.alert('Error', 'Please enter a valid number of persons');
      return;
    }

    setLoading(true);
    try {
      const { error: tenantError } = await supabase
        .from('tenants')
        .insert([{ 
          room_id: roomId,
          name: name.trim(),
          phone_number: phoneNumber.trim(),
          booking_date: bookingDate,
          advance_amount: 0, // Default to 0, will be managed separately
          balance_amount: 0, // Default to 0, will be managed separately
          number_of_persons: persons
        }]);

      if (tenantError) throw tenantError;

      const { error: roomError } = await supabase
        .from('rooms')
        .update({ is_occupied: true })
        .eq('id', roomId);

      if (roomError) throw roomError;

      Alert.alert('Success', 'Tenant added successfully. You can now manage advance and balance payments from the tenant details page.');
      setName('');
      setPhoneNumber('');
      setBookingDate('');
      setNumberOfPersons('');
      onTenantAdded();
    } catch (error) {
      Alert.alert('Error', 'Failed to add tenant');
      console.error('Error adding tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="bg-[#262624] rounded-lg p-6 border border-gray-700">
      <Text className="text-xl font-bold text-white mb-6">Add New Tenant</Text>
      
      <View className="mb-4">
        <Text className="text-white mb-2 font-medium">Tenant Name *</Text>
        <TextInput
          className="bg-[#1F1E1D] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#C96342]"
          value={name}
          onChangeText={setName}
          placeholder="Enter tenant name"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="mb-4">
        <Text className="text-white mb-2 font-medium">Phone Number *</Text>
        <TextInput
          className="bg-[#1F1E1D] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#C96342]"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="Enter phone number"
          placeholderTextColor="#9CA3AF"
          keyboardType="phone-pad"
        />
      </View>

      <CustomDatePicker
        value={bookingDate}
        onChangeText={setBookingDate}
        label="Booking Date"
        placeholder="Select booking date"
        required
      />

      <View className="mb-6">
        <Text className="text-white mb-2 font-medium">Number of Persons *</Text>
        <TextInput
          className="bg-[#1F1E1D] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#C96342]"
          value={numberOfPersons}
          onChangeText={setNumberOfPersons}
          placeholder="Enter number of persons"
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
          {loading ? 'Adding...' : 'Add Tenant'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};