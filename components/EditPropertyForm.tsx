import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { Property } from '../lib/types';

interface EditPropertyFormProps {
  property: Property;
  onPropertyUpdated: () => void;
  onCancel: () => void;
}

export function EditPropertyForm({ property, onPropertyUpdated, onCancel }: EditPropertyFormProps) {
  const [name, setName] = useState(property.name);
  const [address, setAddress] = useState(property.address);
  const [description, setDescription] = useState(property.description || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a property name');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please enter a property address');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({
          name: name.trim(),
          address: address.trim(),
          description: description.trim() || null,
        })
        .eq('id', property.id);

      if (error) throw error;

      Alert.alert('Success', 'Property updated successfully');
      onPropertyUpdated();
    } catch (error) {
      console.error('Error updating property:', error);
      Alert.alert('Error', 'Failed to update property');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="bg-[#262624] rounded-lg p-4 border border-gray-700">
      <Text className="text-lg font-semibold text-white mb-4">Edit Property</Text>
      
      <View className="mb-4">
        <Text className="text-gray-300 mb-2">Property Name</Text>
        <TextInput
          className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
          value={name}
          onChangeText={setName}
          placeholder="Enter property name"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="mb-4">
        <Text className="text-gray-300 mb-2">Address</Text>
        <TextInput
          className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
          value={address}
          onChangeText={setAddress}
          placeholder="Enter property address"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={2}
        />
      </View>

      <View className="mb-6">
        <Text className="text-gray-300 mb-2">Description (Optional)</Text>
        <TextInput
          className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
          value={description}
          onChangeText={setDescription}
          placeholder="Enter property description"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
        />
      </View>

      <View className="flex-row space-x-3">
        <TouchableOpacity
          className="flex-1 bg-[#C96342] rounded-lg py-3"
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-center">
            {loading ? 'Updating...' : 'Update Property'}
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