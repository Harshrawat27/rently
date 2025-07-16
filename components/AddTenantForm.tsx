import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

interface AddTenantFormProps {
  roomId: string;
  onTenantAdded: () => void;
}

export const AddTenantForm: React.FC<AddTenantFormProps> = ({ roomId, onTenantAdded }) => {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [numberOfPersons, setNumberOfPersons] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !phoneNumber.trim() || !bookingDate || !advanceAmount || !balanceAmount || !numberOfPersons) {
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

    const advance = parseFloat(advanceAmount);
    const balance = parseFloat(balanceAmount);
    const persons = parseInt(numberOfPersons);

    if (isNaN(advance) || advance < 0) {
      Alert.alert('Error', 'Please enter a valid advance amount');
      return;
    }

    if (isNaN(balance) || balance < 0) {
      Alert.alert('Error', 'Please enter a valid balance amount');
      return;
    }

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
          advance_amount: advance,
          balance_amount: balance,
          number_of_persons: persons
        }]);

      if (tenantError) throw tenantError;

      const { error: roomError } = await supabase
        .from('rooms')
        .update({ is_occupied: true })
        .eq('id', roomId);

      if (roomError) throw roomError;

      Alert.alert('Success', 'Tenant added successfully');
      setName('');
      setPhoneNumber('');
      setBookingDate('');
      setAdvanceAmount('');
      setBalanceAmount('');
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

      <View className="mb-4">
        <Text className="text-white mb-2 font-medium">Booking Date *</Text>
        <TextInput
          className="bg-[#1F1E1D] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#C96342]"
          value={bookingDate}
          onChangeText={setBookingDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="mb-4">
        <Text className="text-white mb-2 font-medium">Advance Amount *</Text>
        <TextInput
          className="bg-[#1F1E1D] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#C96342]"
          value={advanceAmount}
          onChangeText={setAdvanceAmount}
          placeholder="Enter advance amount"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-4">
        <Text className="text-white mb-2 font-medium">Balance Amount *</Text>
        <TextInput
          className="bg-[#1F1E1D] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#C96342]"
          value={balanceAmount}
          onChangeText={setBalanceAmount}
          placeholder="Enter balance amount"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>

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