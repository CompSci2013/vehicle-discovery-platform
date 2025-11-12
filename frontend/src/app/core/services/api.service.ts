/*
  API SERVICE

  PURPOSE:
  This service handles all HTTP communication with the backend API.
  It provides methods for fetching manufacturer-model data and vehicle search results.

  BACKEND API BASE URL:
  - Development: http://localhost:3000 (configured in environment.ts)
  - Production: /api (proxied through nginx, configured in environment.prod.ts)

  WHY CENTRALIZED API SERVICE:
  1. Single source of truth for API URLs
  2. Consistent error handling across all API calls
  3. Easy to add authentication/authorization headers later
  4. Simplifies testing (mock this service instead of HTTP client)
  5. Type safety with interfaces for request/response

  ARCHITECTURE PATTERN:
  This follows Angular's recommended "Service Layer" pattern where components
  never make HTTP calls directly. Instead, they inject this service and call
  its methods.
*/

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Import data models
import {
  ManufacturerModelCountsResponse,
  Manufacturer
} from '../../models/manufacturer-model.model';

// Import environment configuration
import { environment } from '../../../environments/environment';

/**
 * VEHICLE SEARCH FILTERS INTERFACE
 *
 * Defines all possible filters that can be applied to vehicle search.
 * These correspond to URL query parameters and backend API parameters.
 *
 * All fields are optional because users might not apply any filters.
 */
export interface VehicleSearchFilters {
  /**
   * SELECTED MODEL COMBINATIONS
   * Comma-separated manufacturer:model pairs
   * Example: "Ford:F-150,Chevrolet:Corvette"
   */
  models?: string;

  /**
   * PAGE NUMBER
   * 1-indexed page number for pagination
   * Default: 1
   */
  page?: number;

  /**
   * PAGE SIZE
   * Number of results per page
   * Options: 10, 20, 50, 100
   * Default: 20
   */
  size?: number;

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

  /**
   * SORT COLUMN
   * Which column to sort by
   * Examples: "year", "manufacturer", "model", "body_class"
   */
  sortBy?: string;

  /**
   * SORT ORDER
   * Ascending or descending sort
   * Values: "asc" or "desc"
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * VEHICLE RESULT INTERFACE
 *
 * Represents a single vehicle record from search results.
 * This is what the backend returns for each matching vehicle.
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
 * Includes both the results and pagination metadata.
 */
export interface VehicleSearchResponse {
  /**
   * SEARCH RESULTS
   * Array of matching vehicle records
   */
  results: VehicleResult[];

  /**
   * TOTAL COUNT
   * Total number of results (across all pages)
   */
  total: number;

  /**
   * CURRENT PAGE
   * The page number returned (1-indexed)
   */
  page: number;

  /**
   * PAGE SIZE
   * Number of results per page
   */
  size: number;

  /**
   * TOTAL PAGES
   * Total number of pages available
   * Calculated as: Math.ceil(total / size)
   */
  totalPages: number;
}

/**
 * VIN INSTANCE INTERFACE
 *
 * Represents a single generated VIN instance.
 * VINs are generated on-demand, not stored in the database.
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
   * Example: "CA", "TX", "FL"
   */
  state: string;

  /**
   * VEHICLE COLOR
   * Generated based on year (vintage vs modern palettes)
   */
  color: string;

  /**
   * ESTIMATED VALUE
   * Calculated from condition, mileage, and options
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

/**
 * API SERVICE CLASS
 *
 * Injectable service that provides methods for all backend API calls.
 * Uses HttpClient for HTTP communication.
 *
 * DEPENDENCY INJECTION:
 * Angular automatically injects HttpClient when this service is created.
 * HttpClient must be imported in app.module.ts via HttpClientModule.
 */
@Injectable({
  providedIn: 'root' // Singleton service available application-wide
})
export class ApiService {
  /**
   * API BASE URL
   * Loaded from environment configuration
   * - Dev: http://localhost:3000
   * - Prod: /api (relative URL, proxied by nginx)
   */
  private readonly apiUrl = environment.apiUrl;

  /**
   * CONSTRUCTOR
   *
   * Angular injects HttpClient dependency automatically.
   *
   * @param http - Angular's HTTP client for making requests
   */
  constructor(private http: HttpClient) {}

