import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';
import { Room } from '../lib/types';
import { DatePicker } from './DatePicker';

interface AddPropertyExpenseFormProps {
  propertyId: string;
  onExpenseAdded: () => void;
}

export function AddPropertyExpenseForm({ propertyId, onExpenseAdded }: AddPropertyExpenseFormProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [expenseName, setExpenseName] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', propertyId)
        .order('room_number');

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleSubmit = async () => {
    if (!expenseName.trim()) {
      Alert.alert('Error', 'Please enter expense name');
      return;
    }

    if (!amount.trim()) {
      Alert.alert('Error', 'Please enter amount');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('property_expenses')
        .insert({
          property_id: propertyId,
          room_id: selectedRoomId || null,
          expense_name: expenseName.trim(),
          amount: amountNum,
          expense_date: expenseDate.toISOString().split('T')[0],
        });

      if (error) throw error;

      Alert.alert('Success', 'Expense added successfully');
      setExpenseName('');
      setAmount('');
      setSelectedRoomId('');
      setExpenseDate(new Date());
      onExpenseAdded();
    } catch (error) {
      console.error('Error adding expense:', error);
      Alert.alert('Error', 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="bg-[#262624] rounded-lg p-4 border border-gray-700">
      <Text className="text-lg font-semibold text-white mb-4">Add Property Expense</Text>
      
      <View className="mb-4">
        <Text className="text-gray-300 mb-2">Room (Optional - Leave blank for general expense)</Text>
        <View className="bg-[#1F1E1D] border border-gray-600 rounded-lg">
          <Picker
            selectedValue={selectedRoomId}
            onValueChange={(itemValue) => setSelectedRoomId(itemValue)}
            style={{ color: 'white', backgroundColor: '#1F1E1D' }}
            dropdownIconColor="white"
          >
            <Picker.Item label="General (No specific room)" value="" />
            {rooms.map((room) => (
              <Picker.Item 
                key={room.id} 
                label={`Room ${room.room_number}`} 
                value={room.id} 
              />
            ))}
          </Picker>
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-gray-300 mb-2">Expense Name</Text>
        <TextInput
          className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
          value={expenseName}
          onChangeText={setExpenseName}
          placeholder="Enter expense name"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View className="mb-4">
        <Text className="text-gray-300 mb-2">Amount (₹)</Text>
        <TextInput
          className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
          value={amount}
          onChangeText={setAmount}
          placeholder="Enter amount"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-6">
        <Text className="text-gray-300 mb-2">Expense Date</Text>
        <DatePicker
          value={expenseDate}
          onChange={setExpenseDate}
          placeholder="Select expense date"
        />
      </View>

      <TouchableOpacity
        className="bg-[#C96342] rounded-lg py-3"
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text className="text-white font-semibold text-center">
          {loading ? 'Adding...' : 'Add Expense'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}