/*
  GENERIC API SERVICE

  PURPOSE:
  This service provides a generic, configuration-driven HTTP client for backend APIs.
  It does NOT know about specific data types (vehicles, products, etc.) - those are
  defined in configuration objects at runtime.

  BACKEND API BASE URL:
  - Development: http://localhost:3000 (configured in environment.ts)
  - Production: /api (proxied through nginx, configured in environment.prod.ts)

  WHY GENERIC:
  1. Single service works for ANY domain (vehicles, products, users, etc.)
  2. No hardcoded endpoints or data types
  3. Configuration-driven via ApiConfig objects
  4. Easy to extend for new domains without modifying this service
  5. Type safety maintained through TypeScript generics

  ARCHITECTURE PATTERN:
  Components pass an ApiConfig object to methods, which defines the endpoints
  and data transformations. This allows the same service to handle multiple
  different backend APIs without any code changes.

  USAGE EXAMPLE:
  // Define configuration
  const config: ApiConfig = {
    id: 'vehicles',
    endpoints: {
      search: { url: '/search/vehicle-details', method: 'GET' }
    }
  };

  // Use service
  this.apiService.request<VehicleFilters, VehicleResponse>(
    config,
    'search',
    { page: 1, size: 20 }
  ).subscribe(data => ...);
*/

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Import configuration interfaces
import { ApiConfig, ApiEndpointConfig } from './api-config.interface';

// Import environment configuration
import { environment } from '../../../environments/environment';

