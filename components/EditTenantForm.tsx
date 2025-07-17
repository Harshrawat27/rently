import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Linking } from 'react-native';
import { supabase } from '../lib/supabase';
import { Tenant } from '../lib/types';

interface EditTenantFormProps {
  tenant: Tenant;
  onTenantUpdated: () => void;
  onCancel: () => void;
}

export function EditTenantForm({ tenant, onTenantUpdated, onCancel }: EditTenantFormProps) {
  const [name, setName] = useState(tenant.name);
  const [phoneNumber, setPhoneNumber] = useState(tenant.phone_number);
  const [advanceAmount, setAdvanceAmount] = useState(tenant.advance_amount.toString());
  const [balanceAmount, setBalanceAmount] = useState(tenant.balance_amount.toString());
  const [numberOfPersons, setNumberOfPersons] = useState(tenant.number_of_persons.toString());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter tenant name');
      return;
    }

    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter phone number');
      return;
    }

    const advanceAmountNum = parseFloat(advanceAmount);
    const balanceAmountNum = parseFloat(balanceAmount);
    const numberOfPersonsNum = parseInt(numberOfPersons);

    if (isNaN(advanceAmountNum) || advanceAmountNum < 0) {
      Alert.alert('Error', 'Please enter a valid advance amount');
      return;
    }

    if (isNaN(balanceAmountNum) || balanceAmountNum < 0) {
      Alert.alert('Error', 'Please enter a valid balance amount');
      return;
    }

    if (isNaN(numberOfPersonsNum) || numberOfPersonsNum <= 0) {
      Alert.alert('Error', 'Please enter a valid number of persons');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: name.trim(),
          phone_number: phoneNumber.trim(),
          advance_amount: advanceAmountNum,
          balance_amount: balanceAmountNum,
          number_of_persons: numberOfPersonsNum,
        })
        .eq('id', tenant.id);

      if (error) throw error;

      Alert.alert('Success', 'Tenant updated successfully');
      onTenantUpdated();
    } catch (error) {
      console.error('Error updating tenant:', error);
      Alert.alert('Error', 'Failed to update tenant');
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.openURL(phoneUrl).catch(err => {
      console.error('Error opening phone dialer:', err);
      Alert.alert('Error', 'Unable to open phone dialer');
    });
  };

  return (
    <View className="bg-[#262624] rounded-lg p-4 border border-gray-700">
      <Text className="text-lg font-semibold text-white mb-4">Edit Tenant</Text>
      
      <View className="mb-4">
        <Text className="text-gray-300 mb-2">Name</Text>
        <TextInput
          className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
          value={name}
          onChangeText={setName}
          placeholder="Enter tenant name"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="mb-4">
        <Text className="text-gray-300 mb-2">Phone Number</Text>
        <View className="flex-row space-x-2">
          <TextInput
            className="flex-1 bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter phone number"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
          />
          <TouchableOpacity
            className="bg-green-600 rounded-lg px-4 py-2 justify-center"
            onPress={handleCall}
          >
            <Text className="text-white font-semibold">Call</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-gray-300 mb-2">Advance Amount (₹)</Text>
        <TextInput
          className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
          value={advanceAmount}
          onChangeText={setAdvanceAmount}
          placeholder="Enter advance amount"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-4">
        <Text className="text-gray-300 mb-2">Balance Amount (₹)</Text>
        <TextInput
          className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
          value={balanceAmount}
          onChangeText={setBalanceAmount}
          placeholder="Enter balance amount"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-6">
        <Text className="text-gray-300 mb-2">Number of Persons</Text>
        <TextInput
          className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
          value={numberOfPersons}
          onChangeText={setNumberOfPersons}
          placeholder="Enter number of persons"
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
            {loading ? 'Updating...' : 'Update Tenant'}
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