  /**
   * GET MANUFACTURER-MODEL COUNTS
   *
   * Fetches the complete list of manufacturers and their models with counts.
   * This data populates the picker component.
   *
   * ENDPOINT: GET /api/search/manufacturer-model-counts
   *
   * @returns Observable<Manufacturer[]> - Array of manufacturers with their models
   *
   * USAGE EXAMPLE:
   * this.apiService.getManufacturerModelCounts()
   *   .pipe(takeUntil(this.destroy$))
   *   .subscribe(manufacturers => {
   *     this.manufacturers = manufacturers;
   *   });
   *
   * ERROR HANDLING:
   * - Network errors are caught and logged
   * - Empty array is returned on error (graceful degradation)
   */
  getManufacturerModelCounts(): Observable<Manufacturer[]> {
    const url = `${this.apiUrl}/search/manufacturer-model-counts`;

    return this.http.get<ManufacturerModelCountsResponse>(url).pipe(
      // Extract manufacturers array from response
      map(response => response.manufacturers),

      // Sort alphabetically by manufacturer name
      map(manufacturers =>
        manufacturers.sort((a, b) => a.manufacturer.localeCompare(b.manufacturer))
      ),

      // Sort each manufacturer's models alphabetically
      map(manufacturers =>
        manufacturers.map(m => ({
          ...m,
          models: m.models.sort((a, b) => a.model.localeCompare(b.model))
        }))
      ),

      // Error handling
      catchError(error => {
        console.error('Error fetching manufacturer-model counts:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * SEARCH VEHICLES
   *
   * Searches for vehicles based on filters.
   * Returns paginated results with metadata.
   *
   * ENDPOINT: GET /api/search/vehicle-details
   *
   * @param filters - Search filters and pagination parameters
   * @returns Observable<VehicleSearchResponse> - Search results with pagination
   *
   * USAGE EXAMPLE:
   * const filters: VehicleSearchFilters = {
   *   models: 'Ford:F-150,Chevrolet:Corvette',
   *   page: 1,
   *   size: 20,
   *   yearMin: 2015,
   *   sortBy: 'year',
   *   sortOrder: 'desc'
   * };
   *
   * this.apiService.searchVehicles(filters)
   *   .pipe(takeUntil(this.destroy$))
   *   .subscribe(response => {
   *     this.vehicles = response.results;
   *     this.totalCount = response.total;
   *   });
   *
   * ERROR HANDLING:
   * - Network errors are caught and logged
   * - Error is re-thrown for component to handle
   */
  searchVehicles(filters: VehicleSearchFilters): Observable<VehicleSearchResponse> {
    const url = `${this.apiUrl}/search/vehicle-details`;

    // Build HTTP query parameters from filters
    let params = new HttpParams();

    // Add each filter if it has a value
    if (filters.models) params = params.set('models', filters.models);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.size) params = params.set('size', filters.size.toString());
    if (filters.manufacturer) params = params.set('manufacturer', filters.manufacturer);
    if (filters.model) params = params.set('model', filters.model);
    if (filters.yearMin) params = params.set('yearMin', filters.yearMin.toString());
    if (filters.yearMax) params = params.set('yearMax', filters.yearMax.toString());
    if (filters.bodyClass) params = params.set('bodyClass', filters.bodyClass);
    if (filters.dataSource) params = params.set('dataSource', filters.dataSource);
    if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);

    return this.http.get<VehicleSearchResponse>(url, { params }).pipe(
      // Error handling
      catchError(error => {
        console.error('Error searching vehicles:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * GET VIN INSTANCES
   *
   * Fetches generated VIN instances for a specific vehicle.
   * VINs are generated on-demand, not stored in database.
   *
   * ENDPOINT: GET /api/search/vehicle-instances/:vehicleId
   *
   * @param vehicleId - The vehicle_id to get instances for
   * @param count - How many instances to generate (default: 5, max: 100)
   * @returns Observable<VinInstance[]> - Array of generated VIN instances
   *
   * USAGE EXAMPLE:
   * this.apiService.getVinInstances('abc123', 10)
   *   .pipe(takeUntil(this.destroy$))
   *   .subscribe(instances => {
   *     this.vinInstances = instances;
   *   });
   *
   * ERROR HANDLING:
   * - Network errors are caught and logged
   * - Empty array is returned on error
   */
  getVinInstances(vehicleId: string, count: number = 5): Observable<VinInstance[]> {
    const url = `${this.apiUrl}/search/vehicle-instances/${vehicleId}`;

    let params = new HttpParams();
    if (count) params = params.set('count', count.toString());

    return this.http.get<VinInstancesResponse>(url, { params }).pipe(
      // Extract instances array from response
      map(response => response.instances),

      // Error handling
      catchError(error => {
        console.error(`Error fetching VIN instances for vehicle ${vehicleId}:`, error);
        return throwError(() => error);
      })
    );
  }
}
