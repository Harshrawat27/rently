import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
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
  const [showSetInitialAmount, setShowSetInitialAmount] = useState(false);
  const [showBalancePayment, setShowBalancePayment] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
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

  const handleSetInitialAmounts = async () => {
    if (!advanceAmount.trim() || !balanceAmount.trim()) {
      Alert.alert('Error', 'Please enter both advance and balance amounts');
      return;
    }

    const advanceNum = parseFloat(advanceAmount);
    const balanceNum = parseFloat(balanceAmount);

    if (isNaN(advanceNum) || advanceNum < 0) {
      Alert.alert('Error', 'Please enter a valid advance amount');
      return;
    }

    if (isNaN(balanceNum) || balanceNum < 0) {
      Alert.alert('Error', 'Please enter a valid balance amount');
      return;
    }

    setLoading(true);
    try {
      // Add advance payment log
      if (advanceNum > 0) {
        await supabase
          .from('tenant_payments')
          .insert({
            tenant_id: tenant.id,
            payment_type: 'advance',
            amount: advanceNum,
            payment_date: paymentDate.toISOString().split('T')[0],
            description: 'Initial advance amount set',
          });
      }

      // Add balance log (negative amount to show it's owed)
      if (balanceNum > 0) {
        await supabase
          .from('tenant_payments')
          .insert({
            tenant_id: tenant.id,
            payment_type: 'balance',
            amount: -balanceNum, // Negative to show it's owed
            payment_date: paymentDate.toISOString().split('T')[0],
            description: 'Initial balance amount set',
          });
      }

      // Update tenant record
      await supabase
        .from('tenants')
        .update({
          advance_amount: advanceNum,
          balance_amount: balanceNum,
        })
        .eq('id', tenant.id);

      Alert.alert('Success', 'Initial amounts set successfully');
      setAdvanceAmount('');
      setBalanceAmount('');
      setPaymentDate(new Date());
      setShowSetInitialAmount(false);
      fetchPayments();
      onUpdate();
    } catch (error) {
      console.error('Error setting initial amounts:', error);
      Alert.alert('Error', 'Failed to set initial amounts');
    } finally {
      setLoading(false);
    }
  };

  const handleBalancePayment = async () => {
    if (!paymentAmount.trim()) {
      Alert.alert('Error', 'Please enter payment amount');
      return;
    }

    const paymentNum = parseFloat(paymentAmount);
    if (isNaN(paymentNum) || paymentNum <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }

    if (paymentNum > tenant.balance_amount) {
      Alert.alert('Error', 'Payment amount cannot exceed current balance');
      return;
    }

    setLoading(true);
    try {
      // Add payment log
      await supabase
        .from('tenant_payments')
        .insert({
          tenant_id: tenant.id,
          payment_type: 'balance',
          amount: paymentNum,
          payment_date: paymentDate.toISOString().split('T')[0],
          description: description.trim() || 'Balance payment',
        });

      // Update tenant balance
      const newBalance = tenant.balance_amount - paymentNum;
      await supabase
        .from('tenants')
        .update({
          balance_amount: newBalance,
        })
        .eq('id', tenant.id);

      Alert.alert('Success', 'Balance payment recorded successfully');
      setPaymentAmount('');
      setDescription('');
      setPaymentDate(new Date());
      setShowBalancePayment(false);
      fetchPayments();
      onUpdate();
    } catch (error) {
      console.error('Error recording balance payment:', error);
      Alert.alert('Error', 'Failed to record balance payment');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentBalance = () => {
    return Math.max(0, tenant.balance_amount);
  };

  const getTotalAdvance = () => {
    return tenant.advance_amount;
  };

  const hasInitialAmounts = tenant.advance_amount > 0 || tenant.balance_amount > 0;

  return (
    <ScrollView className="bg-[#262624] rounded-lg p-4 border border-gray-700" showsVerticalScrollIndicator={false}>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-semibold text-white">Payment Management</Text>
        {!hasInitialAmounts ? (
          <TouchableOpacity
            className="bg-[#C96342] rounded-lg px-4 py-2"
            onPress={() => setShowSetInitialAmount(true)}
          >
            <Text className="text-white font-semibold">Set Initial Amounts</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="bg-blue-600 rounded-lg px-4 py-2"
            onPress={() => setShowBalancePayment(true)}
            disabled={getCurrentBalance() === 0}
          >
            <Text className="text-white font-semibold">
              {getCurrentBalance() === 0 ? 'No Balance' : 'Pay Balance'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Payment Summary */}
      <View className="grid grid-cols-2 gap-4 mb-4">
        <View className="bg-[#1F1E1D] rounded-lg p-3">
          <Text className="text-gray-300 text-sm">Advance Amount</Text>
          <Text className="text-green-400 font-semibold text-lg">
            ₹{getTotalAdvance().toLocaleString()}
          </Text>
        </View>
        <View className="bg-[#1F1E1D] rounded-lg p-3">
          <Text className="text-gray-300 text-sm">Balance Remaining</Text>
          <Text className="text-red-400 font-semibold text-lg">
            ₹{getCurrentBalance().toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Payment History */}
      <Text className="text-white font-semibold mb-2">Payment History</Text>
      <View className="max-h-60">
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
                    {payment.payment_type === 'advance' 
                      ? 'Advance Payment' 
                      : payment.amount < 0 
                        ? 'Balance Set' 
                        : 'Balance Payment'}
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
                  payment.payment_type === 'advance' 
                    ? 'text-green-400' 
                    : payment.amount < 0 
                      ? 'text-red-400' 
                      : 'text-blue-400'
                }`}>
                  {payment.amount < 0 ? '-' : '+'}₹{Math.abs(payment.amount).toLocaleString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Set Initial Amounts Modal */}
      <Modal
        visible={showSetInitialAmount}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSetInitialAmount(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-[#262624] rounded-lg p-6 w-80 border border-gray-600">
            <Text className="text-white text-lg font-semibold mb-4">Set Initial Amounts</Text>
            
            <View className="mb-4">
              <Text className="text-gray-300 mb-2">Advance Amount (₹)</Text>
              <TextInput
                className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
                value={advanceAmount}
                onChangeText={setAdvanceAmount}
                placeholder="Enter advance amount"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-300 mb-2">Balance Amount (₹)</Text>
              <TextInput
                className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
                value={balanceAmount}
                onChangeText={setBalanceAmount}
                placeholder="Enter balance amount"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            <View className="mb-6">
              <Text className="text-gray-300 mb-2">Date</Text>
              <DatePicker
                value={paymentDate}
                onChange={setPaymentDate}
                placeholder="Select date"
              />
            </View>

            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-[#C96342] rounded-lg py-3"
                onPress={handleSetInitialAmounts}
                disabled={loading}
              >
                <Text className="text-white font-semibold text-center">
                  {loading ? 'Setting...' : 'Set Amounts'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 bg-gray-600 rounded-lg py-3"
                onPress={() => setShowSetInitialAmount(false)}
                disabled={loading}
              >
                <Text className="text-white font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Balance Payment Modal */}
      <Modal
        visible={showBalancePayment}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBalancePayment(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-[#262624] rounded-lg p-6 w-80 border border-gray-600">
            <Text className="text-white text-lg font-semibold mb-4">Balance Payment</Text>
            
            <View className="mb-4 p-3 bg-[#1F1E1D] rounded-lg">
              <Text className="text-gray-300 text-sm">Current Balance</Text>
              <Text className="text-red-400 font-semibold text-lg">
                ₹{getCurrentBalance().toLocaleString()}
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-gray-300 mb-2">Payment Amount (₹)</Text>
              <TextInput
                className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                placeholder="Enter payment amount"
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
                onPress={handleBalancePayment}
                disabled={loading}
              >
                <Text className="text-white font-semibold text-center">
                  {loading ? 'Recording...' : 'Record Payment'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 bg-gray-600 rounded-lg py-3"
                onPress={() => setShowBalancePayment(false)}
                disabled={loading}
              >
                <Text className="text-white font-semibold text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}