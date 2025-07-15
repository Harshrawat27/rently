import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Tenant, ElectricMeterReading } from '../lib/types';
import { MeterReadingCard } from '../components/MeterReadingCard';
import { AddMeterReadingForm } from '../components/AddMeterReadingForm';

export default function TenantDetailsScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [meterReadings, setMeterReadings] = useState<ElectricMeterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchTenantDetails = async () => {
    try {
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
      setTenant(tenantData);

      const { data: readingsData, error: readingsError } = await supabase
        .from('electric_meter_readings')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('reading_date', { ascending: false });

      if (readingsError) throw readingsError;
      setMeterReadings(readingsData || []);
    } catch (error) {
      console.error('Error fetching tenant details:', error);
      Alert.alert('Error', 'Failed to load tenant details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchTenantDetails();
    }
  }, [tenantId]);

  const handleReadingAdded = () => {
    setShowAddForm(false);
    fetchTenantDetails();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Loading tenant details...</Text>
      </SafeAreaView>
    );
  }

  if (!tenant) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Tenant not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-4 py-6">
        <View className="bg-white rounded-lg p-6 mb-6 shadow-sm border border-gray-200">
          <View className="flex-row justify-between items-start mb-4">
            <Text className="text-2xl font-bold text-gray-800">
              {tenant.name}
            </Text>
            <View className={`px-3 py-1 rounded-full ${tenant.is_active ? 'bg-green-100' : 'bg-red-100'}`}>
              <Text className={`text-sm font-medium ${tenant.is_active ? 'text-green-700' : 'text-red-700'}`}>
                {tenant.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          
          {tenant.room && (
            <Text className="text-gray-600 mb-2">
              Room {tenant.room.room_number} - {tenant.room.property?.name}
            </Text>
          )}
          
          <Text className="text-gray-600 mb-2">
            Phone: {tenant.phone_number}
          </Text>
          
          <Text className="text-gray-600 mb-4">
            Persons: {tenant.number_of_persons}
          </Text>
          
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-700">
              Advance: ₹{tenant.advance_amount.toLocaleString()}
            </Text>
            <Text className="text-gray-700">
              Balance: ₹{tenant.balance_amount.toLocaleString()}
            </Text>
          </View>
          
          <Text className="text-gray-500 text-sm">
            Booking Date: {new Date(tenant.booking_date).toLocaleDateString()}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-xl font-bold text-gray-800">Meter Readings</Text>
          <TouchableOpacity
            className="bg-blue-600 rounded-lg px-4 py-2"
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Text className="text-white font-semibold">
              {showAddForm ? 'Cancel' : 'Add Reading'}
            </Text>
          </TouchableOpacity>
        </View>

        {showAddForm && (
          <View className="mb-6">
            <AddMeterReadingForm tenantId={tenantId} onReadingAdded={handleReadingAdded} />
          </View>
        )}

        {meterReadings.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500 text-center">
              No meter readings found. Add your first reading to get started.
            </Text>
          </View>
        ) : (
          <FlatList
            data={meterReadings}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MeterReadingCard reading={item} />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}