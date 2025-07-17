import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { RentCollection } from '../lib/types';
import { RentCollectionCard } from '../components/RentCollectionCard';
import { Header } from '../components/Header';
import { useAuth } from '../lib/auth';

export default function RentCollectionsScreen() {
  const [rentCollections, setRentCollections] = useState<RentCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchRentCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('rent_collections')
        .select(`
          *,
          tenant:tenants(*),
          room:rooms(*)
        `)
        .eq('tenant.room.property.user_id', user?.id)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setRentCollections(data || []);
    } catch (error) {
      console.error('Error fetching rent collections:', error);
      Alert.alert('Error', 'Failed to load rent collections');
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyRentCollections = async () => {
    try {
      setLoading(true);
      
      // Get all active tenants
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select(`
          *,
          room:rooms(*)
        `)
        .eq('is_active', true)
        .eq('room.property.user_id', user?.id);

      if (tenantsError) throw tenantsError;

      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const nextMonthString = nextMonth.toISOString().slice(0, 7);

      // Generate rent collections for current and next month
      const newRentCollections = [];
      
      for (const tenant of tenants) {
        // Check if rent collection already exists for current month
        const { data: existingCurrent } = await supabase
          .from('rent_collections')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('month', currentMonth);

        if (!existingCurrent || existingCurrent.length === 0) {
          const dueDate = new Date();
          dueDate.setDate(5); // Due on 5th of each month
          
          newRentCollections.push({
            tenant_id: tenant.id,
            room_id: tenant.room_id,
            month: currentMonth,
            rent_amount: tenant.room.rent_amount,
            electricity_bill: 0,
            total_amount: tenant.room.rent_amount,
            is_collected: false,
            due_date: dueDate.toISOString(),
          });
        }

        // Check if rent collection already exists for next month
        const { data: existingNext } = await supabase
          .from('rent_collections')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('month', nextMonthString);

        if (!existingNext || existingNext.length === 0) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + 1);
          dueDate.setDate(5);
          
          newRentCollections.push({
            tenant_id: tenant.id,
            room_id: tenant.room_id,
            month: nextMonthString,
            rent_amount: tenant.room.rent_amount,
            electricity_bill: 0,
            total_amount: tenant.room.rent_amount,
            is_collected: false,
            due_date: dueDate.toISOString(),
          });
        }
      }

      if (newRentCollections.length > 0) {
        const { error } = await supabase
          .from('rent_collections')
          .insert(newRentCollections);

        if (error) throw error;
      }

      fetchRentCollections();
    } catch (error) {
      console.error('Error generating rent collections:', error);
      Alert.alert('Error', 'Failed to generate rent collections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentCollections();
  }, []);

  const rightComponent = (
    <TouchableOpacity
      className="bg-[#C96342] rounded-lg px-4 py-2"
      onPress={generateMonthlyRentCollections}
      disabled={loading}
    >
      <Text className="text-white font-semibold">
        {loading ? 'Generating...' : 'Generate'}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#1F1E1D]">
        <Text className="text-white">Loading rent collections...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#1F1E1D]">
      <Header title="Rent Collections" rightComponent={rightComponent} />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 py-6">
          {rentCollections.length === 0 ? (
            <View className="py-12 items-center">
              <Text className="text-gray-400 text-center">
                No rent collections found. Generate monthly collections to get started.
              </Text>
            </View>
          ) : (
            <View>
              {rentCollections.map((rentCollection) => (
                <RentCollectionCard
                  key={rentCollection.id}
                  rentCollection={rentCollection}
                  onUpdate={fetchRentCollections}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}