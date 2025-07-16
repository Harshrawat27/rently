import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import DatePicker from 'react-native-date-picker';

interface DatePickerProps {
  value: string;
  onChangeText: (date: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export const CustomDatePicker: React.FC<DatePickerProps> = ({
  value,
  onChangeText,
  placeholder = 'Select date',
  label,
  required = false
}) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(value ? new Date(value) : new Date());

  const handleConfirm = (selectedDate: Date) => {
    setOpen(false);
    setDate(selectedDate);
    const formattedDate = selectedDate.toISOString().split('T')[0];
    onChangeText(formattedDate);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const displayDate = value ? new Date(value).toLocaleDateString() : placeholder;

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-white mb-2 font-medium">
          {label} {required && '*'}
        </Text>
      )}
      <TouchableOpacity
        className="bg-[#1F1E1D] border border-gray-600 rounded-lg px-4 py-3 focus:border-[#C96342]"
        onPress={() => setOpen(true)}
      >
        <Text className={`${value ? 'text-white' : 'text-gray-400'}`}>
          {displayDate}
        </Text>
      </TouchableOpacity>
      
      <DatePicker
        modal
        open={open}
        date={date}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        theme="dark"
        title="Select Date"
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </View>
  );
};