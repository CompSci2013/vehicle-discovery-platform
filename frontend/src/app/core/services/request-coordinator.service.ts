/*
  REQUEST COORDINATOR SERVICE

  PURPOSE:
  Deduplicates API requests by caching requests based on URL and parameters.
  When multiple components request the same data simultaneously, only one HTTP
  request is sent to the backend. All subscribers receive the same response.

  WHY NEEDED:
  1. Performance: Avoid duplicate HTTP requests for identical data
  2. Consistency: All subscribers get identical responses
  3. Network: Reduce load on backend during rapid user interactions
  4. User Experience: Faster response times via deduplication

  ARCHITECTURE:
  Uses a Map to store pending requests indexed by a hash of URL + params.
  When a request completes, it's removed from the cache. Stale requests
  are automatically cleaned up after a timeout.

  EXAMPLE:
  // First call - makes HTTP request
  coordinator.get('/api/data', {page: 1, size: 20})
    .subscribe(data => console.log('Got:', data));

  // Second call with same params - gets cached Observable
  // No new HTTP request made!
  coordinator.get('/api/data', {page: 1, size: 20})
    .subscribe(data => console.log('Got:', data));
*/

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { shareReplay, catchError, finalize } from 'rxjs/operators';

/**
 * Cache entry storing pending request Observable
 */
interface CacheEntry<T> {
  observable: Observable<T>;
  timestamp: number;
}

/**
 * REQUEST COORDINATOR SERVICE
 *
 * Coordinates HTTP requests to eliminate duplicates when multiple
 * components request identical data.
 */
@Injectable({
  providedIn: 'root'
})
export class RequestCoordinatorService {
  // Cache of pending requests indexed by URL + params hash
  private requestCache = new Map<string, CacheEntry<any>>();

