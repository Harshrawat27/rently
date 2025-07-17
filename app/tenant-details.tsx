import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Tenant, ElectricMeterReading } from '../lib/types';
import { MeterReadingCard } from '../components/MeterReadingCard';
import { AddMeterReadingForm } from '../components/AddMeterReadingForm';
import { EditTenantForm } from '../components/EditTenantForm';
import { TenantPaymentManager } from '../components/TenantPaymentManager';
import { TenantBillingCycleManager } from '../components/TenantBillingCycleManager';
import { Header } from '../components/Header';
import { DismissibleKeyboardView } from '../components/DismissibleKeyboardView';

export default function TenantDetailsScreen() {
  const { tenantId } = useLocalSearchParams<{ tenantId: string }>();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [meterReadings, setMeterReadings] = useState<ElectricMeterReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

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

  const handleTenantUpdated = () => {
    setShowEditForm(false);
    fetchTenantDetails();
  };

  const handleArchiveTenant = async () => {
    if (!tenant) return;
    
    Alert.alert(
      'Archive Tenant',
      'Are you sure you want to archive this tenant? This will mark the room as available.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Archive', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Archive the tenant
              const { error: tenantError } = await supabase
                .from('tenants')
                .update({ is_active: false })
                .eq('id', tenant.id);

              if (tenantError) throw tenantError;

              // Mark the room as available
              const { error: roomError } = await supabase
                .from('rooms')
                .update({ is_occupied: false })
                .eq('id', tenant.room_id);

              if (roomError) throw roomError;

              Alert.alert('Success', 'Tenant archived successfully. Room is now available.');
              fetchTenantDetails();
            } catch (error) {
              console.error('Error archiving tenant:', error);
              Alert.alert('Error', 'Failed to archive tenant');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#1F1E1D]">
        <Text className="text-white">Loading tenant details...</Text>
      </SafeAreaView>
    );
  }

  if (!tenant) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#1F1E1D]">
        <Text className="text-white">Tenant not found</Text>
      </SafeAreaView>
    );
  }

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
      {tenant?.is_active && (
        <TouchableOpacity
          className="bg-red-600 rounded-lg px-4 py-2"
          onPress={handleArchiveTenant}
        >
          <Text className="text-white font-semibold">Archive</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        className="bg-[#C96342] rounded-lg px-4 py-2"
        onPress={() => setShowAddForm(!showAddForm)}
      >
        <Text className="text-white font-semibold">
          {showAddForm ? 'Cancel' : 'Add Reading'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#1F1E1D]" edges={['top']}>
      <DismissibleKeyboardView className="flex-1">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <Header 
            title={tenant?.name || 'Tenant Details'} 
            rightComponent={rightComponent}
          />
          
          <ScrollView 
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View className="px-4 py-6">
              <View className="bg-[#262624] rounded-lg p-6 mb-6 border border-gray-700">
                <View className="flex-row justify-between items-start mb-4">
                  <Text className="text-2xl font-bold text-white">
                    {tenant.name}
                  </Text>
                  <View className={`px-3 py-1 rounded-full ${tenant.is_active ? 'bg-green-800/20' : 'bg-red-800/20'}`}>
                    <Text className={`text-sm font-medium ${tenant.is_active ? 'text-green-400' : 'text-red-400'}`}>
                      {tenant.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                
                {tenant.room && (
                  <Text className="text-gray-300 mb-2">
                    Room {tenant.room.room_number} - {tenant.room.property?.name}
                  </Text>
                )}
                
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-gray-300">
                    Phone: {tenant.phone_number}
                  </Text>
                  <TouchableOpacity
                    className="bg-green-600 rounded-lg px-3 py-1"
                    onPress={() => {
                      const phoneUrl = `tel:${tenant.phone_number}`;
                      Linking.openURL(phoneUrl).catch(err => {
                        console.error('Error opening phone dialer:', err);
                        Alert.alert('Error', 'Unable to open phone dialer');
                      });
                    }}
                  >
                    <Text className="text-white font-semibold text-sm">Call</Text>
                  </TouchableOpacity>
                </View>
                
                <Text className="text-gray-300 mb-4">
                  Persons: {tenant.number_of_persons}
                </Text>
                
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-300">
                    Advance: ₹{tenant.advance_amount.toLocaleString()}
                  </Text>
                  <Text className="text-gray-300">
                    Balance: ₹{tenant.balance_amount.toLocaleString()}
                  </Text>
                </View>
                
                <Text className="text-gray-400 text-sm">
                  Booking Date: {new Date(tenant.booking_date).toLocaleDateString()}
                </Text>
              </View>

              {showEditForm && (
                <View className="mb-6">
                  <EditTenantForm 
                    tenant={tenant} 
                    onTenantUpdated={handleTenantUpdated}
                    onCancel={() => setShowEditForm(false)}
                  />
                </View>
              )}

              <View className="mb-6">
                <TenantPaymentManager
                  tenant={tenant}
                  onUpdate={fetchTenantDetails}
                />
              </View>

              <View className="mb-6">
                <TenantBillingCycleManager
                  tenant={tenant}
                  onUpdate={fetchTenantDetails}
                />
              </View>

              <Text className="text-xl font-bold text-white mb-4">Meter Readings</Text>

              {showAddForm && (
                <View className="mb-6">
                  <AddMeterReadingForm tenantId={tenantId} onReadingAdded={handleReadingAdded} />
                </View>
              )}

              {meterReadings.length === 0 ? (
                <View className="py-12 items-center">
                  <Text className="text-gray-400 text-center">
                    No meter readings found. Add your first reading to get started.
                  </Text>
                </View>
              ) : (
                <View>
                  {meterReadings.map((reading) => (
                    <MeterReadingCard key={reading.id} reading={reading} onUpdate={fetchTenantDetails} />
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