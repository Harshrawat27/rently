import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { PropertyExpense } from '../lib/types';
import { PropertyExpenseCard } from '../components/PropertyExpenseCard';
import { AddPropertyExpenseForm } from '../components/AddPropertyExpenseForm';
import { Header } from '../components/Header';
import { DismissibleKeyboardView } from '../components/DismissibleKeyboardView';

export default function PropertyExpensesScreen() {
  const { propertyId, propertyName } = useLocalSearchParams<{ propertyId: string; propertyName: string }>();
  const [expenses, setExpenses] = useState<PropertyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('property_expenses')
        .select(`
          *,
          room:rooms(*)
        `)
        .eq('property_id', propertyId)
        .order('expense_date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchExpenses();
    }
  }, [propertyId]);

  const handleExpenseAdded = () => {
    setShowAddForm(false);
    fetchExpenses();
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const rightComponent = (
    <TouchableOpacity
      className="bg-[#C96342] rounded-lg px-4 py-2"
      onPress={() => setShowAddForm(!showAddForm)}
    >
      <Text className="text-white font-semibold">
        {showAddForm ? 'Cancel' : 'Add Expense'}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#1F1E1D]">
        <Text className="text-white">Loading expenses...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#1F1E1D]">
      <DismissibleKeyboardView className="flex-1">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Header 
            title={`${propertyName} Expenses`} 
            rightComponent={rightComponent}
          />
          
          <ScrollView 
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="px-4 py-6">
              <View className="bg-[#262624] rounded-lg p-6 mb-6 border border-gray-700">
                <Text className="text-xl font-bold text-white mb-2">
                  Total Expenses
                </Text>
                <Text className="text-3xl font-bold text-[#C96342]">
                  ₹{totalExpenses.toLocaleString()}
                </Text>
              </View>

              {showAddForm && (
                <View className="mb-6">
                  <AddPropertyExpenseForm 
                    propertyId={propertyId} 
                    onExpenseAdded={handleExpenseAdded}
                  />
                </View>
              )}

              <Text className="text-xl font-bold text-white mb-4">Expenses</Text>

              {expenses.length === 0 ? (
                <View className="py-12 items-center">
                  <Text className="text-gray-400 text-center">
                    No expenses found. Add your first expense to get started.
                  </Text>
                </View>
              ) : (
                <View>
                  {expenses.map((expense) => (
                    <PropertyExpenseCard
                      key={expense.id}
                      expense={expense}
                      onUpdate={fetchExpenses}
                    />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </DismissibleKeyboardView>
    </SafeAreaView>
  );
}