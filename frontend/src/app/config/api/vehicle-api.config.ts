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
  Model,
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
  basePath: '/v1', // All vehicle endpoints are under /v1 (autos backend)

  endpoints: {
    /**
     * MANUFACTURER-MODEL COUNTS ENDPOINT
     *
     * Fetches the complete list of manufacturers and their models with counts.
     * Used to populate picker components.
     *
     * Endpoint: GET /api/v1/manufacturer-model-combinations
     */
    manufacturerModelCounts: {
      id: 'manufacturerModelCounts',
      url: '/manufacturer-model-combinations',
      method: 'GET',

      // Transform response: extract and sort manufacturers
      transformResponse: (response: ManufacturerModelCountsResponse): Manufacturer[] => {
        const manufacturers = response.data;

        // Sort manufacturers alphabetically
        const sortedManufacturers = manufacturers.sort((a: Manufacturer, b: Manufacturer) =>
          a.manufacturer.localeCompare(b.manufacturer)
        );

        // Sort each manufacturer's models alphabetically
        return sortedManufacturers.map((m: Manufacturer) => ({
          ...m,
          models: m.models.sort((a: Model, b: Model) => a.model.localeCompare(b.model))
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
     * Fetches real VIN instances from Elasticsearch.
     * Filters by manufacturer and model.
     *
     * Endpoint: GET /api/v1/vins
     */
    vinInstances: {
      id: 'vinInstances',
      url: '/vins',
      method: 'GET',

      // Build params for VIN instances request
      buildParams: (request: { manufacturer?: string; model?: string; limit?: number; page?: number }): HttpParams => {
        let params = new HttpParams();
        if (request.manufacturer) params = params.set('manufacturer', request.manufacturer);
        if (request.model) params = params.set('model', request.model);
        if (request.limit) params = params.set('limit', request.limit.toString());
        if (request.page) params = params.set('page', request.page.toString());
        return params;
      },

      // Transform response: extract instances array
      transformResponse: (response: any): any[] => {
        return response.instances || [];
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
    ...VEHICLE_API_CONFIG.endpoints['vinInstances'],
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
