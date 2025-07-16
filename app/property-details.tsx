import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AddRoomForm } from '../components/AddRoomForm';
import { DismissibleKeyboardView } from '../components/DismissibleKeyboardView';
import { Header } from '../components/Header';
import { RoomCard } from '../components/RoomCard';
import { supabase } from '../lib/supabase';
import { Property, Room } from '../lib/types';

export default function PropertyDetailsScreen() {
  const { propertyId } = useLocalSearchParams<{ propertyId: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const router = useRouter();

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
    // Use relative path for better navigation
    router.push({
      pathname: './room-details',
      params: { roomId: room.id },
    });
  };

  const handleRoomAdded = () => {
    setShowAddForm(false);
    fetchPropertyDetails();
  };

  if (loading) {
    return (
      <SafeAreaView className='flex-1 justify-center items-center bg-[#1F1E1D]'>
        <Text className='text-white'>Loading property details...</Text>
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView className='flex-1 justify-center items-center bg-[#1F1E1D]'>
        <Text className='text-white'>Property not found</Text>
      </SafeAreaView>
    );
  }

  const occupiedRooms = rooms.filter((room) => room.is_occupied).length;
  const totalRooms = rooms.length;

  const rightComponent = (
    <TouchableOpacity
      className='bg-[#C96342] rounded-lg px-4 py-2'
      onPress={() => setShowAddForm(!showAddForm)}
    >
      <Text className='text-white font-semibold'>
        {showAddForm ? 'Cancel' : 'Add Room'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className='flex-1 bg-[#1F1E1D]'>
      <DismissibleKeyboardView className='flex-1'>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className='flex-1'
        >
          <Header
            title={property?.name || 'Property Details'}
            rightComponent={rightComponent}
          />

          <ScrollView
            className='flex-1'
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps='handled'
          >
            <View className='px-4 py-6'>
              <View className='bg-[#262624] rounded-lg p-6 mb-6 border border-gray-700'>
                <Text className='text-2xl font-bold text-white mb-2'>
                  {property.name}
                </Text>
                <Text className='text-gray-300 mb-4'>{property.address}</Text>
                {property.description && (
                  <Text className='text-gray-400 mb-4'>
                    {property.description}
                  </Text>
                )}
                <View className='flex-row justify-between'>
                  <Text className='text-gray-300'>
                    Total Rooms: {totalRooms}
                  </Text>
                  <Text className='text-gray-300'>
                    Occupied: {occupiedRooms}
                  </Text>
                </View>
              </View>

              <Text className='text-xl font-bold text-white mb-4'>
                Rooms
              </Text>

              {showAddForm && (
                <View className='mb-6'>
                  <AddRoomForm
                    propertyId={propertyId}
                    onRoomAdded={handleRoomAdded}
                  />
                </View>
              )}

              {rooms.length === 0 ? (
                <View className='py-12 items-center'>
                  <Text className='text-gray-400 text-center'>
                    No rooms found. Add your first room to get started.
                  </Text>
                </View>
              ) : (
                <View>
                  {rooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onPress={() => handleRoomPress(room)}
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
