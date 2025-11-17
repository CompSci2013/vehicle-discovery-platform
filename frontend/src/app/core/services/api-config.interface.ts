/*
  API CONFIGURATION INTERFACES

  PURPOSE:
  Defines the structure for configuring the generic ApiService at runtime.
  No service should hardcode endpoints, table names, or data types.
  All of this is driven by configuration objects passed to components.

  USAGE:
  Configuration objects are defined in src/app/config/ directory and
  referenced by configuration ID at runtime.
*/

import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';

/**
 * API ENDPOINT CONFIGURATION
 *
 * Defines a single API endpoint with its URL, method, and how to
 * build request parameters.
 */
export interface ApiEndpointConfig<TRequest = any, TResponse = any> {
  /**
   * ENDPOINT ID
   * Unique identifier for this endpoint within a configuration
   * Example: 'list', 'details', 'counts', 'search'
   */
  id: string;

  /**
   * ENDPOINT URL
   * Relative to the API base URL from environment
   * Example: '/search/vehicle-details', '/api/products', '/users'
   */
  url: string;

  /**
   * HTTP METHOD
   * Default: 'GET'
   */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

  /**
   * PARAMETER BUILDER
   * Optional function to transform request filters into HTTP parameters
   * If not provided, the request object is used as-is
   *
   * @param request - The request filters/parameters
   * @returns HttpParams object ready for the HTTP call
   */
  buildParams?: (request: TRequest) => HttpParams;

  /**
   * REQUEST TRANSFORMER
   * Optional function to transform the request before sending
   * Useful for converting between frontend and backend data formats
   *
   * @param request - The original request object
   * @returns Transformed request object
   */
  transformRequest?: (request: TRequest) => any;

  /**
   * RESPONSE TRANSFORMER
   * Optional function to transform the response after receiving
   * Useful for normalizing backend data to frontend format
   *
   * @param response - The raw response from the backend
   * @returns Transformed response object
   */
  transformResponse?: (response: any) => TResponse;
}

/**
 * API CONFIGURATION
 *
 * Complete configuration for a domain's API endpoints.
 * Each domain (vehicles, products, users, etc.) should have its own configuration.
 */
export interface ApiConfig {
  /**
   * CONFIGURATION ID
   * Unique identifier for this API configuration
   * Example: 'vehicles', 'parts', 'suppliers', 'products'
   */
  id: string;

  /**
   * BASE PATH
   * Optional base path prepended to all endpoint URLs in this config
   * Example: '/api/vehicles', '/api/products'
   * If not specified, uses the environment apiUrl
   */
  basePath?: string;

  /**
   * ENDPOINTS
   * Map of endpoint configurations keyed by endpoint ID
   */
  endpoints: {
    [endpointId: string]: ApiEndpointConfig<any, any>;
  };

  /**
   * DEFAULT HEADERS
   * Optional headers to include with all requests in this configuration
   */
  defaultHeaders?: { [key: string]: string };

  /**
   * CACHE CONFIGURATION
   * Optional caching settings for this API
   */
  cache?: {
    enabled: boolean;
    ttl?: number; // Time to live in milliseconds
  };
}

/**
 * PAGINATED RESPONSE INTERFACE
 *
 * Generic interface for paginated API responses.
 * Most list endpoints return data in this format.
 */
export interface PaginatedResponse<T> {
  /**
   * RESULTS
   * Array of items for the current page
   */
  results: T[];

  /**
   * TOTAL COUNT
   * Total number of items across all pages
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
 * GENERIC FILTERS INTERFACE
 *
 * Base interface for filter objects.
 * Domain-specific filters should extend this.
 */
export interface BaseFilters {
  /**
   * PAGE NUMBER
   * 1-indexed page number for pagination
   */
  page?: number;

  /**
   * PAGE SIZE
   * Number of results per page
   */
  size?: number;

  /**
   * SORT COLUMN
   * Which column to sort by
   */
  sortBy?: string;

  /**
   * SORT ORDER
   * Ascending or descending sort
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * API SERVICE ADAPTER INTERFACE
 *
 * Interface that domain-specific services can implement to provide
 * additional business logic on top of the generic API service.
 */
export interface ApiServiceAdapter<TFilters extends BaseFilters, TData> {
  /**
   * GET CONFIGURATION
   * Returns the API configuration for this domain
   */
  getConfig(): ApiConfig;

  /**
   * FETCH DATA
   * Fetches data using the provided filters
   *
   * @param filters - The filters to apply
   * @param endpointId - Optional specific endpoint to use
   * @returns Observable of the paginated response
   */
  fetchData(
    filters: TFilters,
    endpointId?: string
  ): Observable<PaginatedResponse<TData>>;

  /**
   * FETCH BY ID
   * Fetches a single item by its ID
   *
   * @param id - The item identifier
   * @param endpointId - Optional specific endpoint to use
   * @returns Observable of the item
   */
  fetchById?(id: string, endpointId?: string): Observable<TData>;

  /**
   * CREATE
   * Creates a new item
   *
   * @param data - The item data
   * @param endpointId - Optional specific endpoint to use
   * @returns Observable of the created item
   */
  create?(data: Partial<TData>, endpointId?: string): Observable<TData>;

  /**
   * UPDATE
   * Updates an existing item
   *
   * @param id - The item identifier
   * @param data - The updated item data
   * @param endpointId - Optional specific endpoint to use
   * @returns Observable of the updated item
   */
  update?(
    id: string,
    data: Partial<TData>,
    endpointId?: string
  ): Observable<TData>;

  /**
   * DELETE
   * Deletes an item
   *
   * @param id - The item identifier
   * @param endpointId - Optional specific endpoint to use
   * @returns Observable of the deletion result
   */
  delete?(id: string, endpointId?: string): Observable<void>;
}
