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

-- Create rent_collections table
CREATE TABLE rent_collections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    rent_amount DECIMAL(10,2) NOT NULL,
    electricity_bill DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    is_collected BOOLEAN DEFAULT FALSE,
    collected_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, month)
);

-- Create property_expenses table
CREATE TABLE property_expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    expense_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tenant_payments table for tracking advance/balance payments
CREATE TABLE tenant_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('advance', 'balance', 'rent', 'cycle')),
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tenant_billing_cycles table for tracking monthly billing based on entry date
CREATE TABLE tenant_billing_cycles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    cycle_start_date DATE NOT NULL,
    cycle_end_date DATE NOT NULL,
    rent_amount DECIMAL(10,2) NOT NULL,
    electricity_bill DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    paid_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, cycle_start_date)
);

-- Create indexes for better performance
CREATE INDEX idx_properties_user_id ON properties(user_id);
CREATE INDEX idx_rooms_property_id ON rooms(property_id);
CREATE INDEX idx_tenants_room_id ON tenants(room_id);
CREATE INDEX idx_electric_readings_tenant_id ON electric_meter_readings(tenant_id);
CREATE INDEX idx_tenants_active ON tenants(is_active);
CREATE INDEX idx_rooms_occupied ON rooms(is_occupied);
CREATE INDEX idx_rent_collections_tenant_id ON rent_collections(tenant_id);
CREATE INDEX idx_rent_collections_month ON rent_collections(month);
CREATE INDEX idx_rent_collections_due_date ON rent_collections(due_date);
CREATE INDEX idx_property_expenses_property_id ON property_expenses(property_id);
CREATE INDEX idx_property_expenses_room_id ON property_expenses(room_id);
CREATE INDEX idx_property_expenses_date ON property_expenses(expense_date);
CREATE INDEX idx_tenant_payments_tenant_id ON tenant_payments(tenant_id);
CREATE INDEX idx_tenant_payments_type ON tenant_payments(payment_type);
CREATE INDEX idx_tenant_payments_date ON tenant_payments(payment_date);
CREATE INDEX idx_tenant_billing_cycles_tenant_id ON tenant_billing_cycles(tenant_id);
CREATE INDEX idx_tenant_billing_cycles_start_date ON tenant_billing_cycles(cycle_start_date);

-- Enable Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE electric_meter_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_billing_cycles ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can only see rent collections from their tenants" ON rent_collections
    FOR ALL USING (
        tenant_id IN (
            SELECT t.id FROM tenants t
            JOIN rooms r ON t.room_id = r.id
            JOIN properties p ON r.property_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can only see expenses from their properties" ON property_expenses
    FOR ALL USING (
        property_id IN (
            SELECT id FROM properties WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can only see payments from their tenants" ON tenant_payments
    FOR ALL USING (
        tenant_id IN (
            SELECT t.id FROM tenants t
            JOIN rooms r ON t.room_id = r.id
            JOIN properties p ON r.property_id = p.id
            WHERE p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can only see billing cycles from their tenants" ON tenant_billing_cycles
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

CREATE TRIGGER update_rent_collections_updated_at BEFORE UPDATE ON rent_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_property_expenses_updated_at BEFORE UPDATE ON property_expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_payments_updated_at BEFORE UPDATE ON tenant_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_billing_cycles_updated_at BEFORE UPDATE ON tenant_billing_cycles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();