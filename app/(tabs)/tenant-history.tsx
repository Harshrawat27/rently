import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Header } from '../../components/Header';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Room, Tenant, TenantBillingCycle } from '../../lib/types';

interface TenantHistoryEntry {
  tenant: Tenant;
  room: Room;
  property: { id: string; name: string };
  occupancy_months: string[];
  current_cycle?: TenantBillingCycle;
}

interface RoomHistory {
  room: Room;
  property: { id: string; name: string };
  tenants: Array<{
    tenant: Tenant;
    occupancy_months: string[];
  }>;
}

export default function TenantHistoryScreen() {
  const [roomHistories, setRoomHistories] = useState<RoomHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'room' | 'tenant'>('room');
  const { user } = useAuth();
  const router = useRouter();

  const fetchTenantHistory = async () => {
    try {
      if (!user?.id) {
        setRoomHistories([]);
        return;
      }

      // Get all tenants with their room and property information
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select(`
          *,
          room:rooms(
            *,
            property:properties!inner(
              id,
              name,
              user_id
            )
          )
        `)
        .eq('room.property.user_id', user.id)
        .order('booking_date', { ascending: false });

      if (tenantsError) throw tenantsError;

      // Get billing cycles for all tenants
      const tenantIds = tenantsData?.map(t => t.id) || [];
      const { data: cyclesData, error: cyclesError } = await supabase
        .from('tenant_billing_cycles')
        .select('*')
        .in('tenant_id', tenantIds)
        .order('cycle_start_date', { ascending: true });

      if (cyclesError) throw cyclesError;

      // Group tenants by room
      const roomHistoriesMap = new Map<string, RoomHistory>();

      tenantsData?.forEach(tenant => {
        const roomId = tenant.room_id;
        if (!roomHistoriesMap.has(roomId)) {
          roomHistoriesMap.set(roomId, {
            room: tenant.room,
            property: tenant.room.property,
            tenants: []
          });
        }

        // Calculate occupancy months for this tenant
        const tenantCycles = cyclesData?.filter(c => c.tenant_id === tenant.id) || [];
        const occupancyMonths = tenantCycles.map(cycle => {
          const startDate = new Date(cycle.cycle_start_date);
          return `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
        });

        // Add booking month if not already included
        const bookingDate = new Date(tenant.booking_date);
        const bookingMonth = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;
        if (!occupancyMonths.includes(bookingMonth)) {
          occupancyMonths.unshift(bookingMonth);
        }

        roomHistoriesMap.get(roomId)!.tenants.push({
          tenant,
          occupancy_months: [...new Set(occupancyMonths)].sort().reverse()
        });
      });

      setRoomHistories(Array.from(roomHistoriesMap.values()));
    } catch (error) {
      console.error('Error fetching tenant history:', error);
      Alert.alert('Error', 'Failed to load tenant history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantHistory();
  }, [user?.id]);

  const handleViewTenantDetails = (tenantId: string, roomId: string, month: string) => {
    router.push({
      pathname: '/tenant-payment-history',
      params: { tenantId, roomId, month }
    });
  };

  const renderRoomHistory = (roomHistory: RoomHistory) => (
    <View key={roomHistory.room.id} className="bg-[#262624] rounded-lg p-4 mb-4 border border-gray-700">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-semibold text-white">
          Room {roomHistory.room.room_number}
        </Text>
        <Text className="text-sm text-gray-400">
          {roomHistory.property.name}
        </Text>
      </View>
      
      <Text className="text-gray-300 mb-3">
        Rent: ₹{roomHistory.room.rent_amount.toLocaleString()}/month
      </Text>

      {roomHistory.tenants.map((tenantHistory, index) => (
        <View key={tenantHistory.tenant.id} className="mb-4 last:mb-0">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white font-medium">
              {tenantHistory.tenant.name}
            </Text>
            <View className={`px-2 py-1 rounded-full ${tenantHistory.tenant.is_active ? 'bg-green-800/20' : 'bg-red-800/20'}`}>
              <Text className={`text-xs ${tenantHistory.tenant.is_active ? 'text-green-400' : 'text-red-400'}`}>
                {tenantHistory.tenant.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          
          <Text className="text-gray-400 text-sm mb-2">
            Booking Date: {new Date(tenantHistory.tenant.booking_date).toLocaleDateString()}
          </Text>
          
          <Text className="text-gray-300 text-sm mb-2">
            Occupancy Months:
          </Text>
          
          <View className="flex-row flex-wrap gap-2">
            {tenantHistory.occupancy_months.map(month => (
              <TouchableOpacity
                key={month}
                className="bg-[#C96342] rounded-lg px-3 py-1"
                onPress={() => handleViewTenantDetails(tenantHistory.tenant.id, roomHistory.room.id, month)}
              >
                <Text className="text-white text-xs">
                  {new Date(`${month}-01`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {index < roomHistory.tenants.length - 1 && (
            <View className="border-b border-gray-600 mt-3" />
          )}
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#1F1E1D]">
        <Text className="text-white">Loading tenant history...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#1F1E1D]" edges={['top']}>
      <Header title="Tenant History" />
      
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
      >
        {roomHistories.length === 0 ? (
          <View className="flex-1 justify-center items-center py-12">
            <Text className="text-gray-400 text-center">
              No tenant history found.
            </Text>
          </View>
        ) : (
          <View>
            <Text className="text-white text-lg font-semibold mb-4">
              Room Occupancy History
            </Text>
            
            {roomHistories.map(renderRoomHistory)}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}