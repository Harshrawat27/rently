import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { supabase } from '../lib/supabase';
import { Tenant, TenantBillingCycle, TenantPayment } from '../lib/types';
import { DatePicker } from './DatePicker';

interface TenantBillingCycleManagerProps {
  tenant: Tenant;
  onUpdate: () => void;
}

export function TenantBillingCycleManager({ tenant, onUpdate }: TenantBillingCycleManagerProps) {
  const [currentCycle, setCurrentCycle] = useState<TenantBillingCycle | null>(null);
  const [nextCycle, setNextCycle] = useState<TenantBillingCycle | null>(null);
  const [cyclePayments, setCyclePayments] = useState<TenantPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [electricityBill, setElectricityBill] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date());

  const fetchCurrentCycle = async () => {
    try {
      const today = new Date();
      const { data, error } = await supabase
        .from('tenant_billing_cycles')
        .select('*')
        .eq('tenant_id', tenant.id)
        .lte('cycle_start_date', today.toISOString().split('T')[0])
        .gte('cycle_end_date', today.toISOString().split('T')[0])
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentCycle(data);
    } catch (error) {
      console.error('Error fetching current cycle:', error);
    }
  };

  const fetchNextCycle = async () => {
    try {
      const today = new Date();
      const { data, error } = await supabase
        .from('tenant_billing_cycles')
        .select('*')
        .eq('tenant_id', tenant.id)
        .gt('cycle_start_date', today.toISOString().split('T')[0])
        .order('cycle_start_date', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setNextCycle(data);
    } catch (error) {
      console.error('Error fetching next cycle:', error);
    }
  };

  const fetchCyclePayments = async () => {
    if (!currentCycle) return;
    
    try {
      const { data, error } = await supabase
        .from('tenant_payments')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('payment_type', 'cycle')
        .like('description', `%${currentCycle.cycle_start_date}%`)
        .order('payment_date', { ascending: false });

      if (error) throw error;
      setCyclePayments(data || []);
    } catch (error) {
      console.error('Error fetching cycle payments:', error);
    }
  };

  const generateBillingCycles = async () => {
    setLoading(true);
    try {
      const bookingDate = new Date(tenant.booking_date);
      const today = new Date();
      const dayOfMonth = bookingDate.getDate();
      const cycles = [];

      // Generate cycles from booking date to current date + 2 months
      let currentDate = new Date(bookingDate);
      const endGenerationDate = new Date(today);
      endGenerationDate.setMonth(endGenerationDate.getMonth() + 2);

      while (currentDate <= endGenerationDate) {
        const cycleStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayOfMonth);
        const cycleEndDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, dayOfMonth - 1);

        // Check if cycle already exists
        const { data: existingCycle } = await supabase
          .from('tenant_billing_cycles')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('cycle_start_date', cycleStartDate.toISOString().split('T')[0]);

        if (!existingCycle || existingCycle.length === 0) {
          // Get current room rent amount for new cycles
          const { data: roomData } = await supabase
            .from('rooms')
            .select('rent_amount')
            .eq('id', tenant.room_id)
            .single();

          const currentRentAmount = roomData?.rent_amount || 0;

          cycles.push({
            tenant_id: tenant.id,
            cycle_start_date: cycleStartDate.toISOString().split('T')[0],
            cycle_end_date: cycleEndDate.toISOString().split('T')[0],
            rent_amount: currentRentAmount,
            electricity_bill: 0,
            total_amount: currentRentAmount,
            is_paid: false,
          });
        }

        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      if (cycles.length > 0) {
        const { error } = await supabase
          .from('tenant_billing_cycles')
          .insert(cycles);

        if (error) throw error;
      }

      await fetchCurrentCycle();
      await fetchNextCycle();
      Alert.alert('Success', 'Billing cycles generated successfully');
    } catch (error) {
      console.error('Error generating billing cycles:', error);
      Alert.alert('Error', 'Failed to generate billing cycles');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!currentCycle) return;

    const electricityNum = parseFloat(electricityBill) || 0;
    const paymentNum = parseFloat(paymentAmount) || 0;

    if (electricityNum < 0 || paymentNum < 0) {
      Alert.alert('Error', 'Amounts must be positive numbers');
      return;
    }

    setLoading(true);
    try {
      // Get room rent amount
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('rent_amount')
        .eq('id', tenant.room_id)
        .single();

      if (roomError) throw roomError;

      const rentAmount = roomData.rent_amount;
      const totalAmount = rentAmount + electricityNum;
      
      // Calculate current balance
      const currentPaid = cyclePayments.reduce((sum, payment) => sum + payment.amount, 0);
      const newTotalPaid = currentPaid + paymentNum;
      const balanceLeft = totalAmount - newTotalPaid;

      // Update billing cycle
      const { error: cycleError } = await supabase
        .from('tenant_billing_cycles')
        .update({
          rent_amount: rentAmount,
          electricity_bill: electricityNum,
          total_amount: totalAmount,
          is_paid: balanceLeft <= 0
        })
        .eq('id', currentCycle.id);

      if (cycleError) throw cycleError;

      // Add payment record
      if (paymentNum > 0) {
        const { error: paymentError } = await supabase
          .from('tenant_payments')
          .insert({
            tenant_id: tenant.id,
            payment_type: 'cycle',
            amount: paymentNum,
            payment_date: paymentDate.toISOString().split('T')[0],
            description: `Payment for cycle ${currentCycle.cycle_start_date} to ${currentCycle.cycle_end_date}`,
          });

        if (paymentError) throw paymentError;
      }

      Alert.alert('Success', 'Payment recorded successfully');
      setShowPaymentModal(false);
      setElectricityBill('');
      setPaymentAmount('');
      setPaymentDate(new Date());
      
      await fetchCurrentCycle();
      await fetchCyclePayments();
      onUpdate();
    } catch (error) {
      console.error('Error recording payment:', error);
      Alert.alert('Error', 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const getDaysLeft = (endDate: string) => {
    const today = new Date();
    const cycleEndDate = new Date(endDate);
    const diffTime = cycleEndDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getDaysUntilNext = (startDate: string) => {
    const today = new Date();
    const cycleStartDate = new Date(startDate);
    const diffTime = cycleStartDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getCurrentBalance = () => {
    if (!currentCycle) return 0;
    const totalPaid = cyclePayments.reduce((sum, payment) => sum + payment.amount, 0);
    return Math.max(0, currentCycle.total_amount - totalPaid);
  };

  const getTotalPaid = () => {
    return cyclePayments.reduce((sum, payment) => sum + payment.amount, 0);
  };

  useEffect(() => {
    fetchCurrentCycle();
    fetchNextCycle();
  }, [tenant.id]);

  useEffect(() => {
    fetchCyclePayments();
  }, [currentCycle]);

  const handleCyclePress = () => {
    if (currentCycle) {
      setElectricityBill(currentCycle.electricity_bill?.toString() || '');
      setPaymentAmount('');
      setPaymentDate(new Date());
      setShowPaymentModal(true);
    }
  };

  return (
    <ScrollView className="bg-[#262624] rounded-lg p-4 border border-gray-700" showsVerticalScrollIndicator={false}>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-semibold text-white">Billing Cycles</Text>
        <TouchableOpacity
          className="bg-blue-600 rounded-lg px-4 py-2"
          onPress={generateBillingCycles}
          disabled={loading}
        >
          <Text className="text-white font-semibold">
            {loading ? 'Generating...' : 'Generate Cycles'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Current Cycle */}
      {currentCycle ? (
        <TouchableOpacity
          className="bg-[#1F1E1D] rounded-lg p-4 mb-4"
          onPress={handleCyclePress}
        >
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white font-semibold">Current Cycle</Text>
            <View className={`px-2 py-1 rounded-full ${
              currentCycle.is_paid ? 'bg-green-800/20' : 'bg-red-800/20'
            }`}>
              <Text className={`text-xs font-medium ${
                currentCycle.is_paid ? 'text-green-400' : 'text-red-400'
              }`}>
                {currentCycle.is_paid ? 'Paid' : `₹${getCurrentBalance()} left`}
              </Text>
            </View>
          </View>
          
          <Text className="text-gray-300 text-sm mb-2">
            {new Date(currentCycle.cycle_start_date).toLocaleDateString()} - {new Date(currentCycle.cycle_end_date).toLocaleDateString()}
          </Text>
          
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-300">Rent:</Text>
            <Text className="text-white">₹{currentCycle.rent_amount.toLocaleString()}</Text>
          </View>
          
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-300">Electricity:</Text>
            <Text className="text-white">₹{currentCycle.electricity_bill.toLocaleString()}</Text>
          </View>
          
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-300">Total:</Text>
            <Text className="text-white font-semibold">₹{currentCycle.total_amount.toLocaleString()}</Text>
          </View>
          
          <View className="flex-row justify-between items-center pt-2 border-t border-gray-600">
            <Text className="text-gray-300">Paid:</Text>
            <Text className="text-green-400">₹{getTotalPaid().toLocaleString()}</Text>
          </View>
          
          <Text className="text-gray-400 text-sm mt-2">
            {getDaysLeft(currentCycle.cycle_end_date)} days left • Tap to add payment
          </Text>
        </TouchableOpacity>
      ) : (
        <View className="bg-[#1F1E1D] rounded-lg p-4 mb-4">
          <Text className="text-gray-400 text-center">
            No current cycle. Generate cycles to start billing.
          </Text>
        </View>
      )}

      {/* Next Cycle */}
      {nextCycle && (
        <View className="bg-[#1F1E1D] rounded-lg p-4 mb-4">
          <Text className="text-white font-semibold mb-2">Next Cycle</Text>
          <Text className="text-gray-300 text-sm mb-2">
            {new Date(nextCycle.cycle_start_date).toLocaleDateString()} - {new Date(nextCycle.cycle_end_date).toLocaleDateString()}
          </Text>
          <Text className="text-orange-400 text-sm">
            {getDaysUntilNext(nextCycle.cycle_start_date)} days until next billing
          </Text>
        </View>
      )}

      {/* Payment History for Current Cycle */}
      {cyclePayments.length > 0 && (
        <View className="bg-[#1F1E1D] rounded-lg p-4">
          <Text className="text-white font-semibold mb-2">Payment History</Text>
          {cyclePayments.map((payment) => (
            <View key={payment.id} className="flex-row justify-between items-center py-2 border-b border-gray-600">
              <View>
                <Text className="text-gray-300">
                  {new Date(payment.payment_date).toLocaleDateString()}
                </Text>
                <Text className="text-gray-400 text-sm">
                  {payment.description}
                </Text>
              </View>
              <Text className="text-green-400 font-semibold">
                ₹{payment.amount.toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-[#262624] rounded-lg p-6 w-80 border border-gray-600">
            <Text className="text-white text-lg font-semibold mb-4">
              Update Current Cycle
            </Text>
            
            <View className="mb-4">
              <Text className="text-gray-300 mb-2">Electricity Bill (₹)</Text>
              <TextInput
                className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
                value={electricityBill}
                onChangeText={setElectricityBill}
                placeholder="Enter electricity bill"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
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

            {currentCycle && (
              <View className="mb-4 p-3 bg-[#1F1E1D] rounded-lg">
                <Text className="text-gray-300 text-sm mb-2">Summary</Text>
                <View className="flex-row justify-between">
                  <Text className="text-gray-300">Current Balance:</Text>
                  <Text className="text-red-400">₹{getCurrentBalance().toLocaleString()}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-300">New Payment:</Text>
                  <Text className="text-green-400">₹{(parseFloat(paymentAmount) || 0).toLocaleString()}</Text>
                </View>
                <View className="flex-row justify-between pt-2 border-t border-gray-600">
                  <Text className="text-white font-semibold">Remaining:</Text>
                  <Text className="text-white font-semibold">₹{Math.max(0, getCurrentBalance() - (parseFloat(paymentAmount) || 0)).toLocaleString()}</Text>
                </View>
              </View>
            )}

            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-[#C96342] rounded-lg py-3"
                onPress={handlePaymentSubmit}
                disabled={loading}
              >
                <Text className="text-white font-semibold text-center">
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 bg-gray-600 rounded-lg py-3"
                onPress={() => setShowPaymentModal(false)}
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