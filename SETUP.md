# Rently - Property Management App Setup

## Overview
Rently is a property management app for landlords to track properties, rooms, tenants, and electric meter readings built with React Native, Expo, and Supabase.

## Features
- **Authentication**: User signup/signin with email and password
- **Property management**: Add, view properties (user-specific)
- **Room management**: Add rooms to properties
- **Tenant management**: Add tenant details, bookings
- **Electric meter reading tracking**: Track consumption per tenant
- **Dashboard**: Overview statistics for landlord's data only
- **Row Level Security**: Each landlord can only see their own data

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Supabase
1. Create a new project at [https://supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Update the Supabase configuration in `lib/supabase.ts`:
   ```typescript
   const supabaseUrl = 'YOUR_SUPABASE_URL'
   const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'
   ```

### 3. Set up Database
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `lib/database.sql` into the SQL Editor
4. Execute the script to create all tables, indexes, and Row Level Security policies

### 4. Database Schema
The app uses the following tables with Row Level Security:
- `properties` - Store property information (linked to user_id)
- `rooms` - Store room details for each property
- `tenants` - Store tenant information and bookings
- `electric_meter_readings` - Store meter readings for each tenant

**Authentication**:
- Uses Supabase Auth with email/password
- Each landlord can only see their own data
- Row Level Security policies ensure data isolation

### 5. Run the App
```bash
npm start
```

## File Structure
```
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx          # Dashboard screen
│   │   ├── properties.tsx     # Properties list screen
│   │   └── _layout.tsx        # Tab navigation layout
│   ├── property-details.tsx   # Property details with rooms
│   ├── room-details.tsx       # Room details with tenants
│   └── tenant-details.tsx     # Tenant details with meter readings
├── components/
│   ├── PropertyCard.tsx       # Property card component
│   ├── AddPropertyForm.tsx    # Add property form
│   ├── RoomCard.tsx          # Room card component
│   ├── AddRoomForm.tsx       # Add room form
│   ├── TenantCard.tsx        # Tenant card component
│   ├── AddTenantForm.tsx     # Add tenant form
│   ├── MeterReadingCard.tsx  # Meter reading card
│   └── AddMeterReadingForm.tsx # Add meter reading form
├── lib/
│   ├── supabase.ts           # Supabase client configuration
│   ├── types.ts              # TypeScript type definitions
│   └── database.sql          # Database schema
```

## Usage
1. **Sign Up** - Create a new landlord account
2. **Sign In** - Access your account
3. **Dashboard** - View overview statistics and recent activities (your data only)
4. **Properties** - Add and manage your properties
5. **Rooms** - Add rooms to properties and view occupancy
6. **Tenants** - Add tenant details and manage bookings
7. **Meter Readings** - Track electric meter consumption per tenant
8. **Sign Out** - Securely log out of your account

## Tech Stack
- React Native with Expo
- TypeScript
- Supabase (PostgreSQL)
- NativeWind (TailwindCSS)
- Expo Router for navigation

## Notes
- Replace the Supabase URL and anon key with your actual values
- The app uses TypeScript for type safety
- All forms include validation and error handling
- The database schema includes automatic timestamps and constraints