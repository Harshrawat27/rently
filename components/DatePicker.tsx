import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerProps {
  value: string;
  onChangeText: (date: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

interface DatePickerSimpleProps {
  value: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
}

export const DatePicker: React.FC<DatePickerSimpleProps> = ({
  value,
  onChange,
  placeholder = 'Select date'
}) => {
  const [open, setOpen] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
    }
    
    if (selectedDate) {
      onChange(selectedDate);
    }
    
    if (Platform.OS === 'ios') {
      setOpen(false);
    }
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const displayDate = value ? value.toLocaleDateString() : placeholder;

  return (
    <View>
      <TouchableOpacity
        className="bg-[#1F1E1D] border border-gray-600 rounded-lg px-3 py-2"
        onPress={() => setOpen(true)}
      >
        <Text className={`${value ? 'text-white' : 'text-gray-400'}`}>
          {displayDate}
        </Text>
      </TouchableOpacity>
      
      {Platform.OS === 'ios' ? (
        <Modal
          visible={open}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-[#1F1E1D] p-4 rounded-t-lg">
              <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity onPress={handleCancel}>
                  <Text className="text-[#C96342] text-lg">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-white text-lg font-semibold">Select Date</Text>
                <TouchableOpacity onPress={() => handleDateChange(null, value)}>
                  <Text className="text-[#C96342] text-lg">Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={value}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                themeVariant="dark"
              />
            </View>
          </View>
        </Modal>
      ) : (
        open && (
          <DateTimePicker
            value={value}
            mode="date"
            display="default"
            onChange={handleDateChange}
            themeVariant="dark"
          />
        )
      )}
    </View>
  );
};

export const CustomDatePicker: React.FC<DatePickerProps> = ({
  value,
  onChangeText,
  placeholder = 'Select date',
  label,
  required = false
}) => {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(value ? new Date(value) : new Date());

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
    }
    
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      onChangeText(formattedDate);
    }
    
    if (Platform.OS === 'ios') {
      setOpen(false);
    }
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
      
      {Platform.OS === 'ios' ? (
        <Modal
          visible={open}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-[#1F1E1D] p-4 rounded-t-lg">
              <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity onPress={handleCancel}>
                  <Text className="text-[#C96342] text-lg">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-white text-lg font-semibold">Select Date</Text>
                <TouchableOpacity onPress={() => handleDateChange(null, date)}>
                  <Text className="text-[#C96342] text-lg">Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setDate(selectedDate);
                  }
                }}
                themeVariant="dark"
              />
            </View>
          </View>
        </Modal>
      ) : (
        open && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
            themeVariant="dark"
          />
        )
      )}
    </View>
  );
};