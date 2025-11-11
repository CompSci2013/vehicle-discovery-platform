/*
  DEMO DATA FOR BASE TABLE COMPONENT DEVELOPMENT

  PURPOSE:
  Provides realistic, comprehensive test data for building BaseTableComponent
  without dependency on live backend API.

  DATA STRUCTURE:
  Matches real API responses exactly (from PROJECT-OVERVIEW.md)
  so migration to real API is seamless.

  COVERAGE:
  - Normal cases: Typical data
  - Edge cases: Empty arrays, null values, long strings
  - Large dataset: Enough for pagination testing (100+ records)
  - Hierarchical data: Manufacturers → Models relationship
  - Expandable data: Vehicle → VIN instances relationship
*/

/**
 * MANUFACTURER-MODEL DATA
 * Used for picker table (selection enabled)
 *
 * Matches: GET /api/search/manufacturer-model-counts
 */
export interface ManufacturerModel {
  model: string;
  count: number;
}

export interface Manufacturer {
  manufacturer: string;
  models: ManufacturerModel[];
}

export const DEMO_MANUFACTURERS: Manufacturer[] = [
  {
    manufacturer: 'Ford',
    models: [
      { model: 'F-150', count: 45231 },
      { model: 'Mustang', count: 12450 },
      { model: 'Explorer', count: 8920 },
      { model: 'Escape', count: 7543 },
      { model: 'Fusion', count: 6234 },
      { model: 'Edge', count: 5123 },
      { model: 'Ranger', count: 4567 },
      { model: 'Expedition', count: 3421 }
    ]
  },
  {
    manufacturer: 'Chevrolet',
    models: [
      { model: 'Corvette', count: 6543 },
      { model: 'Silverado', count: 38921 },
      { model: 'Camaro', count: 9876 },
      { model: 'Equinox', count: 7654 },
      { model: 'Malibu', count: 5432 },
      { model: 'Tahoe', count: 4321 },
      { model: 'Suburban', count: 3210 }
    ]
  },
  {
    manufacturer: 'Toyota',
    models: [
      { model: 'Camry', count: 15678 },
      { model: 'Corolla', count: 18234 },
      { model: 'RAV4', count: 12456 },
      { model: 'Tacoma', count: 9876 },
      { model: 'Highlander', count: 8765 },
      { model: '4Runner', count: 6543 },
      { model: 'Tundra', count: 5432 }
    ]
  },
  {
    manufacturer: 'Honda',
    models: [
      { model: 'Accord', count: 14567 },
      { model: 'Civic', count: 16789 },
      { model: 'CR-V', count: 11234 },
      { model: 'Pilot', count: 7890 },
      { model: 'Odyssey', count: 5678 },
      { model: 'Ridgeline', count: 3456 }
    ]
  },
  {
    manufacturer: 'Tesla',
    models: [
      { model: 'Model 3', count: 8765 },
      { model: 'Model Y', count: 7654 },
      { model: 'Model S', count: 4321 },
      { model: 'Model X', count: 3210 }
    ]
  },
  {
    manufacturer: 'BMW',
    models: [
      { model: '3 Series', count: 5432 },
      { model: '5 Series', count: 4321 },
      { model: 'X3', count: 3456 },
      { model: 'X5', count: 2987 },
      { model: 'M3', count: 1234 }
    ]
  },
  {
    manufacturer: 'Mercedes-Benz',
    models: [
      { model: 'C-Class', count: 4567 },
      { model: 'E-Class', count: 3456 },
      { model: 'GLC', count: 2987 },
      { model: 'GLE', count: 2345 },
      { model: 'S-Class', count: 1876 }
    ]
  },
  {
    manufacturer: 'Dodge',
    models: [
      { model: 'Charger', count: 5678 },
      { model: 'Challenger', count: 4567 },
      { model: 'Durango', count: 3456 },
      { model: 'Ram 1500', count: 12345 }
    ]
  },
  {
    manufacturer: 'Jeep',
    models: [
      { model: 'Wrangler', count: 9876 },
      { model: 'Grand Cherokee', count: 8765 },
      { model: 'Cherokee', count: 6543 },
      { model: 'Gladiator', count: 4321 },
      { model: 'Compass', count: 3210 }
    ]
  },
  {
    manufacturer: 'Nissan',
    models: [
      { model: 'Altima', count: 9876 },
      { model: 'Rogue', count: 11234 },
      { model: 'Sentra', count: 7654 },
      { model: 'Pathfinder', count: 5432 },
      { model: 'Frontier', count: 4321 }
    ]
  }
];

