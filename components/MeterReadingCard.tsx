import React from 'react';
import { View, Text } from 'react-native';
import { ElectricMeterReading } from '../lib/types';

interface MeterReadingCardProps {
  reading: ElectricMeterReading;
}

export const MeterReadingCard: React.FC<MeterReadingCardProps> = ({ reading }) => {
  return (
    <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-200">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-semibold text-gray-800">
          {new Date(reading.reading_date).toLocaleDateString()}
        </Text>
        <Text className="text-green-600 font-medium">
          {reading.units_consumed} units
        </Text>
      </View>
      
      <View className="flex-row justify-between mt-2">
        <View>
          <Text className="text-gray-500 text-sm">Previous Reading</Text>
          <Text className="text-gray-800 font-medium">
            {reading.previous_reading}
          </Text>
        </View>
        <View>
          <Text className="text-gray-500 text-sm">Current Reading</Text>
          <Text className="text-gray-800 font-medium">
            {reading.current_reading}
          </Text>
        </View>
      </View>
    </View>
  );
};