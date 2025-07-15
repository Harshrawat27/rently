export interface Property {
  id: string;
  user_id: string;
  name: string;
  address: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  property_id: string;
  room_number: string;
  rent_amount: number;
  is_occupied: boolean;
  created_at: string;
  updated_at: string;
  property?: Property;
}

export interface Tenant {
  id: string;
  room_id: string;
  name: string;
  phone_number: string;
  booking_date: string;
  advance_amount: number;
  balance_amount: number;
  number_of_persons: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  room?: Room;
}

export interface ElectricMeterReading {
  id: string;
  tenant_id: string;
  current_reading: number;
  previous_reading: number;
  reading_date: string;
  units_consumed: number;
  created_at: string;
  updated_at: string;
  tenant?: Tenant;
}

export interface Database {
  public: {
    Tables: {
      properties: {
        Row: Property;
        Insert: Omit<Property, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Property, 'id' | 'created_at' | 'updated_at'>>;
      };
      rooms: {
        Row: Room;
        Insert: Omit<Room, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Room, 'id' | 'created_at' | 'updated_at'>>;
      };
      tenants: {
        Row: Tenant;
        Insert: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Tenant, 'id' | 'created_at' | 'updated_at'>>;
      };
      electric_meter_readings: {
        Row: ElectricMeterReading;
        Insert: Omit<ElectricMeterReading, 'id' | 'created_at' | 'updated_at' | 'units_consumed'>;
        Update: Partial<Omit<ElectricMeterReading, 'id' | 'created_at' | 'updated_at' | 'units_consumed'>>;
      };
    };
  };
}