/**
 * GENERIC API SERVICE CLASS
 *
 * Injectable service that provides configuration-driven HTTP communication.
 * Uses TypeScript generics to maintain type safety without hardcoding types.
 *
 * DEPENDENCY INJECTION:
 * Angular automatically injects HttpClient when this service is created.
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
   * GENERIC REQUEST METHOD
   *
   * Makes an HTTP request based on the provided configuration.
   * This is the primary method for making API calls.
   *
   * @param config - API configuration object
   * @param endpointId - Which endpoint to call (from config.endpoints)
   * @param requestData - Optional request data/filters
   * @returns Observable<TResponse> - The response data
   *
   * @example
   * ```typescript
   * this.apiService.request<VehicleFilters, VehicleResponse>(
   *   VEHICLE_API_CONFIG,
   *   'search',
   *   { page: 1, size: 20, manufacturer: 'Ford' }
   * ).subscribe(response => {
   *   console.log(response.results);
   * });
   * ```
   */
  request<TRequest = any, TResponse = any>(
    config: ApiConfig,
    endpointId: string,
    requestData?: TRequest
  ): Observable<TResponse> {
    // Get the specific endpoint configuration
    const endpoint = config.endpoints[endpointId];

    if (!endpoint) {
      const error = `Endpoint '${endpointId}' not found in API config '${config.id}'`;
      console.error(error);
      return throwError(() => new Error(error));
    }

    // Build the full URL
    const url = this.buildUrl(config, endpoint);

    // Determine HTTP method (default to GET)
    const method = endpoint.method || 'GET';

    // Build headers
    const headers = this.buildHeaders(config, endpoint);

    // Transform request data if transformer is provided
    const transformedRequest = endpoint.transformRequest
      ? endpoint.transformRequest(requestData!)
      : requestData;

    // Make the HTTP request based on method
    let request$: Observable<any>;

    switch (method) {
      case 'GET':
        const params = this.buildHttpParams(endpoint, transformedRequest);
        request$ = this.http.get(url, { params, headers });
        break;

      case 'POST':
        request$ = this.http.post(url, transformedRequest, { headers });
        break;

      case 'PUT':
        request$ = this.http.put(url, transformedRequest, { headers });
        break;

      case 'PATCH':
        request$ = this.http.patch(url, transformedRequest, { headers });
        break;

      case 'DELETE':
        request$ = this.http.delete(url, { headers });
        break;

      default:
        return throwError(() => new Error(`Unsupported HTTP method: ${method}`));
    }

    // Apply response transformation and error handling
    return request$.pipe(
      // Transform response if transformer is provided
      map(response => {
        if (endpoint.transformResponse) {
          return endpoint.transformResponse(response);
        }
        return response as TResponse;
      }),

      // Error handling
      catchError(error => {
        console.error(
          `[ApiService] Request failed: ${config.id}.${endpointId}`,
          error
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * GET REQUEST SHORTHAND
   *
   * Convenience method for GET requests.
   *
   * @param config - API configuration object
   * @param endpointId - Which endpoint to call
   * @param params - Optional query parameters
   * @returns Observable<TResponse>
   */
  get<TRequest = any, TResponse = any>(
    config: ApiConfig,
    endpointId: string,
    params?: TRequest
  ): Observable<TResponse> {
    return this.request<TRequest, TResponse>(config, endpointId, params);
  }

  /**
   * POST REQUEST SHORTHAND
   *
   * Convenience method for POST requests.
   *
   * @param config - API configuration object
   * @param endpointId - Which endpoint to call
   * @param body - Request body data
   * @returns Observable<TResponse>
   */
  post<TRequest = any, TResponse = any>(
    config: ApiConfig,
    endpointId: string,
    body: TRequest
  ): Observable<TResponse> {
    return this.request<TRequest, TResponse>(config, endpointId, body);
  }

  /**
   * PUT REQUEST SHORTHAND
   *
   * Convenience method for PUT requests.
   *
   * @param config - API configuration object
   * @param endpointId - Which endpoint to call
   * @param body - Request body data
   * @returns Observable<TResponse>
   */
  put<TRequest = any, TResponse = any>(
    config: ApiConfig,
    endpointId: string,
    body: TRequest
  ): Observable<TResponse> {
    return this.request<TRequest, TResponse>(config, endpointId, body);
  }

  /**
   * PATCH REQUEST SHORTHAND
   *
   * Convenience method for PATCH requests.
   *
   * @param config - API configuration object
   * @param endpointId - Which endpoint to call
   * @param body - Request body data
   * @returns Observable<TResponse>
   */
  patch<TRequest = any, TResponse = any>(
    config: ApiConfig,
    endpointId: string,
    body: TRequest
  ): Observable<TResponse> {
    return this.request<TRequest, TResponse>(config, endpointId, body);
  }

  /**
   * DELETE REQUEST SHORTHAND
   *
   * Convenience method for DELETE requests.
   *
   * @param config - API configuration object
   * @param endpointId - Which endpoint to call
   * @returns Observable<void>
   */
  delete(
    config: ApiConfig,
    endpointId: string
  ): Observable<void> {
    return this.request<any, void>(config, endpointId);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * BUILD FULL URL
   *
   * Constructs the complete URL for an endpoint.
   * Combines: apiUrl + basePath + endpoint.url
   *
   * @param config - API configuration
   * @param endpoint - Endpoint configuration
   * @returns Complete URL string
   */
  private buildUrl(config: ApiConfig, endpoint: ApiEndpointConfig): string {
    let url = this.apiUrl;

    // Add base path if specified in config
    if (config.basePath) {
      url = `${url}${config.basePath}`;
    }

    // Add endpoint-specific path
    url = `${url}${endpoint.url}`;

    return url;
  }

  /**
   * BUILD HTTP HEADERS
   *
   * Constructs HTTP headers from configuration.
   *
   * @param config - API configuration
   * @param endpoint - Endpoint configuration (for future use)
   * @returns HttpHeaders object
   */
  private buildHeaders(
    config: ApiConfig,
    endpoint: ApiEndpointConfig
  ): HttpHeaders {
    let headers = new HttpHeaders();

    // Add default headers from config
    if (config.defaultHeaders) {
      Object.keys(config.defaultHeaders).forEach(key => {
        headers = headers.set(key, config.defaultHeaders![key]);
      });
    }

    // Future: Add endpoint-specific headers if needed

    return headers;
  }

  /**
   * BUILD HTTP PARAMS
   *
   * Converts request data to HttpParams for GET requests.
   * Uses custom builder if provided, otherwise uses default conversion.
   *
   * @param endpoint - Endpoint configuration
   * @param requestData - The request data to convert
   * @returns HttpParams object
   */
  private buildHttpParams(
    endpoint: ApiEndpointConfig,
    requestData?: any
  ): HttpParams {
    // Use custom param builder if provided
    if (endpoint.buildParams) {
      return endpoint.buildParams(requestData);
    }

    // Default: convert object to HttpParams
    return this.objectToHttpParams(requestData);
  }

  /**
   * OBJECT TO HTTP PARAMS
   *
   * Converts a plain object to HttpParams.
   * Handles nested objects, arrays, and primitive values.
   *
   * @param obj - Object to convert
   * @returns HttpParams object
   */
  private objectToHttpParams(obj?: any): HttpParams {
    let params = new HttpParams();

    if (!obj) {
      return params;
    }

    Object.keys(obj).forEach(key => {
      const value = obj[key];

      // Skip undefined and null values
      if (value === undefined || value === null) {
        return;
      }

      // Handle arrays (convert to comma-separated string)
      if (Array.isArray(value)) {
        params = params.set(key, value.join(','));
      }
      // Handle objects (convert to JSON string)
      else if (typeof value === 'object') {
        params = params.set(key, JSON.stringify(value));
      }
      // Handle primitives
      else {
        params = params.set(key, String(value));
      }
    });

    return params;
  }
}