/**
 * VEHICLE RESULT DATA
 * Used for results tables (expandable and non-expandable)
 *
 * Matches: GET /api/search/vehicle-details
 * Based on actual autos-unified Elasticsearch structure
 */
export interface VehicleResult {
  vehicle_id: string;
  manufacturer: string;
  model: string;
  year: number;
  body_class: string;
  data_source: string;
  instance_count: number;  // Added by backend from autos-vins aggregation
}

export const DEMO_VEHICLE_RESULTS: VehicleResult[] = [
  // Ford F-150 variants
  { vehicle_id: 'v1', manufacturer: 'Ford', model: 'F-150', year: 2023, body_class: 'Pickup', data_source: 'NHTSA', instance_count: 5234 },
  { vehicle_id: 'v2', manufacturer: 'Ford', model: 'F-150', year: 2022, body_class: 'Pickup', data_source: 'NHTSA', instance_count: 8765 },
  { vehicle_id: 'v3', manufacturer: 'Ford', model: 'F-150', year: 2021, body_class: 'Pickup', data_source: 'NHTSA', instance_count: 12456 },
  { vehicle_id: 'v4', manufacturer: 'Ford', model: 'F-150', year: 2020, body_class: 'Pickup', data_source: 'NHTSA', instance_count: 9876 },

  // Ford Mustang variants
  { vehicle_id: 'v5', manufacturer: 'Ford', model: 'Mustang', year: 2023, body_class: 'Coupe', data_source: 'NHTSA', instance_count: 2345 },
  { vehicle_id: 'v6', manufacturer: 'Ford', model: 'Mustang', year: 2022, body_class: 'Coupe', data_source: 'NHTSA', instance_count: 3456 },
  { vehicle_id: 'v7', manufacturer: 'Ford', model: 'Mustang', year: 2021, body_class: 'Coupe', data_source: 'NHTSA', instance_count: 4567 },

  // Chevrolet Corvette variants
  { vehicle_id: 'v8', manufacturer: 'Chevrolet', model: 'Corvette', year: 2023, body_class: 'Coupe', data_source: 'NHTSA', instance_count: 1234 },
  { vehicle_id: 'v9', manufacturer: 'Chevrolet', model: 'Corvette', year: 2022, body_class: 'Coupe', data_source: 'NHTSA', instance_count: 1876 },
  { vehicle_id: 'v10', manufacturer: 'Chevrolet', model: 'Corvette', year: 2021, body_class: 'Coupe', data_source: 'NHTSA', instance_count: 2345 },
  { vehicle_id: 'v11', manufacturer: 'Chevrolet', model: 'Corvette', year: 2020, body_class: 'Coupe', data_source: 'NHTSA', instance_count: 1987 },

  // Chevrolet Silverado variants
  { vehicle_id: 'v12', manufacturer: 'Chevrolet', model: 'Silverado', year: 2023, body_class: 'Pickup', data_source: 'NHTSA', instance_count: 6543 },
  { vehicle_id: 'v13', manufacturer: 'Chevrolet', model: 'Silverado', year: 2022, body_class: 'Pickup', data_source: 'NHTSA', instance_count: 9876 },
  { vehicle_id: 'v14', manufacturer: 'Chevrolet', model: 'Silverado', year: 2021, body_class: 'Pickup', data_source: 'NHTSA', instance_count: 11234 },

  // Toyota Camry variants
  { vehicle_id: 'v15', manufacturer: 'Toyota', model: 'Camry', year: 2023, body_class: 'Sedan', data_source: 'NHTSA', instance_count: 3456 },
  { vehicle_id: 'v16', manufacturer: 'Toyota', model: 'Camry', year: 2022, body_class: 'Sedan', data_source: 'NHTSA', instance_count: 4567 },
  { vehicle_id: 'v17', manufacturer: 'Toyota', model: 'Camry', year: 2021, body_class: 'Sedan', data_source: 'NHTSA', instance_count: 5678 },
  { vehicle_id: 'v18', manufacturer: 'Toyota', model: 'Camry', year: 2020, body_class: 'Sedan', data_source: 'NHTSA', instance_count: 4321 },

  // Honda Civic variants
  { vehicle_id: 'v19', manufacturer: 'Honda', model: 'Civic', year: 2023, body_class: 'Sedan', data_source: 'NHTSA', instance_count: 3876 },
  { vehicle_id: 'v20', manufacturer: 'Honda', model: 'Civic', year: 2022, body_class: 'Sedan', data_source: 'NHTSA', instance_count: 5234 },
  { vehicle_id: 'v21', manufacturer: 'Honda', model: 'Civic', year: 2021, body_class: 'Sedan', data_source: 'NHTSA', instance_count: 6543 },

  // Tesla Model 3 variants
  { vehicle_id: 'v22', manufacturer: 'Tesla', model: 'Model 3', year: 2023, body_class: 'Sedan', data_source: 'NHTSA', instance_count: 2987 },
  { vehicle_id: 'v23', manufacturer: 'Tesla', model: 'Model 3', year: 2022, body_class: 'Sedan', data_source: 'NHTSA', instance_count: 3456 },
  { vehicle_id: 'v24', manufacturer: 'Tesla', model: 'Model 3', year: 2021, body_class: 'Sedan', data_source: 'NHTSA', instance_count: 2345 },

  // BMW 3 Series variants
  { vehicle_id: 'v25', manufacturer: 'BMW', model: '3 Series', year: 2023, body_class: 'Sedan', data_source: 'NHTSA', instance_count: 1456 },
  { vehicle_id: 'v26', manufacturer: 'BMW', model: '3 Series', year: 2022, body_class: 'Sedan', data_source: 'NHTSA', instance_count: 1987 },
  { vehicle_id: 'v27', manufacturer: 'BMW', model: '3 Series', year: 2021, body_class: 'Sedan', data_source: 'NHTSA', instance_count: 2123 },

  // Jeep Wrangler variants
  { vehicle_id: 'v28', manufacturer: 'Jeep', model: 'Wrangler', year: 2023, body_class: 'SUV', data_source: 'NHTSA', instance_count: 2876 },
  { vehicle_id: 'v29', manufacturer: 'Jeep', model: 'Wrangler', year: 2022, body_class: 'SUV', data_source: 'NHTSA', instance_count: 3456 },
  { vehicle_id: 'v30', manufacturer: 'Jeep', model: 'Wrangler', year: 2021, body_class: 'SUV', data_source: 'NHTSA', instance_count: 4123 },

  // Edge cases
  { vehicle_id: 'v31', manufacturer: 'Obscure Brand', model: 'Rare Model', year: 1995, body_class: 'Sedan', data_source: 'Manual', instance_count: 3 },
  { vehicle_id: 'v32', manufacturer: 'Tesla', model: 'Model S', year: 2023, body_class: 'Sedan', data_source: 'NHTSA', instance_count: 1876 },
  { vehicle_id: 'v33', manufacturer: 'Ford', model: 'Explorer', year: 2023, body_class: 'SUV', data_source: 'NHTSA', instance_count: 3210 },
  { vehicle_id: 'v34', manufacturer: 'Mercedes-Benz', model: 'C-Class', year: 2023, body_class: 'Sedan', data_source: 'NHTSA', instance_count: 1654 },
  { vehicle_id: 'v35', manufacturer: 'Nissan', model: 'Altima', year: 2023, body_class: 'Sedan', data_source: 'NHTSA', instance_count: 2987 }
];

