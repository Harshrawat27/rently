import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

interface AddPropertyFormProps {
  onPropertyAdded: () => void;
}

export const AddPropertyForm: React.FC<AddPropertyFormProps> = ({ onPropertyAdded }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!name.trim() || !address.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('properties')
        .insert([{ 
          user_id: user.id,
          name: name.trim(), 
          address: address.trim(), 
          description: description.trim() 
        }]);

      if (error) throw error;

      Alert.alert('Success', 'Property added successfully');
      setName('');
      setAddress('');
      setDescription('');
      onPropertyAdded();
    } catch (error) {
      Alert.alert('Error', 'Failed to add property');
      console.error('Error adding property:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <Text className="text-xl font-bold text-gray-800 mb-6">Add New Property</Text>
      
      <View className="mb-4">
        <Text className="text-gray-700 mb-2 font-medium">Property Name *</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
          value={name}
          onChangeText={setName}
          placeholder="Enter property name"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="mb-4">
        <Text className="text-gray-700 mb-2 font-medium">Address *</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
          value={address}
          onChangeText={setAddress}
          placeholder="Enter property address"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
        />
      </View>

      <View className="mb-6">
        <Text className="text-gray-700 mb-2 font-medium">Description</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
          value={description}
          onChangeText={setDescription}
          placeholder="Enter property description (optional)"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity
        className={`rounded-lg py-3 px-6 ${loading ? 'bg-gray-400' : 'bg-blue-600'}`}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text className="text-white text-center font-semibold">
          {loading ? 'Adding...' : 'Add Property'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};