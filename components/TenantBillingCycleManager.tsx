import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { supabase } from '../lib/supabase';
import { Tenant, TenantBillingCycle } from '../lib/types';

interface TenantBillingCycleManagerProps {
  tenant: Tenant;
  onUpdate: () => void;
}

export function TenantBillingCycleManager({ tenant, onUpdate }: TenantBillingCycleManagerProps) {
  const [currentCycle, setCurrentCycle] = useState<TenantBillingCycle | null>(null);
  const [nextCycle, setNextCycle] = useState<TenantBillingCycle | null>(null);
  const [loading, setLoading] = useState(false);
  const [showElectricityModal, setShowElectricityModal] = useState(false);
  const [electricityBill, setElectricityBill] = useState('0');

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

  const generateBillingCycles = async () => {
    setLoading(true);
    try {
      const bookingDate = new Date(tenant.booking_date);
      const today = new Date();
      const cycles = [];

      // Generate cycles from booking date to current date + 2 months
      let currentDate = new Date(bookingDate);
      const endGenerationDate = new Date(today);
      endGenerationDate.setMonth(endGenerationDate.getMonth() + 2);

      while (currentDate <= endGenerationDate) {
        const cycleStartDate = new Date(currentDate);
        const cycleEndDate = new Date(currentDate);
        cycleEndDate.setMonth(cycleEndDate.getMonth() + 1);
        cycleEndDate.setDate(cycleEndDate.getDate() - 1);

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
            rent_amount: tenant.room?.rent_amount || 0,
            electricity_bill: 0,
            total_amount: tenant.room?.rent_amount || 0,
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

  const handlePayRent = async () => {
    if (!currentCycle) return;

    setLoading(true);
    try {
      const electricityAmount = parseFloat(electricityBill) || 0;
      const totalAmount = currentCycle.rent_amount + electricityAmount;

      const { error } = await supabase
        .from('tenant_billing_cycles')
        .update({
          electricity_bill: electricityAmount,
          total_amount: totalAmount,
          is_paid: true,
          paid_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', currentCycle.id);

      if (error) throw error;

      // Add payment record
      await supabase
        .from('tenant_payments')
        .insert({
          tenant_id: tenant.id,
          payment_type: 'rent',
          amount: totalAmount,
          payment_date: new Date().toISOString().split('T')[0],
          description: `Monthly rent for ${new Date(currentCycle.cycle_start_date).toLocaleDateString()} - ${new Date(currentCycle.cycle_end_date).toLocaleDateString()}`,
        });

      Alert.alert('Success', 'Rent paid successfully');
      setShowElectricityModal(false);
      fetchCurrentCycle();
      fetchNextCycle();
      onUpdate();
    } catch (error) {
      console.error('Error paying rent:', error);
      Alert.alert('Error', 'Failed to pay rent');
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilNextBilling = () => {
    if (!nextCycle) return null;
    const today = new Date();
    const nextBillingDate = new Date(nextCycle.cycle_start_date);
    const diffTime = nextBillingDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysLeftInCurrentCycle = () => {
    if (!currentCycle) return null;
    const today = new Date();
    const cycleEndDate = new Date(currentCycle.cycle_end_date);
    const diffTime = cycleEndDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  useEffect(() => {
    fetchCurrentCycle();
    fetchNextCycle();
  }, [tenant.id]);

  return (
    <View className="bg-[#262624] rounded-lg p-4 border border-gray-700">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-semibold text-white">Billing Cycle</Text>
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
        <View className="bg-[#1F1E1D] rounded-lg p-4 mb-4">
          <Text className="text-white font-semibold mb-2">Current Billing Cycle</Text>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-300">
              {new Date(currentCycle.cycle_start_date).toLocaleDateString()} - {new Date(currentCycle.cycle_end_date).toLocaleDateString()}
            </Text>
            <View className={`px-2 py-1 rounded-full ${
              currentCycle.is_paid ? 'bg-green-800/20' : 'bg-red-800/20'
            }`}>
              <Text className={`text-xs font-medium ${
                currentCycle.is_paid ? 'text-green-400' : 'text-red-400'
              }`}>
                {currentCycle.is_paid ? 'Paid' : 'Unpaid'}
              </Text>
            </View>
          </View>
          
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-300">Rent Amount:</Text>
            <Text className="text-white">₹{currentCycle.rent_amount.toLocaleString()}</Text>
          </View>
          
          {currentCycle.electricity_bill > 0 && (
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-300">Electricity Bill:</Text>
              <Text className="text-white">₹{currentCycle.electricity_bill.toLocaleString()}</Text>
            </View>
          )}
          
          <View className="flex-row justify-between items-center pt-2 border-t border-gray-600">
            <Text className="text-gray-300 font-semibold">Total Amount:</Text>
            <Text className="text-white font-semibold">₹{currentCycle.total_amount.toLocaleString()}</Text>
          </View>

          {getDaysLeftInCurrentCycle() !== null && (
            <Text className="text-gray-400 text-sm mt-2">
              {getDaysLeftInCurrentCycle()} days left in current cycle
            </Text>
          )}

          {!currentCycle.is_paid && (
            <TouchableOpacity
              className="bg-[#C96342] rounded-lg py-2 mt-3"
              onPress={() => setShowElectricityModal(true)}
              disabled={loading}
            >
              <Text className="text-white font-semibold text-center">
                Pay Rent
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View className="bg-[#1F1E1D] rounded-lg p-4 mb-4">
          <Text className="text-gray-400 text-center">
            No current billing cycle found. Generate cycles to start billing.
          </Text>
        </View>
      )}

      {/* Next Billing Countdown */}
      {nextCycle && getDaysUntilNextBilling() !== null && (
        <View className="bg-[#1F1E1D] rounded-lg p-4">
          <Text className="text-white font-semibold mb-2">Next Billing</Text>
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-300">
              {new Date(nextCycle.cycle_start_date).toLocaleDateString()}
            </Text>
            <Text className="text-orange-400 font-semibold">
              {getDaysUntilNextBilling()} days left
            </Text>
          </View>
        </View>
      )}

      {/* Electricity Bill Modal */}
      <Modal
        visible={showElectricityModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowElectricityModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-[#262624] rounded-lg p-6 w-80 border border-gray-600">
            <Text className="text-white text-lg font-semibold mb-4">
              Pay Rent
            </Text>
            
            <View className="mb-4">
              <Text className="text-gray-300 mb-2">Electricity Bill Amount (₹)</Text>
              <TextInput
                className="bg-[#1F1E1D] text-white border border-gray-600 rounded-lg px-3 py-2"
                value={electricityBill}
                onChangeText={setElectricityBill}
                placeholder="Enter electricity bill amount"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>
            
            {currentCycle && (
              <View className="mb-4 p-3 bg-[#1F1E1D] rounded-lg">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-300">Rent Amount:</Text>
                  <Text className="text-white">₹{currentCycle.rent_amount.toLocaleString()}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-300">Electricity Bill:</Text>
                  <Text className="text-white">₹{(parseFloat(electricityBill) || 0).toLocaleString()}</Text>
                </View>
                <View className="flex-row justify-between pt-2 border-t border-gray-600">
                  <Text className="text-white font-semibold">Total Amount:</Text>
                  <Text className="text-white font-semibold">₹{(currentCycle.rent_amount + (parseFloat(electricityBill) || 0)).toLocaleString()}</Text>
                </View>
              </View>
            )}
            
            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-[#C96342] rounded-lg py-3"
                onPress={handlePayRent}
                disabled={loading}
              >
                <Text className="text-white font-semibold text-center">
                  {loading ? 'Paying...' : 'Pay Rent'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-1 bg-gray-600 rounded-lg py-3"
                onPress={() => setShowElectricityModal(false)}
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