import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { RoomBillingCard } from '../../components/RoomBillingCard';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Room, Tenant, TenantBillingCycle } from '../../lib/types';

interface RoomWithBilling extends Room {
  tenant?: Tenant;
  currentCycle?: TenantBillingCycle;
  nextCycle?: TenantBillingCycle;
  daysLeft?: number;
  isOverdue?: boolean;
}

export default function RentCollectionsScreen() {
  const [rooms, setRooms] = useState<RoomWithBilling[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  const fetchRoomsWithBilling = async () => {
    try {
      if (!user?.id) {
        setRooms([]);
        return;
      }

      // Get all rooms for the user's properties
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select(
          `
          *,
          property:properties!inner(
            id,
            name,
            user_id
          ),
          tenants(
            id,
            name,
            phone_number,
            booking_date,
            advance_amount,
            balance_amount,
            is_active
          )
        `
        )
        .eq('property.user_id', user.id);

      if (roomsError) throw roomsError;

      if (!roomsData || roomsData.length === 0) {
        setRooms([]);
        return;
      }

      const roomsWithBilling: RoomWithBilling[] = [];
      const today = new Date();

      for (const room of roomsData) {
        const activeTenant = room.tenants?.find((t: any) => t.is_active);
        let roomWithBilling: RoomWithBilling = { ...room };

        if (activeTenant) {
          roomWithBilling.tenant = activeTenant;

          // Get current billing cycle
          const { data: currentCycleData } = await supabase
            .from('tenant_billing_cycles')
            .select('*')
            .eq('tenant_id', activeTenant.id)
            .lte('cycle_start_date', today.toISOString().split('T')[0])
            .gte('cycle_end_date', today.toISOString().split('T')[0])
            .single();

          if (currentCycleData) {
            roomWithBilling.currentCycle = currentCycleData;
            const cycleEndDate = new Date(currentCycleData.cycle_end_date);
            const diffTime = cycleEndDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            roomWithBilling.daysLeft = Math.max(0, diffDays);
            roomWithBilling.isOverdue =
              !currentCycleData.is_paid && diffDays < 0;
          }

          // Get next billing cycle
          const { data: nextCycleData } = await supabase
            .from('tenant_billing_cycles')
            .select('*')
            .eq('tenant_id', activeTenant.id)
            .gt('cycle_start_date', today.toISOString().split('T')[0])
            .order('cycle_start_date', { ascending: true })
            .limit(1)
            .single();

          if (nextCycleData) {
            roomWithBilling.nextCycle = nextCycleData;
            if (!roomWithBilling.daysLeft) {
              const nextCycleStart = new Date(nextCycleData.cycle_start_date);
              const diffTime = nextCycleStart.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              roomWithBilling.daysLeft = Math.max(0, diffDays);
            }
          }
        }

        roomsWithBilling.push(roomWithBilling);
      }

      // Sort by overdue first, then by days left
      roomsWithBilling.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.daysLeft !== undefined && b.daysLeft !== undefined) {
          return a.daysLeft - b.daysLeft;
        }
        return 0;
      });

      setRooms(roomsWithBilling);
    } catch (error) {
      console.error('Error fetching rooms with billing:', error);
      Alert.alert('Error', 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const generateBillingCycles = async () => {
    try {
      setLoading(true);

      if (!user?.id) {
        return;
      }

      // Get all properties for the user
      const { data: userProperties, error: propertiesError } = await supabase
        .from('properties')
        .select('id')
        .eq('user_id', user.id);

      if (propertiesError) throw propertiesError;

      if (!userProperties || userProperties.length === 0) {
        return;
      }

      const propertyIds = userProperties.map((p) => p.id);

      // Get all rooms for these properties
      const { data: userRooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id')
        .in('property_id', propertyIds);

      if (roomsError) throw roomsError;

      if (!userRooms || userRooms.length === 0) {
        return;
      }

      const roomIds = userRooms.map((r) => r.id);

      // Get all active tenants for these rooms
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, booking_date')
        .eq('is_active', true)
        .in('room_id', roomIds);

      if (tenantsError) throw tenantsError;

      const newBillingCycles = [];
      const today = new Date();

      for (const tenant of tenants) {
        const bookingDate = new Date(tenant.booking_date);
        const dayOfMonth = bookingDate.getDate();

        // Generate billing cycle for current month
        const currentCycleStart = new Date(
          today.getFullYear(),
          today.getMonth(),
          dayOfMonth
        );
        const currentCycleEnd = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          dayOfMonth - 1
        );

        // Check if current cycle exists
        const { data: existingCurrent } = await supabase
          .from('tenant_billing_cycles')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('cycle_start_date', currentCycleStart.toISOString().split('T')[0])
          .eq('cycle_end_date', currentCycleEnd.toISOString().split('T')[0]);

        if (!existingCurrent || existingCurrent.length === 0) {
          newBillingCycles.push({
            tenant_id: tenant.id,
            cycle_start_date: currentCycleStart.toISOString().split('T')[0],
            cycle_end_date: currentCycleEnd.toISOString().split('T')[0],
            is_paid: false,
            total_amount: 0,
            electricity_bill: 0,
            rent_amount: 0,
          });
        }

        // Generate billing cycle for next month
        const nextCycleStart = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          dayOfMonth
        );
        const nextCycleEnd = new Date(
          today.getFullYear(),
          today.getMonth() + 2,
          dayOfMonth - 1
        );

        // Check if next cycle exists
        const { data: existingNext } = await supabase
          .from('tenant_billing_cycles')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('cycle_start_date', nextCycleStart.toISOString().split('T')[0])
          .eq('cycle_end_date', nextCycleEnd.toISOString().split('T')[0]);

        if (!existingNext || existingNext.length === 0) {
          newBillingCycles.push({
            tenant_id: tenant.id,
            cycle_start_date: nextCycleStart.toISOString().split('T')[0],
            cycle_end_date: nextCycleEnd.toISOString().split('T')[0],
            is_paid: false,
            total_amount: 0,
            electricity_bill: 0,
            rent_amount: 0,
          });
        }
      }

      if (newBillingCycles.length > 0) {
        const { error } = await supabase
          .from('tenant_billing_cycles')
          .insert(newBillingCycles);

        if (error) throw error;
      }

      fetchRoomsWithBilling();
    } catch (error) {
      console.error('Error generating billing cycles:', error);
      Alert.alert('Error', 'Failed to generate billing cycles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomsWithBilling();
  }, []);

  const rightComponent = (
    <TouchableOpacity
      className='bg-[#C96342] rounded-lg px-4 py-2'
      onPress={generateBillingCycles}
      disabled={loading}
    >
      <Text className='text-white font-semibold'>
        {loading ? 'Generating...' : 'Generate'}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className='flex-1 justify-center items-center bg-[#1F1E1D]'>
        <Text className='text-white'>Loading rooms...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-[#1F1E1D]'>
      <Header title='Rent Collections' rightComponent={rightComponent} />

      <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
        <View className='px-4 py-6'>
          {rooms.length === 0 ? (
            <View className='py-12 items-center'>
              <Text className='text-gray-400 text-center'>
                No rooms found. Generate billing cycles to get started.
              </Text>
            </View>
          ) : (
            <View>
              {rooms.map((room) => (
                <RoomBillingCard
                  key={room.id}
                  room={room}
                  onUpdate={fetchRoomsWithBilling}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
