import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { ElectricMeterReading } from '../lib/types';
import { supabase } from '../lib/supabase';

interface MeterReadingCardProps {
  reading: ElectricMeterReading;
  onUpdate?: () => void;
}

export const MeterReadingCard: React.FC<MeterReadingCardProps> = ({ reading, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingPrevious, setEditingPrevious] = useState(reading.previous_reading.toString());
  const [editingCurrent, setEditingCurrent] = useState(reading.current_reading.toString());
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const previous = parseFloat(editingPrevious);
    const current = parseFloat(editingCurrent);

    if (isNaN(previous) || previous < 0) {
      Alert.alert('Error', 'Please enter a valid previous reading');
      return;
    }

    if (isNaN(current) || current < 0) {
      Alert.alert('Error', 'Please enter a valid current reading');
      return;
    }

    if (current < previous) {
      Alert.alert('Error', 'Current reading cannot be less than previous reading');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('electric_meter_readings')
        .update({ 
          previous_reading: previous,
          current_reading: current
        })
        .eq('id', reading.id);

      if (error) throw error;

      setIsEditing(false);
      onUpdate?.();
      Alert.alert('Success', 'Meter reading updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update meter reading');
      console.error('Error updating meter reading:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingPrevious(reading.previous_reading.toString());
    setEditingCurrent(reading.current_reading.toString());
    setIsEditing(false);
  };
  return (
    <View className="bg-[#262624] rounded-lg p-4 mb-4 border border-gray-700">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-semibold text-white">
          {new Date(reading.reading_date).toLocaleDateString()}
        </Text>
        <View className="flex-row items-center space-x-2">
          <Text className="text-[#C96342] font-medium">
            {reading.units_consumed} units
          </Text>
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
      
      <View className="flex-row justify-between mt-2">
        {isEditing ? (
          <>
            <View className="flex-1 mr-2">
              <Text className="text-gray-300 text-sm mb-1">Previous Reading</Text>
              <TextInput
                className="bg-[#1F1E1D] border border-gray-600 rounded px-2 py-1 text-white text-sm"
                value={editingPrevious}
                onChangeText={setEditingPrevious}
                keyboardType="numeric"
                placeholder="Previous reading"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-gray-300 text-sm mb-1">Current Reading</Text>
              <TextInput
                className="bg-[#1F1E1D] border border-gray-600 rounded px-2 py-1 text-white text-sm"
                value={editingCurrent}
                onChangeText={setEditingCurrent}
                keyboardType="numeric"
                placeholder="Current reading"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </>
        ) : (
          <>
            <View>
              <Text className="text-gray-400 text-sm">Previous Reading</Text>
              <Text className="text-white font-medium">
                {reading.previous_reading}
              </Text>
            </View>
            <View>
              <Text className="text-gray-400 text-sm">Current Reading</Text>
              <Text className="text-white font-medium">
                {reading.current_reading}
              </Text>
            </View>
          </>
        )}
      </View>
      
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