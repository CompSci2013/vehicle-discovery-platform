# VDP BaseTable Implementation Roadmap

**Status:** Feature Parity Plan for vdp vs autos-prime-ng
**Architecture Constraint:** URL-first state management must NOT be violated at any step

---

## Implementation Sequence (Respecting URL-First Design)

### Phase 1: Foundation - Client-Side State (P0)
**Goal:** Ensure current functionality works with URL-first pattern

#### Step 1.1: Verify Current URL-First State Management ✅
- [x] Selection state hydrated from URL (config.selection.urlParam)
- [x] Sort/filter state in component memory (not yet persisted to URL)
- [x] Pagination state in component memory (not yet persisted to URL)
- **URL-First Constraint:** State reads from URL on init, writes back on change

**Deliverable:** Confirm BaseTable reads/writes selection to URL

#### Step 1.2: Add Sort State to URL ⏳
- [ ] Create `sortStateToUrl()` method
  - Serialize: `{ sortField, sortOrder }` → URL param (e.g., `?sort=manufacturer:asc`)
- [ ] Create `urlToSortState()` method
  - Deserialize: URL param → `{ sortField, sortOrder }`
- [ ] Call `applyDataTransformations()` after URL hydration
- **URL-First Constraint:** Sort state must be in URL before re-rendering

**Code Pattern:**
```typescript
// In ngOnInit or onRouteChange
const sortState = this.urlState.getQueryParam('sort');
if (sortState) {
  const { field, order } = this.urlToSortState(sortState);
  this.sortField = field;
  this.sortOrder = order;
  this.applyDataTransformations();
}

// When user clicks sort header
onSortColumn(column: TableColumn): void {
  // ... toggle sort logic ...
  this.urlState.setQueryParams({
    sort: this.sortStateToUrl(this.sortField, this.sortOrder)
  });
  this.applyDataTransformations();
}
```

#### Step 1.3: Add Filter State to URL ⏳
- [ ] Create `filterStateToUrl()` method
  - Serialize: `{ col1: 'value1', col2: 'value2' }` → URL params (e.g., `?f_manufacturer=Ford&f_model=F-150`)
- [ ] Create `urlToFilterState()` method
  - Deserialize: URL params → `{ col1, col2, ... }`
- [ ] Call `applyDataTransformations()` after URL hydration
- **URL-First Constraint:** Filter state must be in URL before re-rendering

**Code Pattern:**
```typescript
// In ngOnInit or onRouteChange
const filterParams = this.urlState.getAllQueryParams();
Object.entries(filterParams).forEach(([key, value]) => {
  if (key.startsWith('f_')) {
    const colKey = key.substring(2);
    this.activeFilters[colKey] = value;
  }
});
this.applyDataTransformations();

// When user types in filter
onFilterColumn(column: TableColumn, event: any): void {
  const value = event.target?.value || '';
  if (value.trim()) {
    this.activeFilters[column.key] = value.toLowerCase();
  } else {
    delete this.activeFilters[column.key];
  }

  // Update URL with all current filters
  const filterParams: Record<string, string> = {};
  Object.entries(this.activeFilters).forEach(([key, val]) => {
    filterParams[`f_${key}`] = val;
  });
  this.urlState.setQueryParams(filterParams);
  this.applyDataTransformations();
}
```

#### Step 1.4: Add Pagination State to URL ⏳
- [ ] Create `paginationStateToUrl()` method
  - Serialize: `{ page, size }` → URL params (e.g., `?page=2&size=50`)
- [ ] Create `urlToPaginationState()` method
  - Deserialize: URL params → `{ page, size }`
- [ ] Hydrate pagination from URL on init
- **URL-First Constraint:** Pagination state must be in URL before data load

**Code Pattern:**
```typescript
// In ngOnInit or onRouteChange
const page = this.urlState.getQueryParamAsNumber('page', 1);
const size = this.urlState.getQueryParamAsNumber('size', 20);
this.first = (page - 1) * size; // PrimeNG paginator format
this.rows = size;

// When user changes page
onPageChange(event: any): void {
  this.first = event.first;
  this.rows = event.rows;
  const page = (event.first / event.rows) + 1;

  this.urlState.setQueryParams({
    page: String(page),
    size: String(this.rows)
  });

  if (this.config.api) {
    this.loadData();
  }
}
```

---

### Phase 2: Server-Side Integration (P0)
**Goal:** Enable backend pagination, sorting, filtering

#### Step 2.1: Implement API Data Fetching ⏳
- [ ] Complete `loadData()` method in BaseTable
  - Wire `config.api` to fetch data from backend
  - Pass current pagination/sort/filter to API
  - Update `data` and `totalRecords` with response
