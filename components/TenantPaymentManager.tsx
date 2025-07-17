import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';
import { Tenant, TenantPayment } from '../lib/types';
import { DatePicker } from './DatePicker';

interface TenantPaymentManagerProps {
  tenant: Tenant;
  onUpdate: () => void;
}

export function TenantPaymentManager({ tenant, onUpdate }: TenantPaymentManagerProps) {
  const [payments, setPayments] = useState<TenantPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentType, setPaymentType] = useState<'advance' | 'balance'>('advance');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date());
  const [description, setDescription] = useState('');

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('tenant_payments')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [tenant.id]);

  const handleAddPayment = async () => {
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
      // Add payment to tenant_payments table
      const { error: paymentError } = await supabase
        .from('tenant_payments')
        .insert({
          tenant_id: tenant.id,
          payment_type: paymentType,
          amount: amountNum,
          payment_date: paymentDate.toISOString().split('T')[0],
          description: description.trim() || null,
        });

      if (paymentError) throw paymentError;

      // Update tenant's advance/balance amount
      const currentAdvance = tenant.advance_amount;
      const currentBalance = tenant.balance_amount;
      
      let newAdvance = currentAdvance;
      let newBalance = currentBalance;

      if (paymentType === 'advance') {
        newAdvance = currentAdvance + amountNum;
      } else {
        newBalance = Math.max(0, currentBalance - amountNum);
      }

      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          advance_amount: newAdvance,
          balance_amount: newBalance,
        })
        .eq('id', tenant.id);

      if (updateError) throw updateError;

      Alert.alert('Success', 'Payment added successfully');
      setAmount('');
      setDescription('');
      setPaymentDate(new Date());
      setShowAddPayment(false);
      fetchPayments();
      onUpdate();
    } catch (error) {
      console.error('Error adding payment:', error);
      Alert.alert('Error', 'Failed to add payment');
    } finally {
      setLoading(false);
    }
  };

  const getTotalAdvance = () => {
    return payments
      .filter(p => p.payment_type === 'advance')
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getTotalBalance = () => {
    return payments
      .filter(p => p.payment_type === 'balance')
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getCurrentBalance = () => {
    return Math.max(0, tenant.balance_amount);
  };

  return (
    <View className="bg-[#262624] rounded-lg p-4 border border-gray-700">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-semibold text-white">Payment Management</Text>
        <TouchableOpacity
          className="bg-[#C96342] rounded-lg px-4 py-2"
          onPress={() => setShowAddPayment(true)}
        >
          <Text className="text-white font-semibold">Add Payment</Text>
        </TouchableOpacity>
      </View>

      {/* Payment Summary */}
      <View className="grid grid-cols-2 gap-4 mb-4">
        <View className="bg-[#1F1E1D] rounded-lg p-3">
          <Text className="text-gray-300 text-sm">Total Advance</Text>
          <Text className="text-green-400 font-semibold text-lg">
            ₹{getTotalAdvance().toLocaleString()}
          </Text>
        </View>
        <View className="bg-[#1F1E1D] rounded-lg p-3">
          <Text className="text-gray-300 text-sm">Current Balance</Text>
          <Text className="text-red-400 font-semibold text-lg">
            ₹{getCurrentBalance().toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Payment History */}
      <Text className="text-white font-semibold mb-2">Payment History</Text>
      <ScrollView className="max-h-60" showsVerticalScrollIndicator={false}>
        {payments.length === 0 ? (
          <Text className="text-gray-400 text-center py-4">
            No payments found
          </Text>
        ) : (
          payments.map((payment) => (
            <View key={payment.id} className="bg-[#1F1E1D] rounded-lg p-3 mb-2">
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="text-white font-medium">
                    {payment.payment_type === 'advance' ? 'Advance' : 'Balance Payment'}
                  </Text>
                  <Text className="text-gray-400 text-sm">
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </Text>
                  {payment.description && (
                    <Text className="text-gray-400 text-sm mt-1">
                      {payment.description}
                    </Text>
                  )}
                </View>
                <Text className={`font-semibold ${
                  payment.payment_type === 'advance' ? 'text-green-400' : 'text-blue-400'
                }`}>
                  ₹{payment.amount.toLocaleString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Payment Modal */}
      <Modal
        visible={showAddPayment}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddPayment(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-[#262624] rounded-lg p-6 w-80 border border-gray-600">
            <Text className="text-white text-lg font-semibold mb-4">Add Payment</Text>
            
            <View className="mb-4">
              <Text className="text-gray-300 mb-2">Payment Type</Text>
              <View className="bg-[#1F1E1D] border border-gray-600 rounded-lg">
                <Picker
                  selectedValue={paymentType}
                  onValueChange={(value) => setPaymentType(value)}
                  style={{ color: 'white', backgroundColor: '#1F1E1D' }}
                  dropdownIconColor="white"
                >
                  <Picker.Item label="Advance Payment" value="advance" />
                  <Picker.Item label="Balance Payment" value="balance" />
                </Picker>
              </View>
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

            <View className="mb-4">
              <Text className="text-gray-300 mb-2">Payment Date</Text>
              <DatePicker
                value={paymentDate}
                onChange={setPaymentDate}
                placeholder="Select payment date"
              />
            </View>

            <View className="mb-6">
              <Text className="text-gray-300 mb-2">Description (Optional)</Text>
              <TextInput
                className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={2}
              />
            </View>

            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-[#C96342] rounded-lg py-3"
                onPress={handleAddPayment}
                disabled={loading}
              >
                <Text className="text-white font-semibold text-center">
                  {loading ? 'Adding...' : 'Add Payment'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 bg-gray-600 rounded-lg py-3"
                onPress={() => setShowAddPayment(false)}
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