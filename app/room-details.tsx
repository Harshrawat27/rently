import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Room, Tenant } from '../lib/types';
import { TenantCard } from '../components/TenantCard';
import { AddTenantForm } from '../components/AddTenantForm';
import { EditRoomForm } from '../components/EditRoomForm';
import { Header } from '../components/Header';
import { DismissibleKeyboardView } from '../components/DismissibleKeyboardView';

export default function RoomDetailsScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

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
      pathname: './tenant-details',
      params: { tenantId: tenant.id }
    });
  };

  const handleTenantAdded = () => {
    setShowAddForm(false);
    fetchRoomDetails();
  };

  const handleRoomUpdated = () => {
    setShowEditForm(false);
    fetchRoomDetails();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#1F1E1D]">
        <Text className="text-white">Loading room details...</Text>
      </SafeAreaView>
    );
  }

  if (!room) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#1F1E1D]">
        <Text className="text-white">Room not found</Text>
      </SafeAreaView>
    );
  }

  const activeTenants = tenants.filter(tenant => tenant.is_active);

  const rightComponent = (
    <View className="flex-row space-x-2">
      <TouchableOpacity
        className="bg-blue-600 rounded-lg px-4 py-2"
        onPress={() => setShowEditForm(!showEditForm)}
      >
        <Text className="text-white font-semibold">
          {showEditForm ? 'Cancel' : 'Edit'}
        </Text>
      </TouchableOpacity>
      {!room?.is_occupied && (
        <TouchableOpacity
          className="bg-[#C96342] rounded-lg px-4 py-2"
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Text className="text-white font-semibold">
            {showAddForm ? 'Cancel' : 'Add Tenant'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#1F1E1D]">
      <DismissibleKeyboardView className="flex-1">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Header 
            title={room ? `Room ${room.room_number}` : 'Room Details'} 
            rightComponent={rightComponent}
          />
          
          <ScrollView 
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="px-4 py-6">
              <View className="bg-[#262624] rounded-lg p-6 mb-6 border border-gray-700">
                <Text className="text-2xl font-bold text-white mb-2">
                  Room {room.room_number}
                </Text>
                {room.property && (
                  <Text className="text-gray-300 mb-4">
                    {room.property.name}
                  </Text>
                )}
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-300">
                    Rent: ₹{room.rent_amount.toLocaleString()}
                  </Text>
                  <View className={`px-3 py-1 rounded-full ${room.is_occupied ? 'bg-red-800/20' : 'bg-green-800/20'}`}>
                    <Text className={`text-sm font-medium ${room.is_occupied ? 'text-red-400' : 'text-green-400'}`}>
                      {room.is_occupied ? 'Occupied' : 'Available'}
                    </Text>
                  </View>
                </View>
              </View>

              {showEditForm && (
                <View className="mb-6">
                  <EditRoomForm 
                    room={room} 
                    onRoomUpdated={handleRoomUpdated}
                    onCancel={() => setShowEditForm(false)}
                  />
                </View>
              )}

              <Text className="text-xl font-bold text-white mb-4">Tenants</Text>

              {showAddForm && (
                <View className="mb-6">
                  <AddTenantForm roomId={roomId} onTenantAdded={handleTenantAdded} />
                </View>
              )}

              {tenants.length === 0 ? (
                <View className="py-12 items-center">
                  <Text className="text-gray-400 text-center">
                    No tenants found. Add your first tenant to get started.
                  </Text>
                </View>
              ) : (
                <View>
                  {tenants.map((tenant) => (
                    <TenantCard
                      key={tenant.id}
                      tenant={tenant}
                      onPress={() => handleTenantPress(tenant)}
                      onUpdate={fetchRoomDetails}
                    />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </DismissibleKeyboardView>
    </SafeAreaView>
  );
}