/*
  VEHICLE API TYPES

  PURPOSE:
  Domain-specific types for the vehicle API.
  These types define the structure of requests and responses for vehicle endpoints.

  NOTE:
  These types are NOT imported by the generic ApiService.
  They are only used by components and configurations that work with vehicle data.
*/

import { BaseFilters, PaginatedResponse } from '../../core/services/api-config.interface';

/**
 * VEHICLE SEARCH FILTERS INTERFACE
 *
 * Defines all possible filters that can be applied to vehicle search.
 * These correspond to URL query parameters and backend API parameters.
 */
export interface VehicleSearchFilters extends BaseFilters {
  /**
   * SELECTED MODEL COMBINATIONS
   * Comma-separated manufacturer:model pairs
   * Example: "Ford:F-150,Chevrolet:Corvette"
   */
  models?: string;

  /**
   * MANUFACTURER FILTER
   * Filter results to specific manufacturer
   * Example: "Ford"
   */
  manufacturer?: string;

  /**
   * MODEL FILTER
   * Filter results to specific model
   * Example: "F-150"
   */
  model?: string;

  /**
   * YEAR RANGE - MINIMUM
   * Minimum year to include in results
   * Example: 2015
   */
  yearMin?: number;

  /**
   * YEAR RANGE - MAXIMUM
   * Maximum year to include in results
   * Example: 2024
   */
  yearMax?: number;

  /**
   * BODY CLASS FILTER
   * Filter by vehicle body style
   * Examples: "Pickup", "Sedan", "SUV", "Coupe"
   */
  bodyClass?: string;

  /**
   * DATA SOURCE FILTER
   * Filter by original data source
   * Example: "NHTSA"
   */
  dataSource?: string;
}

/**
 * VEHICLE RESULT INTERFACE
 *
 * Represents a single vehicle record from search results.
 */
export interface VehicleResult {
  /**
   * UNIQUE VEHICLE ID
   * Hash-based identifier for this manufacturer-model-year combination
   */
  vehicle_id: string;

  /**
   * MANUFACTURER NAME
   */
  manufacturer: string;

  /**
   * MODEL NAME
   */
  model: string;

  /**
   * YEAR
   */
  year: number;

  /**
   * BODY CLASS
   * Vehicle body style/type
   */
  body_class: string;

  /**
   * DATA SOURCE
   * Original source of this data
   */
  data_source: string;

  /**
   * COMPOSITE KEY
   * Pre-formatted string combining manufacturer|model|year
   * Used for grouping and deduplication
   */
  make_model_year: string;

  /**
   * INSTANCE COUNT
   * How many VIN instances exist for this combination
   * Loaded on-demand from separate index
   */
  instance_count?: number;
}

/**
 * VEHICLE SEARCH RESPONSE INTERFACE
 *
 * The complete response from the vehicle search API endpoint.
 */
export interface VehicleSearchResponse extends PaginatedResponse<VehicleResult> {}

/**
 * MODEL INTERFACE
 *
 * Represents a vehicle model with its count
 */
export interface Model {
  model: string;
  count: number;
}

/**
 * MANUFACTURER INTERFACE
 *
 * Represents a manufacturer with its models
 */
export interface Manufacturer {
  manufacturer: string;
  count: number;
  models: Model[];
}

/**
 * MANUFACTURER-MODEL COUNTS RESPONSE
 *
 * Response from the manufacturer-model combinations endpoint
 * (Real API response format with pagination)
 *
 * NOTE: The real API returns "data" instead of "results"
 */
export interface ManufacturerModelCountsResponse {
  /**
   * MANUFACTURER DATA
   * Array of manufacturers with their models
   */
  data: Manufacturer[];

  /**
   * TOTAL COUNT
   * Total number of manufacturers
   */
  total: number;

  /**
   * CURRENT PAGE
   * The page number returned (1-indexed)
   */
  page: number;

  /**
   * PAGE SIZE
   * Number of items per page
   */
  size: number;

  /**
   * TOTAL PAGES
   * Total number of pages available
   */
  totalPages: number;
}

/**
 * VIN INSTANCE INTERFACE
 *
 * Represents a single generated VIN instance.
 */
export interface VinInstance {
  /**
   * VEHICLE IDENTIFICATION NUMBER
   * 17-character unique identifier
   */
  vin: string;

  /**
   * MANUFACTURER
   */
  manufacturer: string;

  /**
   * MODEL
   */
  model: string;

  /**
   * YEAR
   */
  year: number;

  /**
   * STATE OF REGISTRATION
   * US state code (2 letters)
   */
  state: string;

  /**
   * VEHICLE COLOR
   */
  color: string;

  /**
   * ESTIMATED VALUE
   * In USD
   */
  value: number;
}

/**
 * VIN INSTANCES RESPONSE INTERFACE
 *
 * Response from the VIN instances endpoint.
 */
export interface VinInstancesResponse {
  /**
   * VEHICLE ID
   * The ID this request was for
   */
  vehicle_id: string;

  /**
   * GENERATED INSTANCES
   * Array of VIN instances
   */
  instances: VinInstance[];
}
