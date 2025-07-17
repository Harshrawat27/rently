import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Room, Tenant, TenantBillingCycle } from '../lib/types';

interface RoomWithBilling extends Room {
  tenant?: Tenant;
  currentCycle?: TenantBillingCycle;
  nextCycle?: TenantBillingCycle;
  daysLeft?: number;
  isOverdue?: boolean;
}

interface RoomBillingCardProps {
  room: RoomWithBilling;
  onUpdate: () => void;
}

export const RoomBillingCard: React.FC<RoomBillingCardProps> = ({ room, onUpdate }) => {
  const router = useRouter();

  const handlePress = () => {
    if (room.tenant) {
      router.push({
        pathname: '/tenant-details',
        params: { tenantId: room.tenant.id }
      });
    }
  };

  const getStatusColor = () => {
    if (!room.tenant) return 'bg-green-800/20';
    if (room.isOverdue) return 'bg-red-800/20';
    if (room.daysLeft !== undefined && room.daysLeft <= 3) return 'bg-yellow-800/20';
    return 'bg-blue-800/20';
  };

  const getStatusTextColor = () => {
    if (!room.tenant) return 'text-green-400';
    if (room.isOverdue) return 'text-red-400';
    if (room.daysLeft !== undefined && room.daysLeft <= 3) return 'text-yellow-400';
    return 'text-blue-400';
  };

  const getStatusText = () => {
    if (!room.tenant) return 'Available';
    if (room.isOverdue) return 'Overdue';
    if (room.daysLeft !== undefined && room.daysLeft <= 3) return `${room.daysLeft} days left`;
    if (room.daysLeft !== undefined) return `${room.daysLeft} days left`;
    return 'No billing cycle';
  };

  return (
    <TouchableOpacity 
      onPress={handlePress}
      className="bg-[#262624] rounded-lg p-4 mb-4 border border-gray-700"
      disabled={!room.tenant}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-semibold text-white">
          Room {room.room_number}
        </Text>
        <View className={`px-2 py-1 rounded-full ${getStatusColor()}`}>
          <Text className={`text-xs font-medium ${getStatusTextColor()}`}>
            {getStatusText()}
          </Text>
        </View>
      </View>
      
      <Text className="text-gray-300 mb-1">
        Rent: ₹{room.rent_amount.toLocaleString()}
      </Text>

      {room.tenant && (
        <View className="mt-2">
          <Text className="text-gray-300 mb-1">
            Tenant: {room.tenant.name}
          </Text>
          <Text className="text-gray-400 text-sm">
            Phone: {room.tenant.phone_number}
          </Text>
          
          {room.currentCycle && (
            <View className="mt-2 p-2 bg-[#1F1E1D] rounded">
              <Text className="text-gray-300 text-sm">
                Current Cycle: {new Date(room.currentCycle.cycle_start_date).toLocaleDateString()} - {new Date(room.currentCycle.cycle_end_date).toLocaleDateString()}
              </Text>
              <Text className={`text-sm ${room.currentCycle.is_paid ? 'text-green-400' : 'text-orange-400'}`}>
                Status: {room.currentCycle.is_paid ? 'Paid' : 'Unpaid'}
              </Text>
              {room.currentCycle.total_amount && room.currentCycle.total_amount > 0 && (
                <Text className="text-gray-400 text-sm">
                  Amount: ₹{room.currentCycle.total_amount.toLocaleString()}
                </Text>
              )}
            </View>
          )}
          
          {room.tenant.advance_amount > 0 && (
            <Text className="text-green-400 text-sm mt-1">
              Advance: ₹{room.tenant.advance_amount.toLocaleString()}
            </Text>
          )}
          
          {room.tenant.balance_amount > 0 && (
            <Text className="text-red-400 text-sm mt-1">
              Balance: ₹{room.tenant.balance_amount.toLocaleString()}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};