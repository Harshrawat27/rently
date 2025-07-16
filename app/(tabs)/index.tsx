import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Property, Room, Tenant } from '../../lib/types';

export default function DashboardScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const { signOut } = useAuth();

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      const [propertiesResult, roomsResult, tenantsResult] = await Promise.all([
        supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('rooms').select('*'),
        supabase.from('tenants').select('*').eq('is_active', true),
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

      console.log('Data fetched successfully:', {
        properties: propertiesResult.data?.length || 0,
        rooms: roomsResult.data?.length || 0,
        tenants: tenantsResult.data?.length || 0
      });

      setProperties(propertiesResult.data || []);
      setRooms(roomsResult.data || []);
      setTenants(tenantsResult.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Don't show alert here as it might interfere with navigation
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
  const totalRevenue = tenants.reduce(
    (sum, tenant) => sum + tenant.advance_amount,
    0
  );
  const totalBalance = tenants.reduce(
    (sum, tenant) => sum + tenant.balance_amount,
    0
  );

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

        <View className='grid grid-cols-2 gap-4 mb-6'>
          <View className='bg-[#262624] rounded-lg p-4 border border-gray-700'>
            <Text className='text-2xl font-bold text-[#C96342]'>
              ₹{totalRevenue.toLocaleString()}
            </Text>
            <Text className='text-gray-300'>Total Advances</Text>
          </View>

          <View className='bg-[#262624] rounded-lg p-4 border border-gray-700'>
            <Text className='text-2xl font-bold text-[#C96342]'>
              ₹{totalBalance.toLocaleString()}
            </Text>
            <Text className='text-gray-300'>Total Balance</Text>
          </View>
        </View>

        <View className='bg-[#262624] rounded-lg p-6 border border-gray-700 mb-6'>
          <Text className='text-xl font-bold text-white mb-4'>
            Recent Properties
          </Text>
          {properties.slice(0, 3).map((property) => (
            <TouchableOpacity
              key={property.id}
              className='mb-3 pb-3 border-b border-gray-600 last:border-b-0'
              onPress={() =>
                router.push({
                  pathname: './property-details',
                  params: { propertyId: property.id },
                })
              }
            >
              <Text className='text-white font-medium'>{property.name}</Text>
              <Text className='text-gray-300 text-sm'>{property.address}</Text>
            </TouchableOpacity>
          ))}

          {properties.length === 0 && (
            <Text className='text-gray-400 text-center py-4'>
              No properties found. Add your first property to get started.
            </Text>
          )}
        </View>

        <View className='bg-[#262624] rounded-lg p-6 border border-gray-700'>
          <Text className='text-xl font-bold text-white mb-4'>
            Recent Tenants
          </Text>
          {tenants.slice(0, 3).map((tenant) => (
            <View
              key={tenant.id}
              className='mb-3 pb-3 border-b border-gray-600 last:border-b-0'
            >
              <Text className='text-white font-medium'>{tenant.name}</Text>
              <Text className='text-gray-300 text-sm'>
                {tenant.phone_number}
              </Text>
              <Text className='text-gray-400 text-sm'>
                Advance: ₹{tenant.advance_amount.toLocaleString()}
              </Text>
            </View>
          ))}

          {tenants.length === 0 && (
            <Text className='text-gray-400 text-center py-4'>
              No active tenants found.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
