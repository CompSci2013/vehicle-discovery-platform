/*
  DEMO API SERVICE

  PURPOSE:
  Simulates backend API behavior for BaseTableComponent development.
  Provides realistic delays, filtering, sorting, and pagination WITHOUT
  needing a live backend server.

  FEATURES:
  - Network delay simulation (200-500ms)
  - Client-side filtering (manufacturer, model, year range, body class)
  - Client-side sorting (any column, asc/desc)
  - Pagination with total count
  - Matches real API response structure exactly

  USAGE:
  Use during BaseTableComponent development, then swap for real ApiService
  by changing dependency injection in module/component.
*/

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

import {
  DEMO_MANUFACTURERS,
  DEMO_VEHICLE_RESULTS,
  DEMO_VIN_INSTANCES,
  Manufacturer,
  VehicleResult,
  VinInstance
} from './demo-data';

/**
 * QUERY PARAMETERS FOR VEHICLE SEARCH
 * Matches real API query params from PROJECT-OVERVIEW.md
 */
export interface VehicleSearchParams {
  models?: string;              // "Ford:F-150,Chevrolet:Corvette"
  page?: number;                // 1-indexed
  size?: number;                // Results per page
  manufacturer?: string;        // Filter by manufacturer
  model?: string;              // Filter by model
  yearMin?: number;            // Minimum year
  yearMax?: number;            // Maximum year
  bodyClass?: string;          // Filter by body class
  dataSource?: string;         // Filter by data source
  sortBy?: string;             // Column to sort by
  sortOrder?: 'asc' | 'desc';  // Sort direction
}

/**
 * API RESPONSE FOR VEHICLE DETAILS
 * Matches real API response structure
 */
export interface VehicleDetailsResponse {
  results: VehicleResult[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}

/**
 * API RESPONSE FOR VEHICLE INSTANCES
 * Matches real API response structure
 */
export interface VehicleInstancesResponse {
  vehicle_id: string;
  instances: VinInstance[];
}

@Injectable({
  providedIn: 'root'
})
export class DemoApiService {
  /**
   * NETWORK DELAY (milliseconds)
   * Simulates real API latency for realistic testing
   */
  private readonly NETWORK_DELAY = 300;

  constructor() {
    console.log('[DemoApiService] Initialized (using mock data)');
  }

  /**
   * GET MANUFACTURER-MODEL COUNTS
   *
   * Simulates: GET /api/search/manufacturer-model-counts
   *
   * Returns all manufacturers with their models and counts.
   * Used by picker table to populate selection options.
   *
   * @returns Observable<Manufacturer[]>
   */
  getManufacturerModelCounts(): Observable<Manufacturer[]> {
    console.log('[DemoApiService] Fetching manufacturer-model counts...');

    // Return copy to prevent accidental mutation
    const data = JSON.parse(JSON.stringify(DEMO_MANUFACTURERS));

    return of(data).pipe(
      delay(this.NETWORK_DELAY)
    );
  }

  /**
   * GET VEHICLE DETAILS
   *
   * Simulates: GET /api/search/vehicle-details
   *
   * Searches vehicle records with filtering, sorting, and pagination.
   * This is the main search endpoint used by results tables.
   *
   * FILTERING:
   * - models: "Ford:F-150,Chevrolet:Corvette" (required)
   * - manufacturer, model, yearMin, yearMax, bodyClass, dataSource (optional)
   *
   * SORTING:
   * - sortBy: Column name to sort by
   * - sortOrder: 'asc' or 'desc'
   *
   * PAGINATION:
   * - page: 1-indexed page number
   * - size: Results per page
   *
   * @param params - Query parameters
   * @returns Observable<VehicleDetailsResponse>
   */
  getVehicleDetails(params: VehicleSearchParams): Observable<VehicleDetailsResponse> {
    console.log('[DemoApiService] Fetching vehicle details with params:', params);

    // Start with all results
    let results = [...DEMO_VEHICLE_RESULTS];

    // ========== FILTERING ==========

    // Filter by models parameter (required)
    if (params.models) {
      const modelCombos = this.parseModelsParam(params.models);
      results = results.filter(vehicle => {
        return modelCombos.some(combo =>
          vehicle.manufacturer === combo.manufacturer &&
          vehicle.model === combo.model
        );
      });
    }

    // Filter by manufacturer
    if (params.manufacturer) {
      results = results.filter(v => v.manufacturer === params.manufacturer);
    }

    // Filter by model
    if (params.model) {
      results = results.filter(v => v.model === params.model);
    }

    // Filter by year range
    if (params.yearMin !== undefined) {
      results = results.filter(v => v.year >= params.yearMin!);
    }
    if (params.yearMax !== undefined) {
      results = results.filter(v => v.year <= params.yearMax!);
    }

    // Filter by body class
    if (params.bodyClass) {
      results = results.filter(v => v.body_class === params.bodyClass);
    }

    // Filter by data source
    if (params.dataSource) {
      results = results.filter(v => v.data_source === params.dataSource);
    }

    // ========== SORTING ==========

    if (params.sortBy) {
      const sortKey = params.sortBy as keyof VehicleResult;
      const sortOrder = params.sortOrder || 'asc';

      results.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];

        // Handle null/undefined
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        // Compare based on type
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          const comparison = aVal.localeCompare(bVal);
          return sortOrder === 'asc' ? comparison : -comparison;
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          const comparison = aVal - bVal;
          return sortOrder === 'asc' ? comparison : -comparison;
        }

