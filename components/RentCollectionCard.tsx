import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { supabase } from '../lib/supabase';
import { RentCollection } from '../lib/types';

interface RentCollectionCardProps {
  rentCollection: RentCollection;
  onUpdate: () => void;
}

export function RentCollectionCard({ rentCollection, onUpdate }: RentCollectionCardProps) {
  const [loading, setLoading] = useState(false);
  const [showElectricityModal, setShowElectricityModal] = useState(false);
  const [electricityBill, setElectricityBill] = useState('0');

  const formatMonth = (month: string) => {
    const date = new Date(month + '-01');
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleCollectRent = async () => {
    if (rentCollection.is_collected) return;
    
    setLoading(true);
    try {
      const electricityAmount = parseFloat(electricityBill) || 0;
      const totalAmount = rentCollection.rent_amount + electricityAmount;
      
      const { error } = await supabase
        .from('rent_collections')
        .update({
          electricity_bill: electricityAmount,
          total_amount: totalAmount,
          is_collected: true,
          collected_date: new Date().toISOString(),
        })
        .eq('id', rentCollection.id);

      if (error) throw error;

      Alert.alert('Success', 'Rent collected successfully');
      setShowElectricityModal(false);
      onUpdate();
    } catch (error) {
      console.error('Error collecting rent:', error);
      Alert.alert('Error', 'Failed to collect rent');
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = !rentCollection.is_collected && new Date() > new Date(rentCollection.due_date);

  return (
    <View className={`bg-[#262624] rounded-lg p-4 mb-3 border ${
      rentCollection.is_collected 
        ? 'border-green-600' 
        : isOverdue 
          ? 'border-red-600' 
          : 'border-yellow-600'
    }`}>
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="text-white font-semibold text-base">
            {formatMonth(rentCollection.month)}
          </Text>
          <Text className="text-gray-400 text-sm">
            Room {rentCollection.room?.room_number} - {rentCollection.tenant?.name}
          </Text>
        </View>
        <View className={`px-2 py-1 rounded-full ${
          rentCollection.is_collected 
            ? 'bg-green-800/20' 
            : isOverdue 
              ? 'bg-red-800/20' 
              : 'bg-yellow-800/20'
        }`}>
          <Text className={`text-xs font-medium ${
            rentCollection.is_collected 
              ? 'text-green-400' 
              : isOverdue 
                ? 'text-red-400' 
                : 'text-yellow-400'
          }`}>
            {rentCollection.is_collected ? 'Collected' : isOverdue ? 'Overdue' : 'Pending'}
          </Text>
        </View>
      </View>

      <View className="space-y-2">
        <View className="flex-row justify-between">
          <Text className="text-gray-300">Rent Amount:</Text>
          <Text className="text-white">₹{rentCollection.rent_amount.toLocaleString()}</Text>
        </View>
        
        {rentCollection.electricity_bill > 0 && (
          <View className="flex-row justify-between">
            <Text className="text-gray-300">Electricity Bill:</Text>
            <Text className="text-white">₹{rentCollection.electricity_bill.toLocaleString()}</Text>
          </View>
        )}
        
        <View className="flex-row justify-between pt-2 border-t border-gray-600">
          <Text className="text-gray-300 font-semibold">Total Amount:</Text>
          <Text className="text-white font-semibold">₹{rentCollection.total_amount.toLocaleString()}</Text>
        </View>
        
        <View className="flex-row justify-between">
          <Text className="text-gray-300">Due Date:</Text>
          <Text className="text-white">{new Date(rentCollection.due_date).toLocaleDateString()}</Text>
        </View>
        
        {rentCollection.is_collected && rentCollection.collected_date && (
          <View className="flex-row justify-between">
            <Text className="text-gray-300">Collected Date:</Text>
            <Text className="text-green-400">{new Date(rentCollection.collected_date).toLocaleDateString()}</Text>
          </View>
        )}
      </View>

      {!rentCollection.is_collected && (
        <TouchableOpacity
          className="bg-[#C96342] rounded-lg py-2 mt-3"
          onPress={() => setShowElectricityModal(true)}
          disabled={loading}
        >
          <Text className="text-white font-semibold text-center">
            {loading ? 'Processing...' : 'COLLECT RENT'}
          </Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={showElectricityModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowElectricityModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-[#262624] rounded-lg p-6 w-80 border border-gray-600">
            <Text className="text-white text-lg font-semibold mb-4">
              Collect Rent - {formatMonth(rentCollection.month)}
            </Text>
            
            <View className="mb-4">
              <Text className="text-gray-300 mb-2">Electricity Bill Amount (₹)</Text>
              <TextInput
                className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
                value={electricityBill}
                onChangeText={setElectricityBill}
                placeholder="Enter electricity bill amount"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
            
            <View className="mb-4 p-3 bg-[#1F1E1D] rounded-lg">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-300">Rent Amount:</Text>
                <Text className="text-white">₹{rentCollection.rent_amount.toLocaleString()}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-300">Electricity Bill:</Text>
                <Text className="text-white">₹{(parseFloat(electricityBill) || 0).toLocaleString()}</Text>
              </View>
              <View className="flex-row justify-between pt-2 border-t border-gray-600">
                <Text className="text-white font-semibold">Total Amount:</Text>
                <Text className="text-white font-semibold">₹{(rentCollection.rent_amount + (parseFloat(electricityBill) || 0)).toLocaleString()}</Text>
              </View>
            </View>
            
            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-[#C96342] rounded-lg py-3"
                onPress={handleCollectRent}
                disabled={loading}
              >
                <Text className="text-white font-semibold text-center">
                  {loading ? 'Collecting...' : 'COLLECT'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 bg-gray-600 rounded-lg py-3"
                onPress={() => setShowElectricityModal(false)}
                disabled={loading}
              >
                <Text className="text-white font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}