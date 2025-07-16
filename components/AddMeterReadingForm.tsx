import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { CustomDatePicker } from './DatePicker';

interface AddMeterReadingFormProps {
  tenantId: string;
  onReadingAdded: () => void;
}

export const AddMeterReadingForm: React.FC<AddMeterReadingFormProps> = ({ tenantId, onReadingAdded }) => {
  const [currentReading, setCurrentReading] = useState('');
  const [previousReading, setPreviousReading] = useState('');
  const [readingDate, setReadingDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!currentReading.trim() || !previousReading.trim() || !readingDate.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const current = parseFloat(currentReading);
    const previous = parseFloat(previousReading);

    if (isNaN(current) || current < 0) {
      Alert.alert('Error', 'Please enter a valid current reading');
      return;
    }

    if (isNaN(previous) || previous < 0) {
      Alert.alert('Error', 'Please enter a valid previous reading');
      return;
    }

    if (current < previous) {
      Alert.alert('Error', 'Current reading cannot be less than previous reading');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('electric_meter_readings')
        .insert([{ 
          tenant_id: tenantId,
          current_reading: current,
          previous_reading: previous,
          reading_date: readingDate
        }]);

      if (error) throw error;

      Alert.alert('Success', 'Meter reading added successfully');
      setCurrentReading('');
      setPreviousReading('');
      setReadingDate('');
      onReadingAdded();
    } catch (error) {
      Alert.alert('Error', 'Failed to add meter reading');
      console.error('Error adding meter reading:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="bg-[#262624] rounded-lg p-6 border border-gray-700">
      <Text className="text-xl font-bold text-white mb-6">Add Meter Reading</Text>
      
      <CustomDatePicker
        value={readingDate}
        onChangeText={setReadingDate}
        label="Reading Date"
        placeholder="Select reading date"
        required
      />

      <View className="mb-4">
        <Text className="text-white mb-2 font-medium">Previous Reading *</Text>
        <TextInput
          className="bg-[#1F1E1D] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#C96342]"
          value={previousReading}
          onChangeText={setPreviousReading}
          placeholder="Enter previous meter reading"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
        />
      </View>

      <View className="mb-6">
        <Text className="text-white mb-2 font-medium">Current Reading *</Text>
        <TextInput
          className="bg-[#1F1E1D] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#C96342]"
          value={currentReading}
          onChangeText={setCurrentReading}
          placeholder="Enter current meter reading"
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
          {loading ? 'Adding...' : 'Add Reading'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};