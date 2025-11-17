/*
  VEHICLE API CONFIGURATION

  PURPOSE:
  Configuration for all vehicle-related API endpoints.
  This configuration is passed to the generic ApiService at runtime.

  USAGE:
  import { VEHICLE_API_CONFIG } from './config/api/vehicle-api.config';

  this.apiService.get<VehicleSearchFilters, VehicleSearchResponse>(
    VEHICLE_API_CONFIG,
    'search',
    { page: 1, size: 20 }
  ).subscribe(response => ...);
*/

import { HttpParams } from '@angular/common/http';
import { ApiConfig } from '../../core/services/api-config.interface';
import {
  VehicleSearchFilters,
  VehicleSearchResponse,
  ManufacturerModelCountsResponse,
  Manufacturer,
  VinInstancesResponse,
  VinInstance
} from './vehicle-api.types';

/**
 * VEHICLE API CONFIGURATION
 *
 * Complete configuration for all vehicle-related API endpoints.
 * The generic ApiService uses this configuration to make HTTP calls
 * without knowing anything about vehicles.
 */
export const VEHICLE_API_CONFIG: ApiConfig = {
  id: 'vehicles',
  basePath: '/search', // All vehicle endpoints are under /search

  endpoints: {
    /**
     * MANUFACTURER-MODEL COUNTS ENDPOINT
     *
     * Fetches the complete list of manufacturers and their models with counts.
     * Used to populate picker components.
     *
     * Endpoint: GET /api/search/manufacturer-model-counts
     */
    manufacturerModelCounts: {
      id: 'manufacturerModelCounts',
      url: '/manufacturer-model-counts',
      method: 'GET',

      // Transform response: extract and sort manufacturers
      transformResponse: (response: ManufacturerModelCountsResponse): Manufacturer[] => {
        const manufacturers = response.manufacturers;

        // Sort manufacturers alphabetically
        const sortedManufacturers = manufacturers.sort((a, b) =>
          a.manufacturer.localeCompare(b.manufacturer)
        );

        // Sort each manufacturer's models alphabetically
        return sortedManufacturers.map(m => ({
          ...m,
          models: m.models.sort((a, b) => a.model.localeCompare(b.model))
        }));
      }
    },

    /**
     * VEHICLE SEARCH ENDPOINT
     *
     * Searches for vehicles based on filters.
     * Returns paginated results with metadata.
     *
     * Endpoint: GET /api/search/vehicle-details
     */
    search: {
      id: 'search',
      url: '/vehicle-details',
      method: 'GET',

      // Build HTTP params from filters
      buildParams: (filters: VehicleSearchFilters): HttpParams => {
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

        return params;
      }
    },

    /**
     * VIN INSTANCES ENDPOINT
     *
     * Fetches generated VIN instances for a specific vehicle.
     * VINs are generated on-demand, not stored in database.
     *
     * Endpoint: GET /api/search/vehicle-instances/:vehicleId
     *
     * NOTE: This endpoint requires building the URL with the vehicleId.
     * You'll need to use a custom method or pass the vehicleId in the request.
     */
    vinInstances: {
      id: 'vinInstances',
      url: '/vehicle-instances', // Base URL, vehicleId will be appended
      method: 'GET',

      // Build params for VIN instances request
      buildParams: (request: { vehicleId: string; count?: number }): HttpParams => {
        let params = new HttpParams();
        if (request.count) {
          params = params.set('count', request.count.toString());
        }
        return params;
      },

      // Transform response: extract instances array
      transformResponse: (response: VinInstancesResponse): VinInstance[] => {
        return response.instances;
      }
    }
  }
};

/**
 * HELPER FUNCTION: Get VIN Instances URL
 *
 * Since the VIN instances endpoint requires a dynamic vehicleId in the URL path,
 * we provide a helper to construct the proper endpoint configuration.
 *
 * @param vehicleId - The vehicle ID to fetch instances for
 * @returns Modified endpoint config with vehicleId in URL
 *
 * @example
 * const endpoint = getVinInstancesEndpoint('abc123');
 * // endpoint.url = '/vehicle-instances/abc123'
 */
export function getVinInstancesEndpointConfig(vehicleId: string) {
  return {
    ...VEHICLE_API_CONFIG.endpoints.vinInstances,
    url: `/vehicle-instances/${vehicleId}`
  };
}

/**
 * VEHICLE API CONFIG WITH DYNAMIC VIN ENDPOINT
 *
 * Helper function to get a vehicle API config with a specific vehicleId
 * for the VIN instances endpoint.
 *
 * @param vehicleId - The vehicle ID
 * @returns Modified API config
 */
export function getVehicleApiConfigForVinInstances(vehicleId: string): ApiConfig {
  return {
    ...VEHICLE_API_CONFIG,
    endpoints: {
      ...VEHICLE_API_CONFIG.endpoints,
      vinInstances: getVinInstancesEndpointConfig(vehicleId)
    }
  };
}