        return 0;
      });
    }

    // ========== PAGINATION ==========

    const total = results.length;
    const page = params.page || 1;
    const size = params.size || 20;
    const totalPages = Math.ceil(total / size);

    // Calculate slice indices
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;

    // Get page of results
    const pageResults = results.slice(startIndex, endIndex);

    // PHASE 6: Add VIN instances to each vehicle for expandable row demo
    // This enriches the data so expandable sub-tables can display VIN details
    const enrichedResults = pageResults.map(vehicle => {
      const vinInstances = DEMO_VIN_INSTANCES[vehicle.vehicle_id] || [];
      return {
        ...vehicle,
        vin_instances: vinInstances.slice(0, 5) // Limit to 5 VINs for demo
      };
    });

    console.log(`[DemoApiService] Returning ${enrichedResults.length} of ${total} results (page ${page}/${totalPages})`);

    // Build response
    const response: VehicleDetailsResponse = {
      results: enrichedResults as any, // Cast needed since we added vin_instances property dynamically
      total: total,
      page: page,
      size: size,
      totalPages: totalPages
    };

    return of(response).pipe(
      delay(this.NETWORK_DELAY)
    );
  }

  /**
   * GET VEHICLE INSTANCES (VINs)
   *
   * Simulates: GET /api/search/vehicle-instances/:vehicleId
   *
   * Returns VIN instances for a specific vehicle.
   * Used by expandable rows to show detailed VIN data.
   *
   * @param vehicleId - Vehicle identifier
   * @param count - Number of VINs to return (default: 5, max: 100)
   * @returns Observable<VehicleInstancesResponse>
   */
  getVehicleInstances(vehicleId: string, count: number = 5): Observable<VehicleInstancesResponse> {
    console.log(`[DemoApiService] Fetching VIN instances for vehicle ${vehicleId} (count: ${count})`);

    // Get instances for this vehicle
    const instances = DEMO_VIN_INSTANCES[vehicleId] || [];

    // Limit to requested count
    const limitedInstances = instances.slice(0, Math.min(count, 100));

    console.log(`[DemoApiService] Returning ${limitedInstances.length} VIN instances`);

    const response: VehicleInstancesResponse = {
      vehicle_id: vehicleId,
      instances: limitedInstances
    };

    return of(response).pipe(
      delay(this.NETWORK_DELAY)
    );
  }

  /**
   * PARSE MODELS PARAMETER
   *
   * Converts models query parameter to array of combinations.
   *
   * INPUT: "Ford:F-150,Chevrolet:Corvette,Toyota:Camry"
   * OUTPUT: [
   *   { manufacturer: "Ford", model: "F-150" },
   *   { manufacturer: "Chevrolet", model: "Corvette" },
   *   { manufacturer: "Toyota", model: "Camry" }
   * ]
   *
   * @param modelsParam - Comma-separated "Manufacturer:Model" pairs
   * @returns Array of manufacturer-model combinations
   */
  private parseModelsParam(modelsParam: string): Array<{ manufacturer: string; model: string }> {
    if (!modelsParam || modelsParam.trim() === '') {
      return [];
    }

    return modelsParam.split(',').map(combo => {
      const [manufacturer, model] = combo.split(':');
      return { manufacturer: manufacturer.trim(), model: model.trim() };
    });
  }

  /**
   * GET UNIQUE MANUFACTURERS
   *
   * Helper method to get list of unique manufacturers from results.
   * Useful for building filter dropdowns.
   *
   * @returns Observable<string[]>
   */
  getUniqueManufacturers(): Observable<string[]> {
    const manufacturers = [...new Set(DEMO_VEHICLE_RESULTS.map(v => v.manufacturer))];
    return of(manufacturers.sort()).pipe(delay(100));
  }

  /**
   * GET UNIQUE BODY CLASSES
   *
   * Helper method to get list of unique body classes from results.
   * Useful for building filter dropdowns.
   *
   * @returns Observable<string[]>
   */
  getUniqueBodyClasses(): Observable<string[]> {
    const bodyClasses = [...new Set(DEMO_VEHICLE_RESULTS.map(v => v.body_class))];
    return of(bodyClasses.sort()).pipe(delay(100));
  }

  /**
   * GET YEAR RANGE
   *
   * Helper method to get min/max years from dataset.
   * Useful for building year range filters.
   *
   * @returns Observable<{ min: number; max: number }>
   */
  getYearRange(): Observable<{ min: number; max: number }> {
    const years = DEMO_VEHICLE_RESULTS.map(v => v.year);
    const min = Math.min(...years);
    const max = Math.max(...years);
    return of({ min, max }).pipe(delay(100));
  }
}
