import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Property } from '../../lib/types';
import { PropertyCard } from '../../components/PropertyCard';
import { AddPropertyForm } from '../../components/AddPropertyForm';
import { DismissibleKeyboardView } from '../../components/DismissibleKeyboardView';

export default function PropertiesScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handlePropertyPress = (property: Property) => {
    router.push({
      pathname: '/property-details',
      params: { propertyId: property.id }
    });
  };

  const handlePropertyAdded = () => {
    setShowAddForm(false);
    fetchProperties();
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#1F1E1D]">
        <Text className="text-white">Loading properties...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#1F1E1D]">
      <DismissibleKeyboardView className="flex-1">
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-row justify-between items-center px-4 py-6 bg-[#262624] border-b border-gray-700">
            <Text className="text-2xl font-bold text-white">Properties</Text>
            <TouchableOpacity
              className="bg-[#C96342] rounded-lg px-4 py-2"
              onPress={() => setShowAddForm(!showAddForm)}
            >
              <Text className="text-white font-semibold">
                {showAddForm ? 'Cancel' : 'Add Property'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            className="flex-1"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View className="px-4 py-6">
              {showAddForm && (
                <View className="mb-6">
                  <AddPropertyForm onPropertyAdded={handlePropertyAdded} />
                </View>
              )}

              {properties.length === 0 ? (
                <View className="py-12 items-center">
                  <Text className="text-gray-400 text-center">
                    No properties found. Add your first property to get started.
                  </Text>
                </View>
              ) : (
                <View>
                  {properties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onPress={() => handlePropertyPress(property)}
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