- [ ] Create API request mapper
  - Convert component state → API query params
  - Example: `{ sortField: 'manufacturer', sortOrder: 'asc' }` → `?sort=manufacturer.asc`
- **URL-First Constraint:** URL params drive API calls (never the other way)

**Code Pattern:**
```typescript
private loadData(): void {
  if (!this.config.api) {
    console.warn('[BaseTable] No API configured');
    return;
  }

  this.loading = true;

  // Build API params from current state (all from URL)
  const apiParams = {
    page: (this.first / this.rows) + 1,
    size: this.rows,
    sort: this.sortField ? `${this.sortField}.${this.sortOrder}` : null,
    filters: this.activeFilters // Already URL-derived
  };

  this.apiService.fetch(this.config.api.endpoint, apiParams)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        this.data = response.data;
        this.totalRecords = response.totalCount;
        this.loading = false;
      },
      error: (err) => {
        console.error('[BaseTable] API error:', err);
        this.loading = false;
      }
    });
}
```

#### Step 2.2: Integrate RequestCoordinator ⏳
- [ ] Inject RequestCoordinator into BaseTable
- [ ] Use RequestCoordinator for all API calls
  - Deduplicates identical requests
  - Handles request caching
  - Manages loading state
- **URL-First Constraint:** Request deduplication based on URL params (same params = same request)

**Code Pattern:**
```typescript
constructor(
  private urlState: UrlStateService,
  private requestCoordinator: RequestCoordinatorService,
  ...
) {}

private loadData(): void {
  const apiParams = { /* ... */ };

  // Request key based on current URL state
  const requestKey = this.getRequestKey(apiParams);

  this.requestCoordinator.execute(requestKey, () =>
    this.apiService.fetch(this.config.api.endpoint, apiParams)
  )
  .pipe(takeUntil(this.destroy$))
  .subscribe({
    next: (response) => {
      this.data = response.data;
      this.totalRecords = response.totalCount;
    }
  });
}

private getRequestKey(params: any): string {
  // Request key from params (URL-derived)
  return JSON.stringify(params);
}
```

#### Step 2.3: Handle Server-Side Sort/Filter ⏳
- [ ] Detect if sort/filter came from URL (hydration) vs user action
- [ ] For URL hydration: Fetch data immediately
- [ ] For user action: Update URL first, then fetch
- [ ] Update component to show "Loading..." during fetch
- **URL-First Constraint:** URL changes trigger API calls (not vice versa)

**Code Pattern:**
```typescript
// On route change (hydration)
ngOnInit(): void {
  // 1. Hydrate all state from URL
  const page = this.urlState.getQueryParamAsNumber('page', 1);
  const sortField = this.urlState.getQueryParam('sortField');
  // ... etc ...

  // 2. Load data based on URL state
  this.loadData();
}

// On user action (sort click)
onSortColumn(column: TableColumn): void {
  // 1. Update component state
  this.sortField = column.key;
  this.sortOrder = 'asc';

  // 2. Update URL (triggers route change listener)
  this.urlState.setQueryParams({
    sort: `${column.key}:asc`,
    page: '1' // Reset to page 1 on new sort
  });

  // 3. Load data (will fetch with new sort params)
  this.loadData();
}
```

---

### Phase 3: Column Management (P0)
**Goal:** Add user control over column visibility/reordering

#### Step 3.1: Port/Create ColumnManager Component ⏳
- [ ] Copy from apn: `column-manager.component.ts/html/scss`
  - Location: `/autos-prime-ng/frontend/src/app/shared/components/column-manager/`
- [ ] Adapt to vdp's configuration-driven approach
- [ ] Features:
  - Sidebar UI with PrimeNG PickList
  - Column visibility toggle
  - Drag-drop reordering
  - Column search
  - Reset to defaults
  - Column dependencies
- **URL-First Constraint:** Column preferences in localStorage (not URL, too verbose)

**Files to Create:**
```
frontend/src/app/shared/components/column-manager/
├── column-manager.component.ts
├── column-manager.component.html
├── column-manager.component.scss
└── column-manager.component.spec.ts
```

#### Step 3.2: Integrate ColumnManager with BaseTable ⏳
- [ ] Add `showColumnManagement` input to BaseTable
- [ ] Add ColumnManager to BaseTable template
- [ ] Handle column visibility changes
  - Update `getVisibleColumns()` based on column.visible
  - Re-render table with visible columns
- [ ] Save column preferences to localStorage
- [ ] Load column preferences on init
- **URL-First Constraint:** Column prefs in localStorage (persisted), not in URL

