import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Property, Room, Tenant, RentCollection, PropertyExpense, TenantPayment } from '../../lib/types';

export default function DashboardScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [rentCollections, setRentCollections] = useState<RentCollection[]>([]);
  const [tenantPayments, setTenantPayments] = useState<TenantPayment[]>([]);
  const [expenses, setExpenses] = useState<PropertyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const { signOut } = useAuth();

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    
    switch (timeRange) {
      case 'monthly':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'quarterly':
        start.setMonth(now.getMonth() - 3);
        break;
      case 'yearly':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return { start: start.toISOString(), end: now.toISOString() };
  };

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      const { start, end } = getDateRange();
      
      const [propertiesResult, roomsResult, tenantsResult, rentCollectionsResult, tenantPaymentsResult, expensesResult] = await Promise.all([
        supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('rooms').select('*'),
        supabase.from('tenants').select('*').eq('is_active', true),
        supabase
          .from('rent_collections')
          .select('*')
          .gte('collected_date', start)
          .lte('collected_date', end)
          .eq('is_collected', true),
        supabase
          .from('tenant_payments')
          .select('*')
          .gte('payment_date', start.split('T')[0])
          .lte('payment_date', end.split('T')[0])
          .gt('amount', 0),
        supabase
          .from('property_expenses')
          .select('*')
          .gte('expense_date', start.split('T')[0])
          .lte('expense_date', end.split('T')[0])
      ]);

      if (propertiesResult.error) {
        console.error('Properties error:', propertiesResult.error);
        throw propertiesResult.error;
      }
      if (roomsResult.error) {
        console.error('Rooms error:', roomsResult.error);
        throw roomsResult.error;
      }
      if (tenantsResult.error) {
        console.error('Tenants error:', tenantsResult.error);
        throw tenantsResult.error;
      }
      if (rentCollectionsResult.error) {
        console.error('Rent collections error:', rentCollectionsResult.error);
        throw rentCollectionsResult.error;
      }
      if (tenantPaymentsResult.error) {
        console.error('Tenant payments error:', tenantPaymentsResult.error);
        throw tenantPaymentsResult.error;
      }
      if (expensesResult.error) {
        console.error('Expenses error:', expensesResult.error);
        throw expensesResult.error;
      }

      console.log('Data fetched successfully:', {
        properties: propertiesResult.data?.length || 0,
        rooms: roomsResult.data?.length || 0,
        tenants: tenantsResult.data?.length || 0,
        rentCollections: rentCollectionsResult.data?.length || 0,
        tenantPayments: tenantPaymentsResult.data?.length || 0,
        expenses: expensesResult.data?.length || 0
      });

      setProperties(propertiesResult.data || []);
      setRooms(roomsResult.data || []);
      setTenants(tenantsResult.data || []);
      setRentCollections(rentCollectionsResult.data || []);
      setTenantPayments(tenantPaymentsResult.data || []);
      setExpenses(expensesResult.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Don't show alert here as it might interfere with navigation
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView className='flex-1 justify-center items-center bg-[#1F1E1D]'>
        <Text className='text-white'>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  const occupiedRooms = rooms.filter((room) => room.is_occupied).length;
  const totalRooms = rooms.length;
  const totalIncome = rentCollections.reduce((sum, collection) => sum + collection.total_amount, 0);
  const totalPayments = tenantPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalRevenue = totalIncome + totalPayments;
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const profitLoss = totalRevenue - totalExpenses;
  
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'monthly': return 'Last Month';
      case 'quarterly': return 'Last 3 Months';
      case 'yearly': return 'Last Year';
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-[#1F1E1D]'>
      <ScrollView className='flex-1 px-4 py-6'>
        <View className='flex-row justify-between items-center mb-6'>
          <Text className='text-2xl font-bold text-white'>Dashboard</Text>
          <TouchableOpacity
            onPress={signOut}
            className='bg-[#C96342] rounded-lg px-4 py-2'
          >
            <Text className='text-white font-semibold'>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Time Range Selector */}
        <View className='mb-6'>
          <Text className='text-white font-semibold mb-2'>Time Range</Text>
          <View className='bg-[#262624] border border-gray-600 rounded-lg'>
            <Picker
              selectedValue={timeRange}
              onValueChange={(value) => setTimeRange(value)}
              style={{ color: 'white', backgroundColor: '#262624' }}
              dropdownIconColor="white"
            >
              <Picker.Item label="Last Month" value="monthly" color="white" />
              <Picker.Item label="Last 3 Months" value="quarterly" color="white" />
              <Picker.Item label="Last Year" value="yearly" color="white" />
            </Picker>
          </View>
        </View>

        {/* Property Statistics */}
        <View className='grid grid-cols-2 gap-4 mb-6'>
          <View className='bg-[#262624] rounded-lg p-4 border border-gray-700'>
            <Text className='text-2xl font-bold text-[#C96342]'>
              {properties.length}
            </Text>
            <Text className='text-gray-300'>Properties</Text>
          </View>

          <View className='bg-[#262624] rounded-lg p-4 border border-gray-700'>
            <Text className='text-2xl font-bold text-[#C96342]'>
              {totalRooms}
            </Text>
            <Text className='text-gray-300'>Total Rooms</Text>
          </View>

          <View className='bg-[#262624] rounded-lg p-4 border border-gray-700'>
            <Text className='text-2xl font-bold text-[#C96342]'>
              {occupiedRooms}
            </Text>
            <Text className='text-gray-300'>Occupied Rooms</Text>
          </View>

          <View className='bg-[#262624] rounded-lg p-4 border border-gray-700'>
            <Text className='text-2xl font-bold text-[#C96342]'>
              {tenants.length}
            </Text>
            <Text className='text-gray-300'>Active Tenants</Text>
          </View>
        </View>

        {/* Financial Overview */}
        <View className='bg-[#262624] rounded-lg p-6 border border-gray-700 mb-6'>
          <Text className='text-xl font-bold text-white mb-4'>
            Financial Overview ({getTimeRangeLabel()})
          </Text>
          
          <View className='grid grid-cols-1 gap-4'>
            <View className='bg-[#1F1E1D] rounded-lg p-4'>
              <Text className='text-gray-300 mb-1'>Total Income</Text>
              <Text className='text-2xl font-bold text-green-400'>
                ₹{totalRevenue.toLocaleString()}
              </Text>
            </View>
            
            <View className='bg-[#1F1E1D] rounded-lg p-4'>
              <Text className='text-gray-300 mb-1'>Total Expenses</Text>
              <Text className='text-2xl font-bold text-red-400'>
                ₹{totalExpenses.toLocaleString()}
              </Text>
            </View>
            
            <View className='bg-[#1F1E1D] rounded-lg p-4'>
              <Text className='text-gray-300 mb-1'>Profit/Loss</Text>
              <Text className={`text-2xl font-bold ${profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {profitLoss >= 0 ? '+' : ''}₹{profitLoss.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className='bg-[#262624] rounded-lg p-6 border border-gray-700'>
          <Text className='text-xl font-bold text-white mb-4'>
            Quick Actions
          </Text>
          <View className='flex-row flex-wrap gap-3'>
            <TouchableOpacity
              className='bg-[#C96342] rounded-lg px-4 py-2'
              onPress={() => router.push('./properties')}
            >
              <Text className='text-white font-semibold'>Manage Properties</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className='bg-blue-600 rounded-lg px-4 py-2'
              onPress={() => router.push('./rent-collections')}
            >
              <Text className='text-white font-semibold'>Rent Collections</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