  // How long to keep cached responses in memory (ms)
  // After this time, stale cached responses are discarded
  private readonly CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient) {}

  /**
   * GET REQUEST WITH DEDUPLICATION
   *
   * Makes an HTTP GET request, but deduplicates identical concurrent requests.
   * If another component is already requesting the same URL/params, returns
   * the same Observable instead of making a duplicate HTTP request.
   *
   * @param url - The API endpoint URL
   * @param params - Query parameters (automatically serialized for caching)
   * @returns Observable<T> - Cached or new HTTP request observable
   *
   * @example
   * // All three calls result in only ONE HTTP request
   * coordinator.get('/api/users', {page: 1}).subscribe(...);
   * coordinator.get('/api/users', {page: 1}).subscribe(...);
   * coordinator.get('/api/users', {page: 1}).subscribe(...);
   */
  get<T>(url: string, params?: any): Observable<T> {
    const cacheKey = this.generateCacheKey(url, params);

    console.log('[RequestCoordinator] GET request:', { url, params, cacheKey });

    // Check if we have a cached request in progress
    const cachedEntry = this.requestCache.get(cacheKey);
    if (cachedEntry) {
      // Check if cached response is still fresh
      if (Date.now() - cachedEntry.timestamp < this.CACHE_TIMEOUT) {
        console.log('[RequestCoordinator] Using fresh cached response:', cacheKey);
        return cachedEntry.observable;
      }
      // Cached entry is stale, remove it
      this.requestCache.delete(cacheKey);
      console.log('[RequestCoordinator] Cached entry stale, removing:', cacheKey);
    }

    // Make new HTTP request
    console.log('[RequestCoordinator] Making new HTTP request:', cacheKey);

    // Build query string from params
    let queryUrl = url;
    if (params && Object.keys(params).length > 0) {
      const queryString = this.buildQueryString(params);
      queryUrl = `${url}?${queryString}`;
    }

    // Create observable with:
    // - shareReplay(1) = multicast to all subscribers + cache last value
    // - catchError = error handling
    // - finalize = cleanup after complete
    const request$ = this.http.get<T>(queryUrl).pipe(
      // shareReplay(1) makes this Observable:
      // 1. Multicast: All subscribers share ONE HTTP request
      // 2. Cached: New subscribers get cached response instantly
      shareReplay(1),

      // Clean up cache entry when request completes or errors
      finalize(() => {
        console.log('[RequestCoordinator] Removing cached request:', cacheKey);
        this.requestCache.delete(cacheKey);
      }),

      // Error handling with detailed logging
      catchError((error) => {
        console.error('[RequestCoordinator] Request failed:', { cacheKey, error });
        return throwError(() => error);
      })
    );

    // Store this request in cache so subsequent calls find it
    this.requestCache.set(cacheKey, {
      observable: request$,
      timestamp: Date.now()
    });

    console.log('[RequestCoordinator] Cached request, key:', cacheKey);

    return request$;
  }

  /**
   * CLEAR CACHE
   *
   * Manually clear all cached requests.
   * Use this when you want to force fresh data.
   *
   * @example
   * // User clicks "Refresh" button
   * this.coordinator.clearCache();
   * this.loadData(); // Will make fresh HTTP request
   */
  clearCache(): void {
    console.log('[RequestCoordinator] Clearing cache, count:', this.requestCache.size);
    this.requestCache.clear();
  }

  /**
   * CLEAR CACHE BY KEY PATTERN
   *
   * Remove cached entries matching a URL pattern.
   * Useful when you want to invalidate related requests.
   *
   * @param urlPattern - URL pattern to match (e.g., '/api/users')
   *
   * @example
   * // After user updates profile, invalidate all profile-related caches
   * this.coordinator.clearCacheByPattern('/api/users/profile');
   */
  clearCacheByPattern(urlPattern: string): void {
    let count = 0;
    for (const key of this.requestCache.keys()) {
      if (key.includes(urlPattern)) {
        this.requestCache.delete(key);
        count++;
      }
    }
    console.log('[RequestCoordinator] Cleared', count, 'entries matching:', urlPattern);
  }

  /**
   * GENERATE CACHE KEY
   *
   * Creates a unique key by combining URL and params.
   * This key is used to identify identical requests.
   *
   * @param url - API endpoint URL
   * @param params - Query parameters object
   * @returns Unique cache key string
   *
   * ALGORITHM:
   * 1. Sort params object by key (for consistency)
   * 2. Convert to JSON string
   * 3. Combine with URL
   * 4. Create hash for size efficiency
   */
  private generateCacheKey(url: string, params?: any): string {
    // If no params, key is just the URL
    if (!params || Object.keys(params).length === 0) {
      return url;
    }

    // Sort params by key for consistent cache hits
    // This ensures {a: 1, b: 2} and {b: 2, a: 1} generate same key
    const sortedParams = this.sortObjectKeys(params);
    const paramString = JSON.stringify(sortedParams);

    // Combine URL with serialized params
    const cacheKey = `${url}::${paramString}`;

    return cacheKey;
  }

  /**
   * BUILD QUERY STRING
   *
   * Converts params object to URL query string format.
   *
   * @param params - Parameters object
   * @returns Query string (without leading ?)
   *
   * @example
   * Input: { page: 1, sort: 'asc' }
   * Output: 'page=1&sort=asc'
   */
  private buildQueryString(params: any): string {
    const queryParts: string[] = [];

    // Flatten nested objects for API compatibility
    const flatParams = this.flattenParams(params);

    Object.entries(flatParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    });

    return queryParts.join('&');
  }

  /**
   * FLATTEN PARAMETERS
   *
   * Converts nested objects to flat key-value pairs for URL encoding.
   *
   * @param obj - Object to flatten
   * @param prefix - Prefix for nested keys
   * @returns Flattened object
   *
   * @example
   * Input: { filters: { name: 'John', age: 30 }, page: 1 }
   * Output: { 'filters.name': 'John', 'filters.age': 30, 'page': 1 }
   */
  private flattenParams(
    obj: any,
    prefix: string = ''
  ): Record<string, any> {
    const result: Record<string, any> = {};

    Object.entries(obj).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value !== null && value !== undefined) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          // Recursively flatten nested objects
          Object.assign(result, this.flattenParams(value, newKey));
        } else if (Array.isArray(value)) {
          // Arrays: convert to comma-separated string
          result[newKey] = value.join(',');
        } else {
          result[newKey] = value;
        }
      }
    });

    return result;
  }

  /**
   * SORT OBJECT KEYS
   *
   * Recursively sorts object keys alphabetically.
   * Used to ensure consistent cache keys regardless of param order.
   *
   * @param obj - Object to sort
   * @returns New object with sorted keys
   *
   * @example
   * Input: { z: 1, a: 2, m: 3 }
   * Output: { a: 2, m: 3, z: 1 }
   */
  private sortObjectKeys(obj: any): any {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      return obj;
    }

    const sorted: any = {};
    Object.keys(obj)
      .sort()
      .forEach((key) => {
        sorted[key] = this.sortObjectKeys(obj[key]);
      });

    return sorted;
  }

  /**
   * CACHE STATS (DEBUG)
   *
   * Returns current cache statistics for debugging.
   *
   * @returns Object with cache metrics
   *
   * @example
   * console.log(coordinator.getCacheStats());
   * // { size: 3, oldestEntry: 1234567890 }
   */
  getCacheStats(): {
    size: number;
    keys: string[];
    oldestEntry?: number;
  } {
    const stats = {
      size: this.requestCache.size,
      keys: Array.from(this.requestCache.keys()),
      oldestEntry: undefined as number | undefined
    };

    if (this.requestCache.size > 0) {
      const timestamps = Array.from(this.requestCache.values()).map(
        (entry) => entry.timestamp
      );
      stats.oldestEntry = Math.min(...timestamps);
    }

    return stats;
  }
}
