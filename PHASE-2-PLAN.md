# Phase 2: Server-Side Integration Implementation Plan

**Status:** Starting Phase 2 Implementation
**Date:** November 12, 2025
**Scope:** Add server-side pagination, sorting, filtering, and API integration to BaseTable

---

## Overview

Phase 2 transforms BaseTable from client-side only to server-side capable while maintaining URL-first state management. Every API call is triggered by URL changes, ensuring URL remains the single source of truth.

### Key Principle: URL-First API Integration
```
User Action → Update URL → Detect URL Change → Fetch API → Render Data
```

---

## Phase 2 Architecture

### Components to Create/Modify

#### 1. RequestCoordinator Service (NEW)
**Purpose:** Deduplicate API requests by URL parameters
**Features:**
- Cache requests by serialized query params
- Return cached result if identical request pending
- Clear cache on successful response
- Timeout handling for stale requests

**Location:** `frontend/src/app/core/services/request-coordinator.service.ts`

#### 2. BaseTable Component (MODIFY)
**Changes:**
- Add API data fetching integration
- Combine URL state with API params
- Handle loading/error states
- Trigger API calls on URL changes

**Key Methods:**
- `loadDataFromApi()` - Fetch data from API
- `buildApiRequestParams()` - Convert component state to API params
- `onUrlStateChange()` - React to URL changes
- `handleApiError()` - Error handling and recovery

#### 3. TableConfig Model (MODIFY)
**Changes:**
- Add `api` configuration for server-side operations
- Define API endpoint and pagination settings

---

## Step-by-Step Implementation

### Step 2.1: Design API Request/Response Contract

#### API Request Format (to be sent to backend)
```typescript
{
  // Pagination (from URL: page, pageSize)
  page: 1,           // 1-indexed
  pageSize: 20,      // per page

  // Sorting (from URL: sort=field:direction)
  sortBy: 'manufacturer',
  sortOrder: 'asc',

  // Filtering (from URL: f_column=value)
  filters: {
    manufacturer: 'Ford',
    model: 'F-150',
    year: 2020
  }
}
```

#### API Response Format (from backend)
```typescript
{
  data: [...],           // Array of results
  total: 1234,           // Total records (all pages)
  page: 1,               // Current page (1-indexed)
  pageSize: 20,          // Results per page
  totalPages: 62         // Total pages available
}
```

### Step 2.2: Create RequestCoordinator Service

**Functionality:**
- Store pending requests keyed by URL params hash
- Return Observable from cache if exists
- Forward HTTP response to all subscribers
- Clean up cache after request completes

**Usage Pattern:**
```typescript
// Multiple calls with same URL params
requestCoordinator.get(url, params)
  .subscribe(response => {
    console.log('First caller gets result');
  });

requestCoordinator.get(url, params)
  .subscribe(response => {
    console.log('Second caller gets SAME response (no duplicate HTTP)');
  });
```

### Step 2.3: Modify BaseTable for API Integration

#### Key Changes:

1. **Add API Configuration Support**
   ```typescript
   config.api = {
     endpoint: '/api/vehicles/search',  // Optional, can use default
     pageParamName: 'page',              // Default page param name
     pageSizeParamName: 'pageSize'       // Default page size param name
   }
   ```

2. **Modify Data Loading Logic**
   - If `config.api` → fetch from API
   - If `config.data` → use static data (Phase 1)
   - Both can coexist

3. **Subscribe to URL Changes**
   - Watch for changes to: `sort`, `f_*`, `page`, `pageSize`
   - When URL changes → trigger API call
   - Use RequestCoordinator to avoid duplicate requests

4. **Build API Request Params from Component State**
   ```typescript
   buildApiRequestParams() {
     return {
       page: Math.floor(this.first / this.rows) + 1,
       pageSize: this.rows,
       sortBy: this.sortField,
       sortOrder: this.sortOrder,
       filters: this.activeFilters
     };
   }
   ```