**Code Pattern:**
```typescript
// In BaseTable
@Input() showColumnManagement = true;

private tablePersistence: TableStatePersistenceService; // Inject

ngOnInit(): void {
  // Load column preferences from localStorage
  const savedPrefs = this.tablePersistence.loadPreferences(this.config.id);
  if (savedPrefs?.columns) {
    this.config.columns = this.config.columns.map(col => ({
      ...col,
      visible: savedPrefs.columns[col.key]?.visible ?? col.visible
    }));
  }
}

onColumnsChange(updatedColumns: TableColumn[]): void {
  this.config.columns = updatedColumns;

  // Save to localStorage
  const prefs = {
    columns: this.config.columns.reduce((acc, col) => ({
      ...acc,
      [col.key]: { visible: col.visible }
    }), {})
  };
  this.tablePersistence.savePreferences(this.config.id, prefs);

  // Trigger re-render
  this.cdr.markForCheck();
}
```

#### Step 3.3: Add Column Reordering ⏳
- [ ] ColumnManager handles drag-drop reordering
- [ ] BaseTable receives reordered columns
- [ ] Apply reordering to table render
- [ ] Persist column order to localStorage
- **URL-First Constraint:** Column order in localStorage, not URL

---

### Phase 4: Hierarchical Selection Refinement (P0)
**Goal:** Ensure parent-child state matching works correctly with URL

#### Step 4.1: Verify Single-Selector Pattern ✅
- [x] Parent checkbox only (no child in same row)
- [x] Single row selection
- [x] State persisted to URL
- **URL-First Constraint:** Selection state from URL on init

#### Step 4.2: Verify Dual-Selector Pattern ✅
- [x] Parent AND child checkboxes on same row
- [x] State matching: Parent state = child state when same row id
- [x] Parent click affects ALL rows for that parent (global)
- [x] Child click affects ONLY that row (local)
- [x] NO tri-state (parent always binary)
- **URL-First Constraint:** Both parent and child states serialized to URL

**URL Serialization:**
```typescript
// Example URL: ?selected=Ford|F-150,Ford|Mustang,Dodge|Durango
// Format: parent|child,parent|child,...

// Serialize to URL
const selectedKeys = Array.from(this.selectionHelper.getSelectedKeys());
this.urlState.setQueryParams({
  [this.config.selection.urlParam]: selectedKeys.join(',')
});

// Deserialize from URL
const urlValue = this.urlState.getQueryParam(this.config.selection.urlParam);
const selectedKeys = urlValue ? new Set(urlValue.split(',')) : new Set();
```

#### Step 4.3: Handle Parent-Child State Synchronization ⏳
- [ ] When parent clicked: Update ALL rows for that parent in URL
- [ ] When child clicked: Update ONLY that row in URL
- [ ] Validate: Parent state = child state on page load
- **URL-First Constraint:** URL contains complete selection state, component derives from URL

**Code Pattern:**
```typescript
onParentCheckboxChange(parentValue: string, event: any): void {
  if (!this.selectionHelper) return;

  // Get all rows for this parent
  const childrenForParent = this.data.filter(row =>
    row[this.config.selection.hierarchical.parentKey] === parentValue
  );

  // Determine action
  const isCurrentlyChecked = childrenForParent.every(child =>
    this.selectionHelper.isSelected(child)
  );

  if (isCurrentlyChecked) {
    // Deselect all children for this parent
    childrenForParent.forEach(child =>
      this.selectionHelper.deselectChild(child)
    );
  } else {
    // Select all children for this parent
    childrenForParent.forEach(child =>
      this.selectionHelper.selectChild(child)
    );
  }

  // Update URL with new selection state
  const selectedKeys = this.selectionHelper.getSelectedKeys();
  this.urlState.setQueryParams({
    [this.config.selection.urlParam]: Array.from(selectedKeys).join(',')
  });

  this.updateParentCheckboxStateCache();
  this.emitSelectionChange();
}

onChildCheckboxChange(row: any, event: any): void {
  if (!this.selectionHelper) return;

  this.selectionHelper.toggleChild(row);

  // Update URL with new selection state
  const selectedKeys = this.selectionHelper.getSelectedKeys();
  this.urlState.setQueryParams({
    [this.config.selection.urlParam]: Array.from(selectedKeys).join(',')
  });

  this.updateParentCheckboxStateCache();
  this.emitSelectionChange();
}
```

---

### Phase 5: Sub-Table Expansion (P1)
**Goal:** Support expandable rows with sub-tables (not hierarchical parents)

#### Step 5.1: Enhance Row Expansion ⏳
- [ ] Support static sub-table data from `config.expandable.subTable.dataKey`
- [ ] Support dynamic sub-table data via API
- [ ] Track expanded rows in component state
- [ ] Render sub-table with own BaseTable instance (recursive)
- **URL-First Constraint:** Expansion state NOT persisted to URL (session-only)

