import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Tenant } from '../lib/types';
import { supabase } from '../lib/supabase';

interface TenantCardProps {
  tenant: Tenant;
  onPress: () => void;
  onUpdate?: () => void;
}

export const TenantCard: React.FC<TenantCardProps> = ({ tenant, onPress, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState(tenant.advance_amount.toString());
  const [editingBalance, setEditingBalance] = useState(tenant.balance_amount.toString());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const advance = parseFloat(editingAdvance);
    const balance = parseFloat(editingBalance);

    if (isNaN(advance) || advance < 0) {
      Alert.alert('Error', 'Please enter a valid advance amount');
      return;
    }

    if (isNaN(balance) || balance < 0) {
      Alert.alert('Error', 'Please enter a valid balance amount');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ 
          advance_amount: advance,
          balance_amount: balance
        })
        .eq('id', tenant.id);

      if (error) throw error;

      setIsEditing(false);
      onUpdate?.();
      Alert.alert('Success', 'Tenant details updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update tenant details');
      console.error('Error updating tenant:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingAdvance(tenant.advance_amount.toString());
    setEditingBalance(tenant.balance_amount.toString());
    setIsEditing(false);
  };
  return (
    <View className="bg-[#262624] rounded-lg p-4 mb-4 border border-gray-700">
      <View className="flex-row justify-between items-start mb-2">
        <TouchableOpacity onPress={onPress} className="flex-1">
          <Text className="text-lg font-semibold text-white">
            {tenant.name}
          </Text>
        </TouchableOpacity>
        <View className="flex-row items-center space-x-2">
          <View className={`px-2 py-1 rounded-full ${tenant.is_active ? 'bg-green-800/20' : 'bg-red-800/20'}`}>
            <Text className={`text-xs font-medium ${tenant.is_active ? 'text-green-400' : 'text-red-400'}`}>
              {tenant.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setIsEditing(!isEditing)}
            className="bg-[#C96342] rounded px-2 py-1"
          >
            <Text className="text-white text-xs font-medium">
              {isEditing ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text className="text-gray-300 mb-1">
        Phone: {tenant.phone_number}
      </Text>
      
      <Text className="text-gray-300 mb-1">
        Persons: {tenant.number_of_persons}
      </Text>
      
      <View className="flex-row justify-between mt-2">
        {isEditing ? (
          <>
            <View className="flex-1 mr-2">
              <Text className="text-gray-300 text-sm mb-1">Advance:</Text>
              <TextInput
                className="bg-[#1F1E1D] border border-gray-600 rounded px-2 py-1 text-white text-sm"
                value={editingAdvance}
                onChangeText={setEditingAdvance}
                keyboardType="numeric"
                placeholder="Advance amount"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-gray-300 text-sm mb-1">Balance:</Text>
              <TextInput
                className="bg-[#1F1E1D] border border-gray-600 rounded px-2 py-1 text-white text-sm"
                value={editingBalance}
                onChangeText={setEditingBalance}
                keyboardType="numeric"
                placeholder="Balance amount"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </>
        ) : (
          <>
            <Text className="text-gray-300">
              Advance: ₹{tenant.advance_amount.toLocaleString()}
            </Text>
            <Text className="text-gray-300">
              Balance: ₹{tenant.balance_amount.toLocaleString()}
            </Text>
          </>
        )}
      </View>
      
      <Text className="text-gray-400 text-sm mt-2">
        Booking Date: {new Date(tenant.booking_date).toLocaleDateString()}
      </Text>
      
      {isEditing && (
        <View className="flex-row space-x-2 mt-3">
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className={`flex-1 rounded py-2 ${saving ? 'bg-gray-600' : 'bg-[#C96342]'}`}
          >
            <Text className="text-white text-center font-medium text-sm">
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCancel}
            className="flex-1 bg-gray-600 rounded py-2"
          >
            <Text className="text-white text-center font-medium text-sm">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};