5. **Handle API Response**
   ```typescript
   // API returns paginated data
   response.data → this.data = response.data
   response.total → this.totalRecords = response.total
   response.totalPages → update pagination UI
   ```

### Step 2.4: URL-to-API-Params Mapping

**Conversion Pipeline:**
```
URL Params → Component State → API Request Params
   ↓
?sort=manufacturer:asc&f_year=2020&page=2&pageSize=20
   ↓
sortField='manufacturer', sortOrder='asc'
activeFilters={year: '2020'}
first=20 (page 2, 20 per page = offset 20)
rows=20
   ↓
{
  page: 2,
  pageSize: 20,
  sortBy: 'manufacturer',
  sortOrder: 'asc',
  filters: { year: '2020' }
}
```

### Step 2.5: Implementation Sequence

1. **Create RequestCoordinator Service** (Step 2.1)
2. **Add API config to BaseTable initialization** (Step 2.2)
3. **Implement loadDataFromApi() method** (Step 2.3)
4. **Watch URL changes and trigger API calls** (Step 2.4)
5. **Build API request params from component state** (Step 2.5)
6. **Handle API responses and errors** (Step 2.6)
7. **Test with real/mock API** (Step 2.7)

---

## Testing Strategy

### Mock API for Development
Use existing `demo-api.service.ts` pattern:
- Simulate paginated responses
- Simulate sorting/filtering
- Test error scenarios
- Measure response times

### Integration Testing
- URL change → API call → data update
- Multiple simultaneous requests → deduplicated
- Error handling → graceful fallback
- Sorting/filtering → API receives correct params

---

## Code Patterns (URL-First)

### Pattern 1: Detect URL Changes and Fetch
```typescript
ngOnInit() {
  // Subscribe to URL changes
  this.route.queryParams
    .pipe(
      debounceTime(300),  // Wait for rapid URL changes
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    )
    .subscribe(() => {
      if (this.config.api) {
        this.loadDataFromApi();
      }
    });
}
```

### Pattern 2: Build Request from Component State
```typescript
private buildApiRequestParams(): any {
  const params: any = {
    page: Math.floor(this.first / this.rows) + 1,
    pageSize: this.rows
  };

  if (this.sortField) {
    params.sortBy = this.sortField;
    params.sortOrder = this.sortOrder;
  }

  if (Object.keys(this.activeFilters).length > 0) {
    params.filters = this.activeFilters;
  }

  return params;
}
```

### Pattern 3: Use RequestCoordinator to Deduplicate
```typescript
private loadDataFromApi(): void {
  const params = this.buildApiRequestParams();

  this.requestCoordinator.get(
    this.config.api.endpoint,
    params
  ).pipe(
    takeUntil(this.destroy$)
  ).subscribe(
    (response) => {
      this.data = response.data;
      this.totalRecords = response.total;
      this.loading = false;
    },
    (error) => {
      this.handleApiError(error);
    }
  );
}
```

---

## Success Criteria

✅ RequestCoordinator service created and tested
✅ BaseTable can fetch data from API endpoint
✅ Server-side sorting works (URL → API → sorted results)
✅ Server-side filtering works (URL → API → filtered results)
✅ Server-side pagination works (URL → API → paginated results)
✅ Duplicate requests deduplicated via RequestCoordinator
✅ URL-first principle maintained (no state leaks)
✅ Loading/error states handled
✅ Graceful fallback to client-side when API unavailable

---

## Files to Create/Modify

### Create
```
frontend/src/app/core/services/request-coordinator.service.ts
frontend/src/app/core/services/request-coordinator.service.spec.ts
```

### Modify
```
frontend/src/app/shared/components/base-table/base-table.component.ts
frontend/src/app/shared/models/table-config.model.ts
frontend/src/app/core/services/index.ts (barrel export)
```

---

## Next Steps After Phase 2

Once Phase 2 complete:
- Phase 3: ColumnManager component for column management
- Phase 4: Hierarchical selection refinement
- Phase 5: Sub-table expansion with API support
- Phase 6: Testing & documentation

