import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Property } from '../../lib/types';
import { PropertyCard } from '../../components/PropertyCard';
import { AddPropertyForm } from '../../components/AddPropertyForm';

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
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-600">Loading properties...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-4 py-6">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-gray-800">Properties</Text>
          <TouchableOpacity
            className="bg-blue-600 rounded-lg px-4 py-2"
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Text className="text-white font-semibold">
              {showAddForm ? 'Cancel' : 'Add Property'}
            </Text>
          </TouchableOpacity>
        </View>

        {showAddForm && (
          <View className="mb-6">
            <AddPropertyForm onPropertyAdded={handlePropertyAdded} />
          </View>
        )}

        {properties.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500 text-center">
              No properties found. Add your first property to get started.
            </Text>
          </View>
        ) : (
          <FlatList
            data={properties}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PropertyCard
                property={item}
                onPress={() => handlePropertyPress(item)}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}