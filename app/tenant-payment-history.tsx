import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Header } from '../components/Header';
import { supabase } from '../lib/supabase';
import { Tenant, TenantPayment, TenantBillingCycle, Room } from '../lib/types';

interface PaymentHistoryData {
  tenant: Tenant;
  room: Room;
  property: { id: string; name: string };
  billingCycle?: TenantBillingCycle;
  payments: TenantPayment[];
  month: string;
}

export default function TenantPaymentHistoryScreen() {
  const { tenantId, roomId, month } = useLocalSearchParams<{ 
    tenantId: string; 
    roomId: string; 
    month: string; 
  }>();
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPaymentHistory = async () => {
    try {
      if (!tenantId || !month) return;

      // Get tenant details with room and property
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select(`
          *,
          room:rooms(
            *,
            property:properties(*)
          )
        `)
        .eq('id', tenantId)
        .single();

      if (tenantError) throw tenantError;

      // Get billing cycle for the specific month
      const monthStart = new Date(`${month}-01`);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

      const { data: cycleData, error: cycleError } = await supabase
        .from('tenant_billing_cycles')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('cycle_start_date', monthStart.toISOString().split('T')[0])
        .lte('cycle_start_date', monthEnd.toISOString().split('T')[0])
        .single();

      // Get all payments for this tenant in the specified month
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('tenant_payments')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('payment_date', monthStart.toISOString().split('T')[0])
        .lte('payment_date', monthEnd.toISOString().split('T')[0])
        .order('payment_date', { ascending: true });

      if (paymentsError) throw paymentsError;

      setPaymentHistory({
        tenant: tenantData,
        room: tenantData.room,
        property: tenantData.room.property,
        billingCycle: cycleData || undefined,
        payments: paymentsData || [],
        month
      });
    } catch (error) {
      console.error('Error fetching payment history:', error);
      Alert.alert('Error', 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, [tenantId, month]);

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'advance': return 'text-blue-400';
      case 'balance': return 'text-yellow-400';
      case 'rent': return 'text-green-400';
      case 'cycle': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getPaymentTypeBackground = (type: string) => {
    switch (type) {
      case 'advance': return 'bg-blue-800/20';
      case 'balance': return 'bg-yellow-800/20';
      case 'rent': return 'bg-green-800/20';
      case 'cycle': return 'bg-purple-800/20';
      default: return 'bg-gray-800/20';
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#1F1E1D]">
        <Text className="text-white">Loading payment history...</Text>
      </SafeAreaView>
    );
  }

  if (!paymentHistory) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#1F1E1D]">
        <Text className="text-white">Payment history not found</Text>
      </SafeAreaView>
    );
  }

  const monthDisplay = new Date(`${month}-01`).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <SafeAreaView className="flex-1 bg-[#1F1E1D]" edges={['top']}>
      <Header title={`${paymentHistory.tenant.name} - ${monthDisplay}`} />
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
      >
        {/* Tenant Information */}
        <View className="bg-[#262624] rounded-lg p-4 mb-4 border border-gray-700">
          <Text className="text-xl font-bold text-white mb-2">
            {paymentHistory.tenant.name}
          </Text>
          <Text className="text-gray-300 mb-2">
            Room {paymentHistory.room.room_number} - {paymentHistory.property.name}
          </Text>
          <Text className="text-gray-400">
            Phone: {paymentHistory.tenant.phone_number}
          </Text>
        </View>

        {/* Billing Cycle Information */}
        {paymentHistory.billingCycle && (
          <View className="bg-[#262624] rounded-lg p-4 mb-4 border border-gray-700">
            <Text className="text-lg font-semibold text-white mb-3">
              Billing Cycle Details
            </Text>
            
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-300">Cycle Period:</Text>
                <Text className="text-white">
                  {new Date(paymentHistory.billingCycle.cycle_start_date).toLocaleDateString()} - {' '}
                  {new Date(paymentHistory.billingCycle.cycle_end_date).toLocaleDateString()}
                </Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-300">Rent Amount:</Text>
                <Text className="text-white">₹{paymentHistory.billingCycle.rent_amount.toLocaleString()}</Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-300">Electricity Bill:</Text>
                <Text className="text-white">₹{paymentHistory.billingCycle.electricity_bill.toLocaleString()}</Text>
              </View>
              
              <View className="flex-row justify-between border-t border-gray-600 pt-2">
                <Text className="text-gray-300 font-semibold">Total Amount:</Text>
                <Text className="text-white font-semibold">₹{paymentHistory.billingCycle.total_amount.toLocaleString()}</Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-300">Payment Status:</Text>
                <View className={`px-2 py-1 rounded-full ${paymentHistory.billingCycle.is_paid ? 'bg-green-800/20' : 'bg-red-800/20'}`}>
                  <Text className={`text-xs ${paymentHistory.billingCycle.is_paid ? 'text-green-400' : 'text-red-400'}`}>
                    {paymentHistory.billingCycle.is_paid ? 'Paid' : 'Unpaid'}
                  </Text>
                </View>
              </View>
              
              {paymentHistory.billingCycle.paid_date && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-300">Paid Date:</Text>
                  <Text className="text-white">
                    {new Date(paymentHistory.billingCycle.paid_date).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Payment History */}
        <View className="bg-[#262624] rounded-lg p-4 border border-gray-700">
          <Text className="text-lg font-semibold text-white mb-4">
            Payment History for {monthDisplay}
          </Text>
          
          {paymentHistory.payments.length === 0 ? (
            <Text className="text-gray-400 text-center py-8">
              No payments recorded for this month
            </Text>
          ) : (
            <View className="space-y-3">
              {paymentHistory.payments.map((payment) => (
                <View key={payment.id} className="bg-[#1F1E1D] rounded-lg p-3 border border-gray-600">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className={`px-2 py-1 rounded-full ${getPaymentTypeBackground(payment.payment_type)}`}>
                      <Text className={`text-xs font-medium ${getPaymentTypeColor(payment.payment_type)}`}>
                        {payment.payment_type.toUpperCase()}
                      </Text>
                    </View>
                    <Text className="text-white font-semibold">
                      ₹{payment.amount.toLocaleString()}
                    </Text>
                  </View>
                  
                  <Text className="text-gray-400 text-sm mb-1">
                    Date: {new Date(payment.payment_date).toLocaleDateString()}
                  </Text>
                  
                  {payment.description && (
                    <Text className="text-gray-300 text-sm">
                      {payment.description}
                    </Text>
                  )}
                </View>
              ))}
              
              <View className="border-t border-gray-600 pt-3 mt-4">
                <View className="flex-row justify-between">
                  <Text className="text-gray-300 font-semibold">Total Payments:</Text>
                  <Text className="text-white font-semibold">
                    ₹{paymentHistory.payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}