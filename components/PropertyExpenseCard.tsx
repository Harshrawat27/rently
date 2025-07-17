import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { PropertyExpense } from '../lib/types';

interface PropertyExpenseCardProps {
  expense: PropertyExpense;
  onUpdate: () => void;
}

export function PropertyExpenseCard({ expense, onUpdate }: PropertyExpenseCardProps) {
  const handleDelete = async () => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('property_expenses')
                .delete()
                .eq('id', expense.id);

              if (error) throw error;
              onUpdate();
            } catch (error) {
              console.error('Error deleting expense:', error);
              Alert.alert('Error', 'Failed to delete expense');
            }
          }
        }
      ]
    );
  };

  return (
    <View className="bg-[#262624] rounded-lg p-4 mb-3 border border-gray-700">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-white font-semibold text-base">
            {expense.expense_name}
          </Text>
          <Text className="text-gray-400 text-sm">
            {expense.room ? `Room ${expense.room.room_number}` : 'General Expense'}
          </Text>
        </View>
        <TouchableOpacity
          className="bg-red-600 rounded-lg px-3 py-1"
          onPress={handleDelete}
        >
          <Text className="text-white font-semibold text-xs">Delete</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-between items-center">
        <Text className="text-gray-300 text-sm">
          {new Date(expense.expense_date).toLocaleDateString()}
        </Text>
        <Text className="text-[#C96342] font-semibold text-lg">
          ₹{expense.amount.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}