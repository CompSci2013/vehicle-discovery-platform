# Vehicle Discovery Platform - State Management Architecture

**Document Status:** Draft - Synthesized from AUTOS-PrimeNG Reference
**Created:** 2025-11-11
**Purpose:** Complete reference for URL-driven state management patterns

---

## Table of Contents

1. [Overview](#overview)
2. [Core Principles](#core-principles)
3. [Architecture Diagrams](#architecture-diagrams)
4. [Service Layer](#service-layer)
   - [RouteStateService](#routestateservice)
   - [UrlParamService](#urlparamservice)
   - [StateManagementService](#statemanagementservice)
   - [RequestCoordinatorService](#requestcoordinatorservice)
   - [TableStatePersistenceService](#tablestatepersistenceservice)
5. [Component Patterns](#component-patterns)
6. [Storage Layers](#storage-layers)
7. [Data Flow Examples](#data-flow-examples)
8. [Service Selection Guide](#service-selection-guide)
9. [Best Practices](#best-practices)
10. [Common Patterns](#common-patterns)

---

## Overview

This application implements a **URL-as-single-source-of-truth** state management architecture. All query-related state (filters, sort, pagination) lives in the URL, making the application fully shareable, bookmarkable, and navigable via browser controls.

### Why URL-Driven State?

- ✅ **Shareable** - Copy/paste URL shares exact application state
- ✅ **Bookmarkable** - Save specific searches/views
- ✅ **Browser Navigation** - Back/forward buttons work correctly
- ✅ **Deep Linking** - Direct links to specific application states
- ✅ **Survives Refresh** - Page reload preserves state
- ✅ **No Backend State** - Stateless API, scales horizontally

---

## Core Principles

### 1. URL as Single Source of Truth

**All query-related state lives in the URL.**

```
http://192.168.0.244:4201/discover?models=Ford:F-150,Chevrolet:Corvette&page=2&sortBy=year&sortOrder=desc&yearMin=1960&yearMax=1980
```

**What goes in URL:**
- Selected manufacturer/model combinations
- Active filters (manufacturer, model, year range, body class, data source)
- Current sort column and direction
- Current page number and page size

---

### 2. Separation of Concerns (Two Storage Layers)

#### Layer 1: URL (Query State)
- **Purpose:** Store query-related state that defines WHAT data is displayed
- **Managed By:** `StateManagementService` + `RouteStateService`
- **Storage:** Browser URL query parameters
- **Characteristics:** Shareable, bookmarkable, survives refresh

#### Layer 2: localStorage (UI Preferences)
- **Purpose:** Store user preferences that control HOW data is presented
- **Managed By:** `TableStatePersistenceService`
- **Storage:** Browser localStorage
- **Characteristics:** Private, per-browser, persists across sessions

**Critical Rule:** NEVER mix these concerns. Query state in URL only, UI preferences in localStorage only.

---

### 3. Input-Based Component Hydration

**Components receive state via @Input, not direct service injection.**

```typescript
// ✅ CORRECT: Input-based hydration
@Component({...})
export class MyTableComponent {
  @Input() queryParams: TableQueryParams;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['queryParams']) {
      this.hydrate();
    }
  }
}

// ❌ WRONG: Direct service subscription
@Component({...})
export class MyTableComponent {
  constructor(private stateService: StateManagementService) {
    this.stateService.filters$.subscribe(filters => {
      this.hydrate(filters); // Tight coupling
    });
  }
}
```

**Why?**
- ✅ Predictable data flow (explicit inputs)
- ✅ Easier testing (mock inputs vs mock services)
- ✅ Reusable components (not coupled to specific services)
- ✅ Clear parent-child contracts

---

### 4. Idempotent Hydration

**Hydration must be safe to call multiple times without side effects.**

```typescript
private hydrate(): void {
  // Always clear first (idempotent)
  this.clearState();

  // Then apply new state
  this.applyState(this.queryParams);

  // Safe to call multiple times
}
```

**Why?**
- Browser back/forward navigation triggers re-hydration
- URL changes from external sources
- Component re-initialization

---

### 5. Unified Event Emission

**Emit single event with complete state, not multiple partial events.**

```typescript
// ✅ CORRECT: Single unified event
@Output() queryParamsChange = new EventEmitter<TableQueryParams>();

private updateState(): void {
  this.queryParamsChange.emit({
    page: this.page,
    size: this.size,
    sortBy: this.sortBy,
    sortOrder: this.sortOrder,
    filters: this.filters
  });
}

// ❌ WRONG: Multiple partial events
@Output() pageChange = new EventEmitter<number>();
@Output() sortChange = new EventEmitter<{sortBy: string, sortOrder: string}>();
@Output() filterChange = new EventEmitter<any>();
```

**Why?**
- ✅ Single URL update (not multiple)
- ✅ Single re-render (not multiple)
- ✅ Predictable change detection
- ✅ Easier debugging

---

## Architecture Diagrams

### Service Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER URL                              │
│  ?models=Ford:F-150&page=2&sortBy=year&sortOrder=desc      │
└──────────────────────┬──────────────────┬───────────────────┘
                       │                  │
         ┌─────────────┴────────┐        │
         │                      │        │
         ▼                      ▼        │
┌──────────────────────┐  ┌──────────────────────────────────┐
│ UrlParamService      │  │  RouteStateService               │
│ (Lightweight)        │  │  (Domain-Specific)               │
│ • Generic URL ops    │  │  • SearchFilters conversion      │
│ • Type-safe getters  │  │  • filtersToParams()             │
│ • Observable watch   │  │  • paramsToFilters()             │
│ • Highlight params   │  │  • updateParams()                │
│ • NO side effects    │  └────────────┬─────────────────────┘
└──────────────────────┘               │
         │                             ▼
         │              ┌─────────────────────────────────────┐
         │              │   StateManagementService            │
         │              │   High-level business logic         │
         │              │   • filters$: Observable<...>       │
         │              │   • updateFilters(...)              │
         │              │   • fetchVehicleData()              │
         │              └────────────┬────────────────────────┘
         │                           │
         │                           ▼
         │              ┌─────────────────────────────────────┐
         │              │  RequestCoordinatorService          │
         │              │  Deduplication, caching, retry      │
         │              │  • execute<T>(...)                  │
         │              │  • getLoadingState$(...)            │
         │              └────────────┬────────────────────────┘
         │                           │
         │                           ▼
         │              ┌─────────────────────────────────────┐
         │              │       ApiService                    │
         │              │       HTTP client wrapper           │
         │              │       • getVehicleDetails(...)      │
         │              └─────────────────────────────────────┘
         │
         └─────────────> Components (direct use for lightweight persistence)
```

**Two URL Parameter Services:**

1. **UrlParamService (Left Path)** - Generic, lightweight, no side effects
   - Use for: Simple URL persistence without state management
   - Benefits: Type-safe, Observable watching, no coupling to domain logic
   - Special: Highlight parameters (h_ prefix) for transient UI state

2. **RouteStateService (Right Path)** - Domain-specific, SearchFilters-aware
   - Use for: Full state management with API calls and business logic
   - Benefits: Automatic API triggering, request coordination, caching
   - Accessed via: StateManagementService (not used directly by components)

### Component Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Parent Component                          │
│  (e.g., WorkshopComponent, DiscoverComponent)               │
│                                                              │
│  constructor(private stateService: StateManagementService)  │
│                                                              │
│  ngOnInit() {                                               │
│    this.stateService.filters$.subscribe(filters => {       │
│      this.tableQueryParams = this.convert(filters);        │
│    });                                                      │
│  }                                                          │
│                                                              │
│  onTableQueryChange(params: TableQueryParams) {             │
│    const filters = this.convertBack(params);               │
│    this.stateService.updateFilters(filters);               │
│  }                                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ [tableQueryParams]="..."
                     │ (queryParamsChange)="..."
                     ▼
┌─────────────────────────────────────────────────────────────┐
│               Child Component (Table)                       │
│  (e.g., BaseDataTableComponent, VehicleResultsTable)        │
│                                                              │
│  @Input() queryParams: TableQueryParams;                    │
│  @Output() queryParamsChange = new EventEmitter<...>();     │
│                                                              │
│  ngOnChanges(changes: SimpleChanges) {                      │
│    if (changes['queryParams']) {                            │
│      this.hydrate();                                        │
│    }                                                        │
│  }                                                          │
│                                                              │
│  onUserInteraction() {                                      │
│    this.queryParamsChange.emit(newParams);                  │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Service Layer

### RouteStateService

**Purpose:** Low-level URL parameter management

**Responsibilities:**
- Read/write URL query parameters
- Watch for URL changes
- Navigate with updated params
- NO business logic

**Key Methods:**

```typescript
export class RouteStateService {
  /**
   * Get a single query parameter value
   */
  getQueryParam(key: string): string | null;

  /**
   * Set a single query parameter
   * Triggers navigation with updated URL
   */
  setQueryParam(key: string, value: string): void;

  /**
   * Watch for changes to a query parameter
   * Returns Observable that emits on every URL change
   */
  watchQueryParam(key: string): Observable<string | null>;

  /**
   * Remove a query parameter
   */
  removeQueryParam(key: string): void;

  /**
   * Get all query parameters as object
   */
  getAllQueryParams(): { [key: string]: string };

  /**
   * Update multiple query parameters at once
   */
  updateQueryParams(params: { [key: string]: string | null }): void;
}
```

**Usage Example:**

```typescript
// Read URL parameter
const page = this.routeState.getQueryParam('page');

// Write URL parameter
this.routeState.setQueryParam('page', '2');

// Watch for changes
this.routeState.watchQueryParam('models').subscribe((models) => {
  console.log('Models changed:', models);
});
```

---

### UrlParamService

**Purpose:** Lightweight URL parameter management without state management side effects

**Created:** After original state management docs to provide generic URL persistence

**Responsibilities:**
- Read/write URL query parameters with type-safe operations
- Watch for URL parameter changes via Observables
- Manage "highlight parameters" (h_ prefix) for transient UI state
- NO coupling to SearchFilters or domain models
- NO automatic API calls or state management side effects
- NO dependency on StateManagementService

**Key Methods:**

```typescript
export class UrlParamService {
  /**
   * Update a single parameter
   * Returns promise that resolves when navigation completes
   */
  updateParam(
    key: string,
    value: string | number | boolean | undefined,
    extras?: NavigationExtras
  ): Promise<boolean>;

  /**
   * Update multiple parameters at once
   * Returns promise that resolves when navigation completes
   */
  updateParams(
    params: Record<string, string | number | boolean | undefined>,
    extras?: NavigationExtras
  ): Promise<boolean>;

  /**
   * Get parameter value (returns null if not present)
   */
  getParam(key: string): string | null;

  /**
   * Get parameter as number with default fallback
   */
  getParamAsNumber(key: string, defaultValue: number): number;

  /**
   * Get parameter as boolean with default fallback
   */
  getParamAsBoolean(key: string, defaultValue: boolean): boolean;

  /**
   * Get parameter as string array (comma-separated)
   */
  getParamAsStringArray(key: string): string[];

  /**
   * Watch for changes to a single parameter
   * Emits on every URL change, distinctUntilChanged
   */
  watchParam(key: string): Observable<string | null>;

  /**
   * Watch for changes to multiple parameters
   * Emits object with all requested keys
   */
  watchParams(keys: string[]): Observable<Record<string, string | null>>;

  /**
   * Get all current query parameters
   */
  getAllParams(): Record<string, string>;

  /**
   * Remove a single parameter
   */
  removeParam(key: string): Promise<boolean>;

  /**
   * Clear all parameters
   */
  clearAllParams(): Promise<boolean>;

  // ========== HIGHLIGHT PARAMETERS ==========
  // Special h_ prefixed parameters for transient UI state

  /**
   * Get highlight parameter (strips h_ prefix for you)
   * Example: getHighlightParam('row') → reads h_row from URL
   */
  getHighlightParam(key: string): string | null;

  /**
   * Set highlight parameter (adds h_ prefix for you)
   * Example: setHighlightParam('row', '123') → writes h_row=123 to URL
   */
  setHighlightParam(
    key: string,
    value: string | number | boolean | undefined
  ): Promise<boolean>;

  /**
   * Get all highlight parameters as object
   * Returns: { row: '123', column: '5' } (without h_ prefixes)
   */
  getAllHighlightParams(): Record<string, string>;

  /**
   * Clear all highlight parameters at once
   * Removes all h_ prefixed parameters from URL
   */
  clearAllHighlights(): Promise<boolean>;
}
```

**Usage Examples:**

```typescript
// Example 1: Simple parameter persistence (no state management)
export class CustomFilterComponent {
  constructor(private urlParamService: UrlParamService) {}

  async onFilterChange(value: string): Promise<void> {
    // Updates URL without triggering state management
    await this.urlParamService.updateParam('customFilter', value);
  }

  loadFilter(): void {
    // Type-safe reading
    const filter = this.urlParamService.getParam('customFilter');
    const page = this.urlParamService.getParamAsNumber('page', 1);
    const enabled = this.urlParamService.getParamAsBoolean('enabled', true);
  }

  watchForChanges(): void {
    // Observable watching
    this.urlParamService.watchParam('customFilter').subscribe(value => {
      console.log('Filter changed:', value);
    });
  }
}

// Example 2: Highlight parameters for transient UI state
export class DataTableComponent {
  constructor(private urlParamService: UrlParamService) {}

  async onRowClick(rowId: string): Promise<void> {
    // Highlight row in URL (shareable, but temporary)
    await this.urlParamService.setHighlightParam('row', rowId);
    // URL: ?models=Ford:F-150&h_row=123
  }

  ngOnInit(): void {
    // Check if row should be highlighted
    const highlightedRow = this.urlParamService.getHighlightParam('row');
    if (highlightedRow) {
      this.scrollToRow(highlightedRow);
      this.highlightRow(highlightedRow);
    }
  }

  async clearHighlights(): Promise<void> {
    // Remove all h_ prefixed parameters
    await this.urlParamService.clearAllHighlights();
  }
}

// Example 3: Watching multiple parameters
export class DashboardComponent {
  constructor(private urlParamService: UrlParamService) {}

  ngOnInit(): void {
    this.urlParamService.watchParams(['view', 'layout']).subscribe(params => {
      console.log('View:', params['view']);
      console.log('Layout:', params['layout']);
    });
  }
}
```

**When to Use UrlParamService:**

✅ **Use UrlParamService when:**
- Component needs simple URL persistence
- NO state management side effects wanted (no API calls)
- Generic parameter reading/writing
- Component isn't tied to vehicle search domain
- Highlight/selection state needs URL persistence
- Need type-safe parameter operations

❌ **Don't use UrlParamService when:**
- Component participates in vehicle search workflow
- Need automatic API calls when parameters change
- Need request coordination/caching/retry logic
- State is tied to SearchFilters model
- → Use StateManagementService instead

**Highlight Parameters Pattern:**

Highlight parameters use `h_` prefix convention:
- **Purpose:** Store transient UI state (row selection, column highlights, etc.)
- **Benefit:** Shareable (can link to specific highlighted row)
- **Separate from query state:** Can be cleared without affecting filters
- **Convention:** `h_row=123`, `h_column=manufacturer`, etc.

```typescript
// URL before: ?models=Ford:F-150&page=2&sortBy=year
await this.urlParamService.setHighlightParam('row', '123');
// URL after: ?models=Ford:F-150&page=2&sortBy=year&h_row=123

await this.urlParamService.clearAllHighlights();
// URL after: ?models=Ford:F-150&page=2&sortBy=year
// ✅ Query state preserved, only highlights cleared
```

---

### StateManagementService

**Purpose:** High-level business logic and state orchestration

**Responsibilities:**
- Maintain application state (filters, results, loading, errors)
- Sync state to/from URL
- Trigger API calls via RequestCoordinatorService
- Expose observables for components to subscribe
- Parse/format URL parameters (e.g., "Ford:F-150" ↔ modelCombos)

**Key Properties:**

```typescript
export class StateManagementService {
  /**
   * Complete application state
   * Private, use specific observables below
   */
  private state$ = new BehaviorSubject<AppState>({
    filters: {},
    results: [],
    totalResults: 0,
    loading: false,
    error: null,
  });

  /**
   * Observable of current filters
   * Distinct until changed (deep comparison)
   */
  public filters$ = this.state$.pipe(
    map((state) => state.filters),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
  );

  /**
   * Observable of current results
   */
  public results$ = this.state$.pipe(map((state) => state.results));

  /**
   * Observable of loading state
   */
  public loading$ = this.state$.pipe(map((state) => state.loading));

  /**
   * Observable of error state
   */
  public error$ = this.state$.pipe(map((state) => state.error));
}
```

**Key Methods:**

```typescript
/**
 * Update filters and sync to URL
 * Triggers API call if modelCombos present
 */
updateFilters(filters: Partial<SearchFilters>): void {
  // 1. Merge with current filters
  const currentFilters = this.getCurrentFilters();
  const newFilters = { ...currentFilters, ...filters };

  // 2. Update internal state
  this.updateState({ filters: newFilters });

  // 3. Sync to URL
  this.syncStateToUrl();

  // 4. Trigger API call
  if (newFilters.modelCombos && newFilters.modelCombos.length > 0) {
    this.fetchVehicleData().subscribe();
  } else {
    this.updateState({ results: [], totalResults: 0 });
  }
}

/**
 * Fetch vehicle data from API
 * Uses RequestCoordinatorService for deduplication/caching
 */
fetchVehicleData(): Observable<VehicleDetailsResponse> {
  const filters = this.getCurrentFilters();
  const cacheKey = this.buildCacheKey('vehicle-details', filters);

  return this.requestCoordinator.execute(
    cacheKey,
    () => this.apiService.getVehicleDetails(
      this.buildModelsParam(filters.modelCombos),
      filters.page || 1,
      filters.size || 20,
      this.buildFilterParams(filters),
      filters.sort,
      filters.sortDirection
    ),
    {
      cacheTime: 30000,      // Cache for 30 seconds
      deduplication: true,   // Deduplicate identical requests
      retryAttempts: 2,      // Retry twice on failure
      retryDelay: 1000       // Start with 1s delay
    }
  );
}

/**
 * Get current filters synchronously
 */
getCurrentFilters(): SearchFilters {
  return this.state$.value.filters;
}
```

---

### RequestCoordinatorService

**Purpose:** Request deduplication, caching, and retry logic

**Responsibilities:**
- Deduplicate identical concurrent requests
- Cache responses with configurable TTL
- Retry failed requests with exponential backoff
- Provide per-request and global loading states
- Cancel requests on navigation

**Key Methods:**

```typescript
export class RequestCoordinatorService {
  /**
   * Execute a request with coordination
   */
  execute<T>(
    key: string,
    requestFn: () => Observable<T>,
    config: RequestConfig = {}
  ): Observable<T>;

  /**
   * Get loading state for specific request
   */
  getLoadingState$(key: string): Observable<RequestState>;

  /**
   * Global loading state (any request loading)
   */
  globalLoading$: Observable<number>;

  /**
   * Check if any requests are loading
   */
  isAnyLoading(): boolean;

  /**
   * Cancel all active requests
   */
  cancelAll(): void;

  /**
   * Clear cache for specific key or all
   */
  clearCache(key?: string): void;
}
```

**Configuration:**

```typescript
interface RequestConfig {
  cacheTime?: number; // Cache duration in ms (0 = no cache)
  deduplication?: boolean; // Deduplicate identical requests
  retryAttempts?: number; // Number of retry attempts
  retryDelay?: number; // Initial retry delay (exponential backoff)
}

interface RequestState {
  loading: boolean;
  error: Error | null;
  lastUpdated: number | null;
}
```

**Benefits:**
- ✅ Multiple components can call same API without duplicate requests
- ✅ Responses cached temporarily to reduce server load
- ✅ Automatic retries for transient failures
- ✅ Coordinated loading states across application
- ✅ Request cancellation on navigation

---

### TableStatePersistenceService

**Purpose:** Persist table UI preferences to localStorage

**Responsibilities:**
- Save/load column order
- Save/load column visibility
- Save/load page size preference
- Per-table storage (using tableId)
- NO query state (that belongs in URL)

**Key Methods:**

```typescript
export class TableStatePersistenceService {
  /**
   * Save table preferences to localStorage
   */
  savePreferences(tableId: string, prefs: TablePreferences): void;

  /**
   * Load table preferences from localStorage
   */
  loadPreferences(tableId: string): TablePreferences | null;

  /**
   * Reset table preferences (delete from localStorage)
   */
  resetPreferences(tableId: string): void;
}

interface TablePreferences {
  columnOrder: string[]; // Array of column keys
  visibleColumns: string[]; // Array of visible column keys
  pageSize?: number; // Preferred page size
  lastUpdated?: number; // Timestamp
}
```

**Storage Key Pattern:**
```
localStorage key: `vehicle-discovery-table-${tableId}-preferences`
```

---

## Component Patterns

### Pattern 1: Input-Based Hydration (Recommended)

**Use Case:** Dumb/presentational components, reusable tables

```typescript
@Component({
  selector: 'app-base-data-table',
  template: '...',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseDataTableComponent<T> implements OnInit, OnChanges {
  @Input() queryParams: TableQueryParams = {
    page: 1,
    size: 20,
    filters: {},
  };

  @Output() queryParamsChange = new EventEmitter<TableQueryParams>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['queryParams'] && !changes['queryParams'].firstChange) {
      this.hydrateFromQueryParams();
    }
  }

  ngOnInit(): void {
    // Initial hydration
    this.hydrateFromQueryParams();
  }

  private hydrateFromQueryParams(): void {
    if (!this.queryParams) return;

    // Always clear first (idempotent)
    this.clearAllFilters();

    // Apply new state
    if (this.queryParams.filters) {
      Object.keys(this.queryParams.filters).forEach((key) => {
        this.filters[key] = this.queryParams.filters![key];
      });
    }

    this.sortBy = this.queryParams.sortBy;
    this.sortOrder = this.queryParams.sortOrder;
    this.currentPage = this.queryParams.page || 1;
    this.pageSize = this.queryParams.size || 20;

    // Fetch data
    this.fetchData();
  }
}
```

**Parent Component:**

```typescript
@Component({
  selector: 'app-workshop',
  template: `
    <app-base-data-table
      [queryParams]="tableQueryParams$ | async"
      (queryParamsChange)="onTableQueryChange($event)"
    >
    </app-base-data-table>
  `,
})
export class WorkshopComponent implements OnInit {
  tableQueryParams$: Observable<TableQueryParams>;

  constructor(private stateService: StateManagementService) {}

  ngOnInit(): void {
    this.tableQueryParams$ = this.stateService.filters$.pipe(
      map((filters) => this.convertToTableParams(filters))
    );
  }

  onTableQueryChange(params: TableQueryParams): void {
    const filters = this.convertToSearchFilters(params);
    this.stateService.updateFilters(filters);
  }
}
```

---

### Pattern 2: Service-Based Hydration (Smart Components)

**Use Case:** Container/smart components that orchestrate state

```typescript
@Component({
  selector: 'app-discover',
  template: '...',
})
export class DiscoverComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Expose state as observables for child components
  filters$ = this.stateService.filters$;
  results$ = this.stateService.results$;
  loading$ = this.stateService.loading$;
  error$ = this.stateService.error$;

  constructor(private stateService: StateManagementService) {}

  ngOnInit(): void {
    // Component hydrates automatically from StateManagementService
    // which hydrates from URL on initialization

    // Watch for filter changes to update UI
    this.filters$.pipe(takeUntil(this.destroy$)).subscribe((filters) => {
      console.log('Filters updated:', filters);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Event handlers update state
  onModelSelectionChange(modelCombos: ManufacturerModelSelection[]): void {
    this.stateService.updateFilters({ modelCombos, page: 1 });
  }
}
```

---

## Storage Layers

### Layer 1: URL (Query State)

**Purpose:** Store query-related state

**Contents:**
- Selected manufacturer/model combinations
- Active filters
- Sort column and direction
- Current page and page size

**Example:**
```
http://192.168.0.244:4203/workshop?models=Ford:F-150,Chevrolet:Corvette&page=2&sortBy=year&sortOrder=desc&yearMin=1960&yearMax=1980
```

**Characteristics:**
- ✅ Shareable (copy/paste URL)
- ✅ Bookmarkable
- ✅ Survives page refresh
- ✅ Browser navigation (back/forward)
- ✅ Deep linking
- ❌ Not private (visible in URL)

**When to Use:**
- Any state that affects WHAT data is displayed
- Any state that should be shareable
- Any state that should survive refresh

**When NOT to Use:**
- UI preferences (column order, theme, etc.)
- Transient UI state (drawer open/closed)
- Private/sensitive data

---

### Layer 2: localStorage (UI Preferences)

**Purpose:** Store user preferences

**Contents:**
- Column order (user's preferred arrangement)
- Column visibility (which columns shown/hidden)
- Default page size preference
- Panel collapse states
- Theme preferences

**Example:**
```json
{
  "vehicle-discovery-table-vehicle-results-preferences": {
    "columnOrder": ["manufacturer", "model", "year", "body_class"],
    "visibleColumns": ["manufacturer", "model", "year"],
    "pageSize": 50,
    "lastUpdated": 1697654321000
  }
}
```

**Characteristics:**
- ✅ Private (not in URL)
- ✅ Persists across sessions
- ✅ Per-browser/device
- ❌ Not shareable
- ❌ Lost if localStorage cleared

**When to Use:**
- UI preferences that control HOW data is presented
- Per-user customizations
- Non-critical state that enhances UX

**When NOT to Use:**
- Query state (use URL)
- Cross-device state (use backend/preferences API)
- Critical application state

---

### Critical Rule: Never Mix Storage Layers

```typescript
// ❌ WRONG: Column order in URL
?columns=manufacturer,model,year  // Don't do this!

// ✅ CORRECT: Column order in localStorage
localStorage: "vehicle-discovery-table-vehicle-results-preferences"

// ✅ CORRECT: Filters in URL
?manufacturer=Ford&yearMin=1960

// ❌ WRONG: Filters in localStorage
localStorage: "saved-filters"  // Don't do this for active filters!
```

---

## Data Flow Examples

### Example 1: User Changes Filter

```
1. User types in filter input
   ↓
2. Component debounces input (300ms)
   ↓
3. Component calls: this.queryParamsChange.emit({ filters: { manufacturer: 'Ford' } })
   ↓
4. Parent receives event: onTableQueryChange(params)
   ↓
5. Parent converts: const filters = convertToSearchFilters(params)
   ↓
6. Parent calls: this.stateService.updateFilters(filters)
   ↓
7. StateManagementService:
   - Merges with current filters
   - Updates internal state
   - Syncs to URL via RouteStateService
   - Triggers API call via RequestCoordinatorService
   ↓
8. RequestCoordinatorService:
   - Checks for duplicate in-flight requests
   - Checks cache
   - Executes API call (or returns cached)
   - Updates loading state
   ↓
9. API response received
   ↓
10. StateManagementService updates state with results
    ↓
11. State observables emit new values
    ↓
12. Components receive new state via subscriptions
    ↓
13. Component re-hydrates from new state
    ↓
14. UI updates with new data
```

### Example 2: Browser Back Button

```
1. User clicks browser back button
   ↓
2. Angular Router detects URL change
   ↓
3. RouteStateService query parameter observables emit new values
   ↓
4. StateManagementService watchUrlChanges() detects change
   ↓
5. StateManagementService calls: this.initializeFromUrl()
   ↓
6. URL parameters parsed and converted to SearchFilters
   ↓
7. StateManagementService updates internal state
   ↓
8. State observables emit new values
   ↓
9. Parent component receives new state
   ↓
10. Parent converts to TableQueryParams
    ↓
11. Child component @Input() receives new queryParams
    ↓
12. Child ngOnChanges() triggers
    ↓
13. Child calls: this.hydrateFromQueryParams()
    ↓
14. Child clears old state (idempotent)
    ↓
15. Child applies new state
    ↓
16. Child fetches data with new params
    ↓
17. UI updates with historical state
```

### Example 3: Page Refresh (F5)

```
1. User presses F5
   ↓
2. Browser reloads page (all JavaScript state lost)
   ↓
3. Angular application bootstraps
   ↓
4. RouteStateService constructor: Reads URL params from ActivatedRoute
   ↓
5. StateManagementService constructor: Calls initializeFromUrl()
   ↓
6. StateManagementService: Converts URL params to SearchFilters
   ↓
7. StateManagementService: Stores in BehaviorSubject
   ↓
8. Components mount and subscribe to filters$
   ↓
9. Components receive initial state from URL
   ↓
10. Components hydrate and display UI
    ↓
11. Application renders with exact state from URL
```

---

## Service Selection Guide

### When to Use UrlParamService vs StateManagementService

**Decision Tree:**

```
Need to persist something in URL?
│
├─ Is it part of the vehicle search workflow?
│  │
│  ├─ YES → Use StateManagementService
│  │        ├─ Selected manufacturer/model combos
│  │        ├─ Search filters (year, body class, etc.)
│  │        ├─ Pagination (page, size)
│  │        ├─ Sort column and direction
│  │        └─ Anything that should trigger API call
│  │
│  └─ NO → Use UrlParamService
│           ├─ Custom filter states
│           ├─ UI view modes (grid/list)
│           ├─ Panel collapse states
│           ├─ Highlight/selection states (h_ prefix)
│           └─ Component-specific settings
│
└─ Is it a UI preference?
   └─ Use localStorage via TableStatePersistenceService
      ├─ Column order
      ├─ Column visibility
      ├─ Default page size
      └─ Theme preferences
```

**Comparison Table:**

| Feature | UrlParamService | StateManagementService | localStorage |
|---------|----------------|------------------------|--------------|
| **URL Persistence** | ✅ Yes | ✅ Yes | ❌ No |
| **Shareable** | ✅ Yes | ✅ Yes | ❌ No |
| **Triggers API Calls** | ❌ No | ✅ Yes | ❌ No |
| **Request Coordination** | ❌ No | ✅ Yes (via RequestCoordinator) | ❌ No |
| **Type-Safe Operations** | ✅ Yes | ⚠️ Partial | ⚠️ Manual |
| **Observable Watching** | ✅ Yes | ✅ Yes | ❌ No |
| **Domain Coupling** | ❌ None | ✅ SearchFilters | ❌ None |
| **Highlight Parameters** | ✅ Built-in (h_ prefix) | ❌ N/A | ❌ N/A |
| **Use Case** | Generic URL persistence | Vehicle search state | UI preferences |

**Code Examples:**

```typescript
// ✅ CORRECT: Vehicle search filters → StateManagementService
export class DiscoverComponent {
  constructor(private stateService: StateManagementService) {}

  onModelSelection(modelCombos: ManufacturerModelSelection[]): void {
    // Updates URL AND triggers API call
    this.stateService.updateFilters({ modelCombos, page: 1 });
  }
}

// ✅ CORRECT: Custom view mode → UrlParamService
export class DashboardComponent {
  constructor(private urlParamService: UrlParamService) {}

  async toggleViewMode(mode: 'grid' | 'list'): Promise<void> {
    // Updates URL only, no API call
    await this.urlParamService.updateParam('viewMode', mode);
  }

  ngOnInit(): void {
    const mode = this.urlParamService.getParam('viewMode') || 'grid';
    this.applyViewMode(mode);
  }
}

// ✅ CORRECT: Column order → localStorage
export class TableComponent {
  constructor(private persistenceService: TableStatePersistenceService) {}

  onColumnReorder(newOrder: string[]): void {
    // Saves to localStorage only (not shareable)
    this.persistenceService.savePreferences('vehicle-results', {
      columnOrder: newOrder,
      visibleColumns: this.visibleColumns,
    });
  }
}

// ✅ CORRECT: Row highlight → UrlParamService (highlight pattern)
export class ResultsTableComponent {
  constructor(private urlParamService: UrlParamService) {}

  async onRowClick(rowId: string): Promise<void> {
    // Highlight in URL (shareable) but doesn't affect query state
    await this.urlParamService.setHighlightParam('row', rowId);
  }

  ngOnInit(): void {
    const highlightedRow = this.urlParamService.getHighlightParam('row');
    if (highlightedRow) {
      this.scrollToAndHighlight(highlightedRow);
    }
  }
}

// ❌ WRONG: Vehicle filters in UrlParamService
export class DiscoverComponent {
  constructor(private urlParamService: UrlParamService) {}

  async onYearFilterChange(yearMin: number): Promise<void> {
    // ❌ Don't do this! No API call triggered, data won't update
    await this.urlParamService.updateParam('yearMin', yearMin);
  }
}

// ❌ WRONG: View mode in StateManagementService
export class DashboardComponent {
  constructor(private stateService: StateManagementService) {}

  onToggleView(mode: 'grid' | 'list'): void {
    // ❌ Don't do this! Will trigger unnecessary API call
    this.stateService.updateFilters({ viewMode: mode });
  }
}
```

**Quick Decision Guide:**

1. **Does it affect WHAT data is displayed?** → StateManagementService + URL
2. **Does it affect HOW data is presented?** → localStorage
3. **Is it shareable but outside search workflow?** → UrlParamService
4. **Is it temporary UI state that should be shareable?** → UrlParamService (highlight pattern)

---

## Best Practices

### DO ✅

1. **Use URL for query state**
   ```typescript
   // Filters, sort, pagination → URL
   this.stateService.updateFilters({ yearMin: 1960 });
   ```

2. **Use localStorage for UI preferences**
   ```typescript
   // Column order, visibility → localStorage
   this.persistenceService.savePreferences(tableId, prefs);
   ```

3. **Use input-based hydration for reusable components**
   ```typescript
   @Input() queryParams: TableQueryParams;
   ngOnChanges() { this.hydrate(); }
   ```

4. **Make hydration idempotent**
   ```typescript
   private hydrate(): void {
     this.clear(); // Always clear first
     this.apply(this.queryParams);
   }
   ```

5. **Emit unified events**
   ```typescript
   @Output() queryParamsChange = new EventEmitter<TableQueryParams>();
   // Single event with complete state
   ```

6. **Use OnPush change detection**
   ```typescript
   @Component({
     changeDetection: ChangeDetectionStrategy.OnPush
   })
   ```

7. **Use trackBy functions**
   ```typescript
   trackByColumnKey(index: number, column: TableColumn): string {
     return column.key as string;
   }
   ```

8. **Debounce user input**
   ```typescript
   subject.pipe(debounceTime(300), distinctUntilChanged());
   ```

---

### DON'T ❌

1. **Don't put UI preferences in URL**
   ```typescript
   // ❌ WRONG
   ?columnOrder=manufacturer,model,year

   // ✅ CORRECT
   localStorage: "vehicle-discovery-table-vehicle-results-preferences"
   ```

2. **Don't put query state in localStorage**
   ```typescript
   // ❌ WRONG
   localStorage.setItem('currentFilters', JSON.stringify(filters));

   // ✅ CORRECT
   this.stateService.updateFilters(filters); // → URL
   ```

3. **Don't inject StateManagementService in reusable components**
   ```typescript
   // ❌ WRONG
   export class BaseDataTableComponent {
     constructor(private stateService: StateManagementService) {}
   }

   // ✅ CORRECT
   export class BaseDataTableComponent {
     @Input() queryParams: TableQueryParams;
   }
   ```

4. **Don't have side effects in hydration**
   ```typescript
   // ❌ WRONG
   private hydrate(): void {
     this.filters = { ...this.filters, ...newFilters }; // Accumulates!
   }

   // ✅ CORRECT
   private hydrate(): void {
     this.clear(); // Always clear first
     this.apply(newState);
   }
   ```

5. **Don't emit multiple partial events**
   ```typescript
   // ❌ WRONG
   this.pageChange.emit(2);
   this.sortChange.emit({ sortBy: 'year', sortOrder: 'asc' });

   // ✅ CORRECT
   this.queryParamsChange.emit({
     page: 2,
     sortBy: 'year',
     sortOrder: 'asc',
     filters: this.filters,
   });
   ```

---

## Common Patterns

### Pattern: Parent-Child State Conversion

**Problem:** Parent uses `SearchFilters`, child uses `TableQueryParams`

**Solution:** Convert at the boundary

```typescript
// In parent component
export class WorkshopComponent {
  tableQueryParams$ = this.stateService.filters$.pipe(
    map((filters) => ({
      page: filters.page || 1,
      size: filters.size || 20,
      sortBy: filters.sort,
      sortOrder: filters.sortDirection,
      filters: {
        manufacturer: filters.manufacturer,
        model: filters.model,
        yearMin: filters.yearMin,
        yearMax: filters.yearMax,
      },
    }))
  );

  onTableQueryChange(params: TableQueryParams): void {
    this.stateService.updateFilters({
      page: params.page,
      size: params.size,
      sort: params.sortBy,
      sortDirection: params.sortOrder,
      manufacturer: params.filters?.manufacturer,
      model: params.filters?.model,
      yearMin: params.filters?.yearMin,
      yearMax: params.filters?.yearMax,
    });
  }
}
```

---

### Pattern: Debounced Filter Input

**Problem:** User types quickly, don't want API call per keystroke

**Solution:** Debounce with RxJS Subject

```typescript
private filterSubjects = new Map<string, Subject<string>>();

setupFilterDebouncing(column: TableColumn): void {
  const subject = new Subject<string>();
  this.filterSubjects.set(column.key as string, subject);

  subject.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    takeUntil(this.destroy$)
  ).subscribe(value => {
    this.updateFilter(column.key as string, value);
  });
}

onFilterInput(column: TableColumn, value: string): void {
  const subject = this.filterSubjects.get(column.key as string);
  if (subject) {
    subject.next(value);
  }
}
```

---

### Pattern: Command Pattern (Counter Pattern)

**Problem:** Parent needs to command child: "Clear your selections NOW"

**Solution:** Use incrementing counter

```typescript
// Parent Component
pickerClearTrigger = 0;

onClearAll(): void {
  this.pickerClearTrigger++;  // Increment: 0 → 1
  this.stateService.resetFilters();
}

// Child Component
@Input() clearTrigger: number = 0;
private lastClearTrigger = 0;

ngOnChanges(changes: SimpleChanges): void {
  if (changes['clearTrigger'] && !changes['clearTrigger'].firstChange) {
    const newValue = changes['clearTrigger'].currentValue;
    if (newValue !== this.lastClearTrigger) {
      this.lastClearTrigger = newValue;
      this.selectedRows.clear();  // ✅ Clear action executed
    }
  }
}
```

**Why Counter Pattern:**
- Simple primitive (number) - easy change detection
- No reference equality issues (unlike objects/arrays)
- Can detect multiple rapid commands (0→1→2→3)
- Parent controls timing without tight coupling

---

## State Flow Principles

1. **URL is Truth** - All query state stored in URL parameters
2. **Unidirectional Flow** - State flows one direction through services
3. **Observable Pattern** - Components subscribe, never call directly
4. **Input-Based Hydration** - Children receive state via @Input, not services
5. **Event Bubbling** - Events flow up (emit), state flows down (input)
6. **Idempotent Operations** - Hydration safe to call multiple times
7. **No Direct Coupling** - Components never talk to each other directly
8. **Storage Separation** - URL (query) vs localStorage (UI preferences)

---

**End of State Management Architecture Draft**

**Document Status:** Draft - Subject to refinement during ADR review
**Source:** Synthesized from AUTOS-PrimeNG state management documentation
**Last Updated:** 2025-11-11
**Revision History:**
- 2025-11-11: Initial synthesis from state-management-guide.md and state-flow-diagram.md
- 2025-11-11: Added UrlParamService documentation (created after original state docs)
- 2025-11-11: Added Service Selection Guide with decision tree and comparison table
- 2025-11-11: Updated service hierarchy diagram to show dual URL parameter services
- 2025-11-11: Documented highlight parameter pattern (h_ prefix)

**Next Steps:** Review during ADR-004 (State Management Architecture)