#### Step 5.2: Sub-Table Configuration ⏳
- [ ] Define `subTableConfig` in expansion config
  - Columns for sub-table
  - Selection rules (inherited or independent)
  - API endpoint if dynamic
- **URL-First Constraint:** Sub-table selection state separate from parent table

---

### Phase 6: URL-First Documentation & Testing (P0)
**Goal:** Ensure URL-first pattern is validated and documented

#### Step 6.1: Document URL Parameter Format ⏳
- [ ] Create `URL_PARAMS_SCHEMA.md`
  - List all URL params BaseTable uses
  - Format for each param (e.g., `sort=field:asc`)
  - Examples for different configurations
- [ ] Update CHECKBOX-BEHAVIOR.md with URL examples

#### Step 6.2: Test URL Hydration ⏳
- [ ] Write tests for each URL parameter:
  - Load component with URL params → state matches
  - Change state → URL updates
  - Reload with same URL → identical state
- [ ] Test combinations:
  - `?selected=Ford|F-150&sort=model:asc&f_manufacturer=Ford&page=2`

#### Step 6.3: Validate URL-First Constraint ⏳
- [ ] No direct data mutation without URL update
- [ ] No API calls without URL params
- [ ] All state readable from URL
- [ ] Browser back/forward works correctly

---

## URL-First State Management Rules (ALL Phases)

### Rule 1: URL is Single Source of Truth
- ✅ ALL mutable state must be derivable from URL
- ✅ Component state initialized from URL on load
- ✅ Every user action updates URL first, then component state
- ❌ Never mutate component state without updating URL
- ❌ Never call API without URL params in place

### Rule 2: State Serialization
- ✅ Simple types go in URL directly (e.g., `?sort=manufacturer:asc`)
- ✅ Complex types use delimiter format (e.g., `?selected=Ford|F-150,Ford|Mustang`)
- ✅ Column prefs go in localStorage (too verbose for URL)
- ❌ Never use cryptic encoding that hides intent

### Rule 3: Navigation Flow
```
User Action
  ↓
Update URL Params (via UrlStateService)
  ↓
Angular Router detects change
  ↓
Component detects route change (ActivatedRoute.queryParams)
  ↓
Hydrate state from new URL
  ↓
Apply data transformations / load API
  ↓
Render updated view
```

### Rule 4: API Call Requirements
- ✅ Every API call triggered by URL change
- ✅ API params derived from current URL state
- ✅ Request deduplication by URL params (RequestCoordinator)
- ❌ Never call API on component property changes
- ❌ Never bypass RequestCoordinator

### Rule 5: Selection State Requirements (Hierarchical)
- ✅ Selection stored in URL as `?selected=key1,key2,key3`
- ✅ Parent-child state matching enforced in component logic
- ✅ Parent click updates ALL rows in URL
- ✅ Child click updates ONLY that row in URL
- ❌ Never derive parent state from child checkboxes alone
- ❌ Never allow parent/child mismatch in selected state

---

## Success Criteria (All Phases)

✅ **URL-First Validation:**
- [ ] Reload page with any URL params → exact same state
- [ ] Browser back/forward navigation works
- [ ] Share URL with someone else → they see exact same state
- [ ] All user actions produce predictable URL changes
- [ ] No state mutations without URL updates

✅ **Feature Parity:**
- [ ] ColumnManager component exists
- [ ] Server-side pagination works
- [ ] Server-side sort/filter works
- [ ] Selection state in URL
- [ ] Sort/filter state in URL
- [ ] Pagination state in URL
- [ ] Single-selector picker works
- [ ] Dual-selector picker works
- [ ] Parent-child state matching enforced

✅ **Performance:**
- [ ] RequestCoordinator deduplicates identical API calls
- [ ] No duplicate data fetches on URL changes
- [ ] Column prefs load from localStorage (not API)
- [ ] Sort/filter client-side when possible

---

## Implementation Priority

| Phase | Items | Priority | Duration |
|-------|-------|----------|----------|
| 1 | Client sort/filter/pagination to URL | P0 | Week 1 |
| 2 | API integration + RequestCoordinator | P0 | Week 2 |
| 3 | ColumnManager component | P0 | Week 1-2 |
| 4 | Hierarchical selection URL sync | P0 | Week 1 |
| 5 | Sub-table expansion | P1 | Week 3 |
| 6 | Testing + documentation | P0 | Week 2-3 |

---

**Constraint:** At every step, URL-first state management must be maintained. No step can proceed if it violates URL-first principles.
