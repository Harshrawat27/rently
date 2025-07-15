-- Create properties table
CREATE TABLE properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rooms table
CREATE TABLE rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL,
    rent_amount DECIMAL(10,2) NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tenants table
CREATE TABLE tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    booking_date DATE NOT NULL,
    advance_amount DECIMAL(10,2) NOT NULL,
    balance_amount DECIMAL(10,2) NOT NULL,
    number_of_persons INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create electric_meter_readings table
CREATE TABLE electric_meter_readings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    current_reading DECIMAL(10,2) NOT NULL,
    previous_reading DECIMAL(10,2) NOT NULL,
    reading_date DATE NOT NULL,
    units_consumed DECIMAL(10,2) GENERATED ALWAYS AS (current_reading - previous_reading) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_rooms_property_id ON rooms(property_id);
CREATE INDEX idx_tenants_room_id ON tenants(room_id);
CREATE INDEX idx_electric_readings_tenant_id ON electric_meter_readings(tenant_id);
CREATE INDEX idx_tenants_active ON tenants(is_active);
CREATE INDEX idx_rooms_occupied ON rooms(is_occupied);

-- Enable Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE electric_meter_readings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only see their own properties" ON properties
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only see rooms from their properties" ON rooms
    FOR ALL USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can only see tenants from their rooms" ON tenants
    FOR ALL USING (
        room_id IN (
            SELECT r.id FROM rooms r
            JOIN properties p ON r.property_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can only see meter readings from their tenants" ON electric_meter_readings
    FOR ALL USING (
        tenant_id IN (
            SELECT t.id FROM tenants t
            JOIN rooms r ON t.room_id = r.id
            JOIN properties p ON r.property_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_electric_readings_updated_at BEFORE UPDATE ON electric_meter_readings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();