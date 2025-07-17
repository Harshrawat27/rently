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
  const [billingCycles, setBillingCycles] = useState<TenantBillingCycle[]>([]);
  const [payments, setPayments] = useState<TenantPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<TenantBillingCycle | null>(null);
  const [rentAmount, setRentAmount] = useState('');
  const [electricityAmount, setElectricityAmount] = useState('');
  const [useAdvanceAmount, setUseAdvanceAmount] = useState('');
  const [balancePaymentAmount, setBalancePaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date());

  const fetchBillingCycles = async () => {
    try {
      const { data, error } = await supabase
        .from('tenant_billing_cycles')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('cycle_start_date', { ascending: false });

      if (error) throw error;
      setBillingCycles(data || []);
    } catch (error) {
      console.error('Error fetching billing cycles:', error);
    }
  };

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
    fetchBillingCycles();
    fetchPayments();
  }, [tenant.id]);

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
          cycles.push({
            tenant_id: tenant.id,
            cycle_start_date: cycleStartDate.toISOString().split('T')[0],
            cycle_end_date: cycleEndDate.toISOString().split('T')[0],
            rent_amount: 0,
            electricity_amount: 0,
            total_amount: 0,
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

      await fetchBillingCycles();
      Alert.alert('Success', 'Billing cycles generated successfully');
    } catch (error) {
      console.error('Error generating billing cycles:', error);
      Alert.alert('Error', 'Failed to generate billing cycles');
    } finally {
      setLoading(false);
    }
  };

  const handleBillingCyclePress = (cycle: TenantBillingCycle) => {
    setSelectedCycle(cycle);
    setRentAmount(cycle.rent_amount?.toString() || '');
    setElectricityAmount(cycle.electricity_amount?.toString() || '');
    setUseAdvanceAmount('');
    setBalancePaymentAmount('');
    setPaymentDate(new Date());
    setShowBillingModal(true);
  };

  const handleBillingCycleUpdate = async () => {
    if (!selectedCycle) return;

    const rentNum = parseFloat(rentAmount) || 0;
    const electricityNum = parseFloat(electricityAmount) || 0;
    const useAdvanceNum = parseFloat(useAdvanceAmount) || 0;
    const balancePaymentNum = parseFloat(balancePaymentAmount) || 0;

    if (rentNum < 0 || electricityNum < 0 || useAdvanceNum < 0 || balancePaymentNum < 0) {
      Alert.alert('Error', 'All amounts must be positive numbers');
      return;
    }

    if (useAdvanceNum > tenant.advance_amount) {
      Alert.alert('Error', 'Cannot use more advance than available');
      return;
    }

    setLoading(true);
    try {
      const totalAmount = rentNum + electricityNum;
      const amountFromAdvance = Math.min(useAdvanceNum, totalAmount);
      const balanceOwed = totalAmount - amountFromAdvance;
      const balancePayment = Math.min(balancePaymentNum, balanceOwed);
      const finalBalance = balanceOwed - balancePayment;

      // Update billing cycle
      const { error: cycleError } = await supabase
        .from('tenant_billing_cycles')
        .update({
          rent_amount: rentNum,
          electricity_amount: electricityNum,
          total_amount: totalAmount,
          is_paid: finalBalance === 0
        })
        .eq('id', selectedCycle.id);

      if (cycleError) throw cycleError;

      // Update tenant advance and balance
      const newAdvanceAmount = tenant.advance_amount - amountFromAdvance;
      const newBalanceAmount = tenant.balance_amount + finalBalance;

      const { error: tenantError } = await supabase
        .from('tenants')
        .update({
          advance_amount: newAdvanceAmount,
          balance_amount: newBalanceAmount
        })
        .eq('id', tenant.id);

      if (tenantError) throw tenantError;

      // Record payment transactions
      const paymentEntries = [];

      // Record advance usage
      if (amountFromAdvance > 0) {
        paymentEntries.push({
          tenant_id: tenant.id,
          payment_type: 'advance',
          amount: -amountFromAdvance,
          payment_date: paymentDate.toISOString().split('T')[0],
          description: `Advance used for billing cycle ${selectedCycle.cycle_start_date} to ${selectedCycle.cycle_end_date}`,
        });
      }

      // Record balance payment
      if (balancePayment > 0) {
        paymentEntries.push({
          tenant_id: tenant.id,
          payment_type: 'balance',
          amount: balancePayment,
          payment_date: paymentDate.toISOString().split('T')[0],
          description: `Balance payment for billing cycle ${selectedCycle.cycle_start_date} to ${selectedCycle.cycle_end_date}`,
        });
      }

      // Record balance added (if any)
      if (finalBalance > 0) {
        paymentEntries.push({
          tenant_id: tenant.id,
          payment_type: 'balance',
          amount: -finalBalance,
          payment_date: paymentDate.toISOString().split('T')[0],
          description: `Balance added for billing cycle ${selectedCycle.cycle_start_date} to ${selectedCycle.cycle_end_date}`,
        });
      }

      if (paymentEntries.length > 0) {
        const { error: paymentError } = await supabase
          .from('tenant_payments')
          .insert(paymentEntries);

        if (paymentError) throw paymentError;
      }

      Alert.alert('Success', 'Billing cycle updated successfully');
      setShowBillingModal(false);
      setSelectedCycle(null);
      fetchBillingCycles();
      fetchPayments();
      onUpdate();
    } catch (error) {
      console.error('Error updating billing cycle:', error);
      Alert.alert('Error', 'Failed to update billing cycle');
    } finally {
      setLoading(false);
    }
  };

  const getCycleStatus = (cycle: TenantBillingCycle) => {
    const today = new Date();
    const cycleEnd = new Date(cycle.cycle_end_date);
    const diffTime = cycleEnd.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (cycle.is_paid) return { text: 'Paid', color: 'text-green-400' };
    if (diffDays < 0) return { text: 'Overdue', color: 'text-red-400' };
    if (diffDays <= 3) return { text: `${diffDays} days left`, color: 'text-yellow-400' };
    return { text: `${diffDays} days left`, color: 'text-blue-400' };
  };

  const totalAmount = selectedCycle ? (parseFloat(rentAmount) || 0) + (parseFloat(electricityAmount) || 0) : 0;
  const useAdvanceNum = parseFloat(useAdvanceAmount) || 0;
  const balancePaymentNum = parseFloat(balancePaymentAmount) || 0;
  const amountFromAdvance = Math.min(useAdvanceNum, totalAmount);
  const balanceOwed = totalAmount - amountFromAdvance;
  const balancePayment = Math.min(balancePaymentNum, balanceOwed);
  const finalBalance = balanceOwed - balancePayment;

  return (
    <ScrollView className="bg-[#262624] rounded-lg p-4 border border-gray-700" showsVerticalScrollIndicator={false}>
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-semibold text-white">Billing Cycles</Text>
        <View className="flex-row space-x-2">
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
      </View>

      {/* Advance/Balance Summary */}
      <View className="flex-row space-x-2 mb-4">
        <View className="flex-1 bg-[#1F1E1D] rounded-lg p-3">
          <Text className="text-gray-300 text-sm">Advance</Text>
          <Text className="text-green-400 font-semibold text-lg">₹{tenant.advance_amount.toLocaleString()}</Text>
        </View>
        <View className="flex-1 bg-[#1F1E1D] rounded-lg p-3">
          <Text className="text-gray-300 text-sm">Balance</Text>
          <Text className="text-red-400 font-semibold text-lg">₹{tenant.balance_amount.toLocaleString()}</Text>
        </View>
      </View>

      {billingCycles.length === 0 ? (
        <Text className="text-gray-400 text-center py-4">
          No billing cycles found. Generate billing cycles to get started.
        </Text>
      ) : (
        <View className="space-y-2">
          {billingCycles.map((cycle) => {
            const status = getCycleStatus(cycle);
            return (
              <TouchableOpacity
                key={cycle.id}
                className="bg-[#1F1E1D] rounded-lg p-3"
                onPress={() => handleBillingCyclePress(cycle)}
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-white font-medium">
                      {new Date(cycle.cycle_start_date).toLocaleDateString()} - {new Date(cycle.cycle_end_date).toLocaleDateString()}
                    </Text>
                    <Text className="text-gray-400 text-sm mt-1">
                      Rent: ₹{cycle.rent_amount?.toLocaleString() || 0} | 
                      Electricity: ₹{cycle.electricity_amount?.toLocaleString() || 0}
                    </Text>
                    <Text className="text-gray-300 text-sm mt-1">
                      Total: ₹{cycle.total_amount?.toLocaleString() || 0}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className={`text-sm font-medium ${status.color}`}>
                      {status.text}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Billing Cycle Modal */}
      <Modal
        visible={showBillingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBillingModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-[#262624] rounded-lg p-6 w-80 max-h-[90%] border border-gray-600">
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-white text-lg font-semibold mb-4">
                Update Billing Cycle
              </Text>
              
              {selectedCycle && (
                <View className="mb-4 p-3 bg-[#1F1E1D] rounded-lg">
                  <Text className="text-gray-300 text-sm">
                    {new Date(selectedCycle.cycle_start_date).toLocaleDateString()} - {new Date(selectedCycle.cycle_end_date).toLocaleDateString()}
                  </Text>
                </View>
              )}

              <View className="mb-4">
                <Text className="text-gray-300 mb-2">Rent Amount (₹)</Text>
                <TextInput
                  className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
                  value={rentAmount}
                  onChangeText={setRentAmount}
                  placeholder="Enter rent amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-300 mb-2">Electricity Amount (₹)</Text>
                <TextInput
                  className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
                  value={electricityAmount}
                  onChangeText={setElectricityAmount}
                  placeholder="Enter electricity amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View className="mb-4 p-3 bg-[#1F1E1D] rounded-lg">
                <Text className="text-gray-300 text-sm mb-1">Total Amount</Text>
                <Text className="text-white font-semibold text-lg">₹{totalAmount.toLocaleString()}</Text>
              </View>

              <View className="mb-4">
                <Text className="text-gray-300 mb-2">Use Advance Amount (₹)</Text>
                <Text className="text-gray-400 text-xs mb-1">Available: ₹{tenant.advance_amount.toLocaleString()}</Text>
                <TextInput
                  className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
                  value={useAdvanceAmount}
                  onChangeText={setUseAdvanceAmount}
                  placeholder="Enter advance amount to use"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-300 mb-2">Balance Payment (₹)</Text>
                <Text className="text-gray-400 text-xs mb-1">Amount owed: ₹{balanceOwed.toLocaleString()}</Text>
                <TextInput
                  className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
                  value={balancePaymentAmount}
                  onChangeText={setBalancePaymentAmount}
                  placeholder="Enter balance payment amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View className="mb-4 p-3 bg-[#1F1E1D] rounded-lg">
                <Text className="text-gray-300 text-sm mb-2">Payment Summary</Text>
                <Text className="text-white text-sm">Total Amount: ₹{totalAmount.toLocaleString()}</Text>
                <Text className="text-green-400 text-sm">From Advance: ₹{amountFromAdvance.toLocaleString()}</Text>
                <Text className="text-blue-400 text-sm">Balance Payment: ₹{balancePayment.toLocaleString()}</Text>
                <Text className={`text-sm font-semibold ${finalBalance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {finalBalance > 0 ? `Remaining Balance: ₹${finalBalance.toLocaleString()}` : 'Fully Paid'}
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-gray-300 mb-2">Payment Date</Text>
                <DatePicker
                  value={paymentDate}
                  onChange={setPaymentDate}
                  placeholder="Select payment date"
                />
              </View>

              <View className="flex-row space-x-3">
                <TouchableOpacity
                  className="flex-1 bg-[#C96342] rounded-lg py-3"
                  onPress={handleBillingCycleUpdate}
                  disabled={loading}
                >
                  <Text className="text-white font-semibold text-center">
                    {loading ? 'Updating...' : 'Update Cycle'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="flex-1 bg-gray-600 rounded-lg py-3"
                  onPress={() => setShowBillingModal(false)}
                  disabled={loading}
                >
                  <Text className="text-white font-semibold text-center">Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}