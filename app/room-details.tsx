import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Room, Tenant } from '../lib/types';
import { TenantCard } from '../components/TenantCard';
import { AddTenantForm } from '../components/AddTenantForm';

export default function RoomDetailsScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchRoomDetails = async () => {
    try {
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select(`
          *,
          property:properties(*)
        `)
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;
      setRoom(roomData);

      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

      if (tenantsError) throw tenantsError;
      setTenants(tenantsData || []);
    } catch (error) {
      console.error('Error fetching room details:', error);
      Alert.alert('Error', 'Failed to load room details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails();
    }
  }, [roomId]);

  const handleTenantPress = (tenant: Tenant) => {
    router.push({
      pathname: '/tenant-details',
      params: { tenantId: tenant.id }
    });
  };

  const handleTenantAdded = () => {
    setShowAddForm(false);
    fetchRoomDetails();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Loading room details...</Text>
      </SafeAreaView>
    );
  }

  if (!room) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Room not found</Text>
      </SafeAreaView>
    );
  }

  const activeTenants = tenants.filter(tenant => tenant.is_active);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-4 py-6">
        <View className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Room {room.room_number}
          </Text>
          {room.property && (
            <Text className="text-gray-600 mb-4">
              {room.property.name}
            </Text>
          )}
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-700">
              Rent: ₹{room.rent_amount.toLocaleString()}
            </Text>
            <View className={`px-3 py-1 rounded-full ${room.is_occupied ? 'bg-red-100' : 'bg-green-100'}`}>
              <Text className={`text-sm font-medium ${room.is_occupied ? 'text-red-700' : 'text-green-700'}`}>
                {room.is_occupied ? 'Occupied' : 'Available'}
              </Text>
            </View>
          </View>
        </View>

        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-bold text-gray-800">Tenants</Text>
          {!room.is_occupied && (
            <TouchableOpacity
              className="bg-blue-600 rounded-lg px-4 py-2"
              onPress={() => setShowAddForm(!showAddForm)}
            >
              <Text className="text-white font-semibold">
                {showAddForm ? 'Cancel' : 'Add Tenant'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {showAddForm && (
          <View className="mb-6">
            <AddTenantForm roomId={roomId} onTenantAdded={handleTenantAdded} />
          </View>
        )}

        {tenants.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500 text-center">
              No tenants found. Add your first tenant to get started.
            </Text>
          </View>
        ) : (
          <FlatList
            data={tenants}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TenantCard
                tenant={item}
                onPress={() => handleTenantPress(item)}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}