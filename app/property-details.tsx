import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Property, Room } from '../lib/types';
import { RoomCard } from '../components/RoomCard';
import { AddRoomForm } from '../components/AddRoomForm';

export default function PropertyDetailsScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchPropertyDetails = async () => {
    try {
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propertyError) throw propertyError;
      setProperty(propertyData);

      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('property_id', propertyId)
        .order('room_number');

      if (roomsError) throw roomsError;
      setRooms(roomsData || []);
    } catch (error) {
      console.error('Error fetching property details:', error);
      Alert.alert('Error', 'Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetails();
    }
  }, [propertyId]);

  const handleRoomPress = (room: Room) => {
    router.push({
      pathname: '/room-details',
      params: { roomId: room.id }
    });
  };

  const handleRoomAdded = () => {
    setShowAddForm(false);
    fetchPropertyDetails();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Loading property details...</Text>
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Property not found</Text>
      </SafeAreaView>
    );
  }

  const occupiedRooms = rooms.filter(room => room.is_occupied).length;
  const totalRooms = rooms.length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-4 py-6">
        <View className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            {property.name}
          </Text>
          <Text className="text-gray-600 mb-4">
            {property.address}
          </Text>
          {property.description && (
            <Text className="text-gray-500 mb-4">
              {property.description}
            </Text>
          )}
          <View className="flex-row justify-between">
            <Text className="text-gray-700">
              Total Rooms: {totalRooms}
            </Text>
            <Text className="text-gray-700">
              Occupied: {occupiedRooms}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-bold text-gray-800">Rooms</Text>
          <TouchableOpacity
            className="bg-blue-600 rounded-lg px-4 py-2"
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Text className="text-white font-semibold">
              {showAddForm ? 'Cancel' : 'Add Room'}
            </Text>
          </TouchableOpacity>
        </View>

        {showAddForm && (
          <View className="mb-6">
            <AddRoomForm propertyId={propertyId} onRoomAdded={handleRoomAdded} />
          </View>
        )}

        {rooms.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500 text-center">
              No rooms found. Add your first room to get started.
            </Text>
          </View>
        ) : (
          <FlatList
            data={rooms}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <RoomCard
                room={item}
                onPress={() => handleRoomPress(item)}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}