/**
 * VIN INSTANCE DATA
 * Used for expandable sub-tables
 *
 * Matches: GET /api/search/vehicle-instances/:vehicleId
 * Based on actual autos-vins Elasticsearch structure
 */
export interface VinInstance {
  vin: string;
  manufacturer: string;
  model: string;
  year: number;
  body_class: string;
  vehicle_id: string;
  condition_rating: number;           // 1-5 rating
  condition_description: string;      // "Project", "Fair", "Good", "Very Good", "Excellent"
  mileage: number;
  mileage_verified: boolean;
  registered_state: string;           // Two-letter state code
  registration_status: string;        // "Active", "Historic", etc.
  title_status: string;               // "Clean", "Salvage", etc.
  exterior_color: string;
  factory_options: string[];
  estimated_value: number;
  matching_numbers: boolean;
  last_service_date: string;          // ISO date string
}

export const DEMO_VIN_INSTANCES: Record<string, VinInstance[]> = {
  v1: [
    { vin: '1FTFW1E84MFA12345', manufacturer: 'Ford', model: 'F-150', year: 2023, body_class: 'Pickup', vehicle_id: 'v1', condition_rating: 5, condition_description: 'Excellent', mileage: 12500, mileage_verified: true, registered_state: 'CA', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Blue Metallic', factory_options: ['FX4 Off-Road Package', 'Trailer Tow Package'], estimated_value: 45000, matching_numbers: true, last_service_date: '2025-10-15' },
    { vin: '1FTFW1E84MFA12346', manufacturer: 'Ford', model: 'F-150', year: 2023, body_class: 'Pickup', vehicle_id: 'v1', condition_rating: 4, condition_description: 'Very Good', mileage: 18200, mileage_verified: true, registered_state: 'TX', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Red', factory_options: ['Sport Package'], estimated_value: 42000, matching_numbers: true, last_service_date: '2025-09-20' },
    { vin: '1FTFW1E84MFA12347', manufacturer: 'Ford', model: 'F-150', year: 2023, body_class: 'Pickup', vehicle_id: 'v1', condition_rating: 5, condition_description: 'Excellent', mileage: 8900, mileage_verified: true, registered_state: 'FL', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Oxford White', factory_options: ['Lariat Luxury Package', 'Moonroof'], estimated_value: 47500, matching_numbers: true, last_service_date: '2025-11-01' },
    { vin: '1FTFW1E84MFA12348', manufacturer: 'Ford', model: 'F-150', year: 2023, body_class: 'Pickup', vehicle_id: 'v1', condition_rating: 4, condition_description: 'Very Good', mileage: 15000, mileage_verified: true, registered_state: 'NY', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Black', factory_options: ['XLT Chrome Package'], estimated_value: 44000, matching_numbers: true, last_service_date: '2025-08-12' },
    { vin: '1FTFW1E84MFA12349', manufacturer: 'Ford', model: 'F-150', year: 2023, body_class: 'Pickup', vehicle_id: 'v1', condition_rating: 3, condition_description: 'Good', mileage: 20100, mileage_verified: true, registered_state: 'IL', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Silver', factory_options: [], estimated_value: 43500, matching_numbers: true, last_service_date: '2025-07-05' }
  ],
  v2: [
    { vin: '1FTFW1E84MFA22345', manufacturer: 'Ford', model: 'F-150', year: 2022, body_class: 'Pickup', vehicle_id: 'v2', condition_rating: 4, condition_description: 'Very Good', mileage: 22500, mileage_verified: true, registered_state: 'CA', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Carbonized Gray', factory_options: ['FX4 Package'], estimated_value: 42000, matching_numbers: true, last_service_date: '2025-06-10' },
    { vin: '1FTFW1E84MFA22346', manufacturer: 'Ford', model: 'F-150', year: 2022, body_class: 'Pickup', vehicle_id: 'v2', condition_rating: 3, condition_description: 'Good', mileage: 28200, mileage_verified: true, registered_state: 'TX', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Velocity Blue', factory_options: ['Sport Appearance Package'], estimated_value: 40000, matching_numbers: true, last_service_date: '2025-05-22' },
    { vin: '1FTFW1E84MFA22347', manufacturer: 'Ford', model: 'F-150', year: 2022, body_class: 'Pickup', vehicle_id: 'v2', condition_rating: 5, condition_description: 'Excellent', mileage: 18900, mileage_verified: true, registered_state: 'FL', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Rapid Red', factory_options: ['Lariat Ultimate Package', 'Tow Technology Package'], estimated_value: 43500, matching_numbers: true, last_service_date: '2025-10-01' },
    { vin: '1FTFW1E84MFA22348', manufacturer: 'Ford', model: 'F-150', year: 2022, body_class: 'Pickup', vehicle_id: 'v2', condition_rating: 4, condition_description: 'Very Good', mileage: 25000, mileage_verified: true, registered_state: 'OH', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Oxford White', factory_options: ['Chrome Package'], estimated_value: 41000, matching_numbers: true, last_service_date: '2025-04-18' },
    { vin: '1FTFW1E84MFA22349', manufacturer: 'Ford', model: 'F-150', year: 2022, body_class: 'Pickup', vehicle_id: 'v2', condition_rating: 3, condition_description: 'Good', mileage: 30100, mileage_verified: false, registered_state: 'WA', registration_status: 'Active', title_status: 'Rebuilt', exterior_color: 'Agate Black', factory_options: [], estimated_value: 40500, matching_numbers: false, last_service_date: '2025-03-12' }
  ],
  v8: [
    { vin: '1G1YY22G735100001', manufacturer: 'Chevrolet', model: 'Corvette', year: 2023, body_class: 'Coupe', vehicle_id: 'v8', condition_rating: 5, condition_description: 'Excellent', mileage: 3500, mileage_verified: true, registered_state: 'CA', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Torch Red', factory_options: ['Z51 Performance Package', 'Front Lift', 'GT2 Bucket Seats'], estimated_value: 75000, matching_numbers: true, last_service_date: '2025-10-20' },
    { vin: '1G1YY22G735100002', manufacturer: 'Chevrolet', model: 'Corvette', year: 2023, body_class: 'Coupe', vehicle_id: 'v8', condition_rating: 4, condition_description: 'Very Good', mileage: 5200, mileage_verified: true, registered_state: 'TX', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Elkhart Lake Blue', factory_options: ['Magnetic Ride Control', 'Performance Exhaust'], estimated_value: 73000, matching_numbers: true, last_service_date: '2025-09-15' },
    { vin: '1G1YY22G735100003', manufacturer: 'Chevrolet', model: 'Corvette', year: 2023, body_class: 'Coupe', vehicle_id: 'v8', condition_rating: 5, condition_description: 'Excellent', mileage: 2900, mileage_verified: true, registered_state: 'FL', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Accelerate Yellow', factory_options: ['Z51 Package', 'Carbon Flash Painted Roof'], estimated_value: 76500, matching_numbers: true, last_service_date: '2025-11-05' },
    { vin: '1G1YY22G735100004', manufacturer: 'Chevrolet', model: 'Corvette', year: 2023, body_class: 'Coupe', vehicle_id: 'v8', condition_rating: 5, condition_description: 'Excellent', mileage: 4000, mileage_verified: true, registered_state: 'NV', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Black', factory_options: ['Z51 Package', 'Front Lift', 'Carbon Fiber Interior'], estimated_value: 74000, matching_numbers: true, last_service_date: '2025-08-28' },
    { vin: '1G1YY22G735100005', manufacturer: 'Chevrolet', model: 'Corvette', year: 2023, body_class: 'Coupe', vehicle_id: 'v8', condition_rating: 4, condition_description: 'Very Good', mileage: 6100, mileage_verified: true, registered_state: 'AZ', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Arctic White', factory_options: ['Magnetic Ride Control'], estimated_value: 72500, matching_numbers: true, last_service_date: '2025-07-14' }
  ],
  v15: [
    { vin: '4T1B11HK3KU123456', manufacturer: 'Toyota', model: 'Camry', year: 2023, body_class: 'Sedan', vehicle_id: 'v15', condition_rating: 5, condition_description: 'Excellent', mileage: 15000, mileage_verified: true, registered_state: 'CA', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Celestial Silver', factory_options: ['Premium Audio', 'Navigation'], estimated_value: 28000, matching_numbers: true, last_service_date: '2025-10-05' },
    { vin: '4T1B11HK3KU123457', manufacturer: 'Toyota', model: 'Camry', year: 2023, body_class: 'Sedan', vehicle_id: 'v15', condition_rating: 4, condition_description: 'Very Good', mileage: 18500, mileage_verified: true, registered_state: 'TX', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Wind Chill Pearl', factory_options: ['Sunroof'], estimated_value: 27000, matching_numbers: true, last_service_date: '2025-09-12' },
    { vin: '4T1B11HK3KU123458', manufacturer: 'Toyota', model: 'Camry', year: 2023, body_class: 'Sedan', vehicle_id: 'v15', condition_rating: 5, condition_description: 'Excellent', mileage: 12000, mileage_verified: true, registered_state: 'FL', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Midnight Black', factory_options: ['Premium Package', 'Adaptive Cruise'], estimated_value: 28500, matching_numbers: true, last_service_date: '2025-11-02' },
    { vin: '4T1B11HK3KU123459', manufacturer: 'Toyota', model: 'Camry', year: 2023, body_class: 'Sedan', vehicle_id: 'v15', condition_rating: 3, condition_description: 'Good', mileage: 22000, mileage_verified: true, registered_state: 'NY', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Blue Streak', factory_options: [], estimated_value: 26500, matching_numbers: true, last_service_date: '2025-06-20' },
    { vin: '4T1B11HK3KU123460', manufacturer: 'Toyota', model: 'Camry', year: 2023, body_class: 'Sedan', vehicle_id: 'v15', condition_rating: 4, condition_description: 'Very Good', mileage: 16000, mileage_verified: true, registered_state: 'WA', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Ruby Flare Pearl', factory_options: ['Sunroof', 'Premium Audio'], estimated_value: 27500, matching_numbers: true, last_service_date: '2025-08-08' }
  ],
  v22: [
    { vin: '5YJ3E1EA1KF123456', manufacturer: 'Tesla', model: 'Model 3', year: 2023, body_class: 'Sedan', vehicle_id: 'v22', condition_rating: 5, condition_description: 'Excellent', mileage: 18000, mileage_verified: true, registered_state: 'CA', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Midnight Silver', factory_options: ['Full Self-Driving', 'Premium Interior'], estimated_value: 42000, matching_numbers: true, last_service_date: '2025-10-10' },
    { vin: '5YJ3E1EA1KF123457', manufacturer: 'Tesla', model: 'Model 3', year: 2023, body_class: 'Sedan', vehicle_id: 'v22', condition_rating: 4, condition_description: 'Very Good', mileage: 22000, mileage_verified: true, registered_state: 'TX', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Pearl White', factory_options: ['Enhanced Autopilot'], estimated_value: 41000, matching_numbers: true, last_service_date: '2025-09-05' },
    { vin: '5YJ3E1EA1KF123458', manufacturer: 'Tesla', model: 'Model 3', year: 2023, body_class: 'Sedan', vehicle_id: 'v22', condition_rating: 5, condition_description: 'Excellent', mileage: 15000, mileage_verified: true, registered_state: 'FL', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Deep Blue', factory_options: ['Full Self-Driving', 'Premium Audio'], estimated_value: 43000, matching_numbers: true, last_service_date: '2025-11-01' },
    { vin: '5YJ3E1EA1KF123459', manufacturer: 'Tesla', model: 'Model 3', year: 2023, body_class: 'Sedan', vehicle_id: 'v22', condition_rating: 3, condition_description: 'Good', mileage: 25000, mileage_verified: true, registered_state: 'WA', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Red Multi-Coat', factory_options: [], estimated_value: 40500, matching_numbers: true, last_service_date: '2025-07-15' },
    { vin: '5YJ3E1EA1KF123460', manufacturer: 'Tesla', model: 'Model 3', year: 2023, body_class: 'Sedan', vehicle_id: 'v22', condition_rating: 4, condition_description: 'Very Good', mileage: 20000, mileage_verified: true, registered_state: 'CA', registration_status: 'Active', title_status: 'Clean', exterior_color: 'Solid Black', factory_options: ['Enhanced Autopilot', 'Premium Interior'], estimated_value: 41500, matching_numbers: true, last_service_date: '2025-08-22' }
  ],
  // Edge case: vehicle with only 1 VIN
  v31: [
    { vin: 'RARE1234567890123', manufacturer: 'Obscure Brand', model: 'Rare Model', year: 1995, body_class: 'Sedan', vehicle_id: 'v31', condition_rating: 2, condition_description: 'Fair', mileage: 125000, mileage_verified: false, registered_state: 'MT', registration_status: 'Historic', title_status: 'Salvage', exterior_color: 'Gold', factory_options: [], estimated_value: 15000, matching_numbers: false, last_service_date: '2020-03-15' }
  ]
};

/**
 * HELPER: Get total count of manufacturers
 */
export function getTotalManufacturerCount(): number {
  return DEMO_MANUFACTURERS.length;
}

/**
 * HELPER: Get total count of models across all manufacturers
 */
export function getTotalModelCount(): number {
  return DEMO_MANUFACTURERS.reduce((total, mfr) => total + mfr.models.length, 0);
}

/**
 * HELPER: Get total count of vehicle results
 */
export function getTotalVehicleCount(): number {
  return DEMO_VEHICLE_RESULTS.length;
}

/**
 * EDGE CASE DATA
 * For testing component robustness
 */
export const DEMO_EDGE_CASES = {
  emptyManufacturer: {
    manufacturer: 'No Models Brand',
    models: []
  },
  longStrings: {
    vehicle_id: 'v999',
    manufacturer: 'Super Incredibly Long Manufacturer Name That Might Break Layout',
    model: 'Extraordinarily Long Model Name With Many Words',
    year: 2023,
    body_class: 'Ultra-Luxury-Performance-Hybrid-Electric-Vehicle',
    data_source: 'Custom Source',
    instance_count: 1
  }
};
