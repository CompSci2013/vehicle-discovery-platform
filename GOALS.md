# Project Goals & Requirements

**Document Purpose:** Define what we're building and why (outcome-focused)
**Created:** 2025-11-11
**Status:** Active Requirements
**Approach:** Lean - focus on outcomes, not over-specification

---

## Goal 1: Master URL-First Architecture

### Desired Outcome
Developer (odin) gains **practical, working understanding** of URL-first state management through hands-on implementation.

### Success Criteria
1. ✅ Developer can explain why URL is single source of truth
2. ✅ Developer understands when to use URL vs localStorage
3. ✅ Developer can implement "dumb" components that hydrate from URL
4. ✅ Developer can handle paginated server calls within URL architecture
5. ✅ Developer can implement popped-out components that sync with main window

### Key Concepts to Master

#### 1.1 Dumb Components in URL Architecture
**Question:** How do "dumb" components fit in URL-first design?

**Answer:**
```typescript
// Dumb component: Receives state via @Input, emits events via @Output
@Component({
  selector: 'app-filter-panel',
  template: `
    <input [value]="yearMin" (input)="onYearChange($event)">
  `
})
export class FilterPanelComponent {
  @Input() yearMin: number = 1900;  // State flows IN from parent
  @Output() yearMinChange = new EventEmitter<number>();  // Events flow OUT to parent

  onYearChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.yearMinChange.emit(value);  // Component doesn't touch URL
  }
}

// Parent component: Manages URL state
@Component({
  selector: 'app-discover',
  template: `
    <app-filter-panel
      [yearMin]="filters.yearMin"
      (yearMinChange)="onYearMinChange($event)"
    ></app-filter-panel>
  `
})
export class DiscoverComponent {
  filters: SearchFilters;

  constructor(private urlState: UrlStateService) {
    // Hydrate from URL
    this.filters = {
      yearMin: this.urlState.getParamAsNumber('yearMin', 1900)
    };
  }

  onYearMinChange(yearMin: number): void {
    // Parent updates URL
    this.urlState.updateParam('yearMin', yearMin);
    // Parent triggers API call
    this.fetchData();
  }
}
```

**Key Principle:** Dumb components never touch URL directly. They receive state and emit events.

---

#### 1.2 Start Wide, Go Narrow: Paginated Tables
**Question:** How do paginated tables fit URL-first when they need server calls?

**Pattern: "Start Wide, Go Narrow"**

```typescript
// Initial state: User selects broad criteria
URL: ?models=Ford:F-150,Ford:Mustang
API Call: Fetch ALL matching vehicles (4,887 results)
Response: Returns page 1 (20 results) + total count

// Narrow state: User filters further
URL: ?models=Ford:F-150,Ford:Mustang&yearMin=1960&yearMax=1980&page=2
API Call: Fetch FILTERED vehicles (523 results)
Response: Returns page 2 (20 results) + total count
```

**Implementation:**
```typescript
@Component({
  selector: 'app-results-table'
})
export class ResultsTableComponent implements OnInit {
  data: VehicleResult[] = [];
  totalResults: number = 0;
  currentPage: number = 1;
  pageSize: number = 20;

  constructor(
    private urlState: UrlStateService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    // Hydrate pagination from URL
    this.currentPage = this.urlState.getParamAsNumber('page', 1);
    this.pageSize = this.urlState.getParamAsNumber('size', 20);

    // Fetch data (wide or narrow)
    this.fetchData();

    // Watch for URL changes (browser back/forward)
    this.urlState.watchParam('page').subscribe(() => {
      this.currentPage = this.urlState.getParamAsNumber('page', 1);
      this.fetchData();
    });
  }

  async onPageChange(newPage: number): Promise<void> {
    // Update URL (triggers hydration cycle)
    await this.urlState.updateParam('page', newPage);
  }

  private fetchData(): void {
    const filters = this.buildFiltersFromUrl();
    this.apiService.getVehicleDetails(filters).subscribe(response => {
      this.data = response.results;
      this.totalResults = response.total;
    });
  }
}
```

**Key Principle:** Table starts wide (all matches), narrows with filters. Pagination always reflects current filter state.

---

#### 1.3 Popped-Out Components: Cross-Window Sync
**Question:** How do popped-out components stay in sync when main window URL changes?

**Pattern: Main Window is Truth, BroadcastChannel is Messenger**

```typescript
// Main Window: Owns state, broadcasts changes
@Component({
  selector: 'app-main-window'
})
export class MainWindowComponent {
  private broadcastChannel = new BroadcastChannel('vehicle-discovery');

  constructor(private urlState: UrlStateService) {
    // Watch URL changes
    this.urlState.watchParams(['models', 'yearMin', 'yearMax']).subscribe(params => {
      // Broadcast to all pop-out windows
      this.broadcastChannel.postMessage({
        type: 'STATE_UPDATE',
        payload: params
      });
    });
  }

  popOutComponent(componentName: string): void {
    // Open new window
    const popout = window.open(
      `/popout/${componentName}`,
      componentName,
      'width=800,height=600'
    );

    // Send initial state
    setTimeout(() => {
      const currentState = this.urlState.getAllParams();
      this.broadcastChannel.postMessage({
        type: 'INITIAL_STATE',
        payload: currentState
      });
    }, 100);
  }
}

// Pop-Out Window: Listens for changes, never updates URL
@Component({
  selector: 'app-popout-results'
})
export class PopoutResultsComponent implements OnInit, OnDestroy {
  private broadcastChannel = new BroadcastChannel('vehicle-discovery');
  data: VehicleResult[] = [];

  ngOnInit(): void {
    // Listen for state updates from main window
    this.broadcastChannel.onmessage = (event) => {
      if (event.data.type === 'STATE_UPDATE' || event.data.type === 'INITIAL_STATE') {
        this.hydrateFromState(event.data.payload);
        this.fetchData(event.data.payload);
      }
    };

    // Request initial state
    this.broadcastChannel.postMessage({ type: 'REQUEST_STATE' });
  }

  ngOnDestroy(): void {
    this.broadcastChannel.close();
  }

  private hydrateFromState(params: Record<string, string>): void {
    // Update local component state (NOT URL)
    this.currentPage = parseInt(params.page || '1', 10);
    this.filters = this.parseFilters(params);
  }

  private fetchData(params: Record<string, string>): void {
    // Fetch data based on state from main window
    this.apiService.getVehicleDetails(this.filters).subscribe(response => {
      this.data = response.results;
    });
  }
}
```

**Key Principles:**
1. Main window URL is single source of truth
2. Pop-out windows never update their own URL
3. BroadcastChannel synchronizes state across windows
4. Pop-out window re-fetches data when main window state changes

---

## Goal 2: Plugin-Based Picker System

### Desired Outcome
Adding a new picker requires **only a configuration file** - no code changes to core application.

### Success Criteria
1. ✅ New picker added by creating single JSON/TypeScript config file
2. ✅ Picker configuration specifies API endpoint (can be different API per picker)
3. ✅ Picker configuration defines columns (headers, labels, filterable, sortable, orderable)
4. ✅ First column can be locked (always first, non-draggable)
5. ✅ System handles disparate APIs without core code changes

### Configuration Format

**File:** `src/app/config/pickers/manufacturer-model-picker.config.ts`

```typescript
export const ManufacturerModelPickerConfig: PickerConfig = {
  id: 'manufacturer-model-picker',
  name: 'Manufacturer & Model Picker',

  // API Configuration
  api: {
    endpoint: '/api/search/manufacturer-model-counts',
    method: 'GET',
    baseUrl: 'http://localhost:3000',  // Can be different API per picker
    headers: {
      // Custom headers if needed
    },
    paramMapper: (params: PickerQueryParams) => ({
      // Map generic picker params to API-specific params
      search: params.search,
      page: params.page,
      size: params.size
    }),
    responseTransformer: (response: any) => ({
      // Transform API response to standard PickerData format
      data: response.manufacturers.map(m => ({
        manufacturer: m.manufacturer,
        models: m.models
      })),
      total: response.total || response.manufacturers.length
    })
  },

  // Column Configuration
  columns: [
    {
      key: 'checkbox',
      label: '',
      type: 'selection',
      width: '50px',
      locked: true,          // Always first column, non-draggable
      filterable: false,
      sortable: false,
      visible: true
    },
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      type: 'string',
      width: '200px',
      locked: false,
      filterable: true,      // Search box in column header
      sortable: true,        // Click header to sort
      visible: true,
      defaultSort: 'asc'
    },
    {
      key: 'model',
      label: 'Model',
      type: 'string',
      width: '200px',
      locked: false,
      filterable: true,
      sortable: true,
      visible: true
    },
    {
      key: 'count',
      label: 'Vehicle Count',
      type: 'number',
      width: '150px',
      locked: false,
      filterable: false,
      sortable: true,
      visible: true
    }
  ],

  // Behavior
  multiSelect: true,        // Allow multiple row selection
  hierarchical: true,       // Manufacturer > Models (tree structure)
  applyButtonText: 'Apply Selection',
  clearButtonText: 'Clear All'
};
```

**Usage:**
```typescript
// In component
<app-generic-picker [config]="manufacturerModelPickerConfig"></app-generic-picker>

// Generic picker component handles everything:
// - API calls (to any endpoint)
// - Column rendering
// - Filtering/sorting/ordering
// - Selection state
// - Apply button logic
```

### Key Principles
1. **Configuration over code** - No code changes for new pickers
2. **API agnostic** - Each picker can use different API
3. **Flexible data transformation** - `responseTransformer` adapts any API format
4. **Column control** - Lock, filter, sort, order all configurable

---

## Goal 3: Configurable Results Tables

### Desired Outcome
Results tables are **as configurable as pickers**, with additional expandable row support.

### Success Criteria
1. ✅ Results table configured via single config file
2. ✅ Columns are filterable, sortable, orderable (same as picker)
3. ✅ Expandable rows supported (show sub-table)
4. ✅ Sub-table configuration embedded in parent config

### Configuration Format

**File:** `src/app/config/tables/vehicle-results-table.config.ts`

```typescript
export const VehicleResultsTableConfig: TableConfig = {
  id: 'vehicle-results-table',
  name: 'Vehicle Search Results',

  // API Configuration
  api: {
    endpoint: '/api/search/vehicle-details',
    method: 'GET',
    baseUrl: 'http://localhost:3000',
    paramMapper: (params: TableQueryParams) => ({
      models: params.models,
      page: params.page,
      size: params.size,
      yearMin: params.yearMin,
      yearMax: params.yearMax,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder
    }),
    responseTransformer: (response: any) => ({
      data: response.results,
      total: response.total,
      page: response.page,
      totalPages: response.totalPages
    })
  },

  // Column Configuration
  columns: [
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      type: 'string',
      width: '150px',
      locked: false,
      filterable: true,
      sortable: true,
      visible: true
    },
    {
      key: 'model',
      label: 'Model',
      type: 'string',
      width: '150px',
      locked: false,
      filterable: true,
      sortable: true,
      visible: true
    },
    {
      key: 'year',
      label: 'Year',
      type: 'number',
      width: '100px',
      locked: false,
      filterable: true,
      sortable: true,
      visible: true
    },
    {
      key: 'instance_count',
      label: 'VIN Count',
      type: 'number',
      width: '120px',
      locked: false,
      filterable: false,
      sortable: true,
      visible: true
    }
  ],

  // Expandable Row Configuration
  expandable: {
    enabled: true,
    expandIcon: 'pi pi-chevron-right',
    collapseIcon: 'pi pi-chevron-down',

    // Sub-table configuration
    subTable: {
      api: {
        endpoint: '/api/search/vehicle-instances/:vehicleId',
        method: 'GET',
        paramMapper: (parentRow: any, params: any) => ({
          vehicleId: parentRow.vehicle_id,
          count: params.count || 5
        }),
        responseTransformer: (response: any) => ({
          data: response.instances
        })
      },
      columns: [
        {
          key: 'vin',
          label: 'VIN',
          type: 'string',
          width: '180px'
        },
        {
          key: 'state',
          label: 'State',
          type: 'string',
          width: '80px'
        },
        {
          key: 'color',
          label: 'Color',
          type: 'string',
          width: '100px'
        },
        {
          key: 'value',
          label: 'Value',
          type: 'currency',
          width: '120px'
        },
        {
          key: 'mileage',
          label: 'Mileage',
          type: 'number',
          width: '120px'
        }
      ]
    }
  },

  // Pagination
  pagination: {
    enabled: true,
    pageSizeOptions: [10, 20, 50, 100],
    defaultPageSize: 20
  }
};
```

**Usage:**
```typescript
<app-generic-table [config]="vehicleResultsTableConfig"></app-generic-table>
```

### Key Principles
1. **Expandable rows as configuration** - Not a different component
2. **Sub-table is nested table config** - Same structure, nested
3. **Parent row data available** - Sub-table API can use parent row values
4. **On-demand loading** - Sub-table data fetched only when row expanded

---

## Goal 4: Base Table Design Decision

### Question
Should we have:
- **Option A:** `SimpleTable` + `ExpandableTable` (two separate components)
- **Option B:** `BaseTable` (one component with `expandable: boolean` parameter)
- **Option C:** `BaseTable` + specialized subclasses
- **Option D:** Picker as table variant

### Analysis

#### Option A: Two Separate Components
```typescript
<app-simple-table [columns]="columns" [data]="data"></app-simple-table>
<app-expandable-table [columns]="columns" [data]="data" [subTableConfig]="subConfig"></app-expandable-table>
```
**Pros:**
- ✅ Clear separation of concerns
- ✅ Simple table is simpler (no expandable logic)

**Cons:**
- ❌ Code duplication (column rendering, sorting, filtering)
- ❌ Two components to maintain
- ❌ Harder to add features (must update both)

---

#### Option B: Single BaseTable with Parameter ⭐ **RECOMMENDED**
```typescript
<app-base-table
  [config]="tableConfig"
  [expandable]="true"
  [subTableConfig]="subConfig"
></app-base-table>
```

**Pros:**
- ✅ Single component to maintain
- ✅ All features shared (sorting, filtering, column management)
- ✅ Easy to extend (add feature once)
- ✅ Configuration-driven (expandable comes from config)

**Cons:**
- ⚠️ Slightly more complex internally (but hidden from users)

**Implementation:**
```typescript
@Component({
  selector: 'app-base-table',
  template: `
    <table>
      <thead>
        <!-- Column headers -->
      </thead>
      <tbody>
        <ng-container *ngFor="let row of data">
          <tr (click)="onRowClick(row)">
            <td *ngIf="expandable">
              <i [class]="row.expanded ? collapseIcon : expandIcon"></i>
            </td>
            <td *ngFor="let col of columns">{{ row[col.key] }}</td>
          </tr>

          <!-- Expandable sub-table -->
          <tr *ngIf="expandable && row.expanded">
            <td [attr.colspan]="columns.length + 1">
              <app-base-table
                [config]="subTableConfig"
                [data]="row.subData"
                [expandable]="false"
              ></app-base-table>
            </td>
          </tr>
        </ng-container>
      </tbody>
    </table>
  `
})
export class BaseTableComponent {
  @Input() config: TableConfig;
  @Input() expandable: boolean = false;
  @Input() subTableConfig?: TableConfig;
}
```

---

#### Option C: BaseTable + Subclasses
```typescript
export class SimpleTable extends BaseTable { }
export class ExpandableTable extends BaseTable { }
export class PickerTable extends BaseTable { }
```

**Pros:**
- ✅ TypeScript inheritance benefits

**Cons:**
- ❌ Overkill for configuration-driven approach
- ❌ Inheritance is less flexible than composition

---

#### Option D: Picker as Table Variant

**Question:** Is a picker just a table with a checkbox column?

**Answer:** Yes! Picker = BaseTable + Selection Column

```typescript
export const PickerTableConfig: TableConfig = {
  ...VehicleResultsTableConfig,

  // Add selection column
  columns: [
    {
      key: 'selection',
      label: '',
      type: 'checkbox',
      width: '50px',
      locked: true,  // Always first
      filterable: false,
      sortable: false,
      visible: true
    },
    ...VehicleResultsTableConfig.columns
  ],

  // Picker-specific behavior
  selection: {
    enabled: true,
    mode: 'multi',  // or 'single'
    hierarchical: true,  // Parent-child checkboxes
    applyButton: {
      enabled: true,
      text: 'Apply Selection',
      onApply: (selectedRows) => {
        // Emit selected rows
      }
    }
  }
};

// Usage: Same component!
<app-base-table [config]="pickerTableConfig"></app-base-table>
```

**Key Insight:** Picker is **not a separate component** - it's a **table configuration**!

---

### Decision: **Option B + D**

**✅ DECISION:**
1. **Single `BaseTableComponent`** with `expandable` parameter (Option B)
2. **Picker is a table configuration** with selection enabled (Option D)

**No need for:**
- ❌ `SimpleTable`
- ❌ `ExpandableTable`
- ❌ `PickerTable`

**One component does it all:**
```typescript
// Simple table
<app-base-table [config]="simpleConfig"></app-base-table>

// Expandable table
<app-base-table [config]="expandableConfig"></app-base-table>

// Picker table
<app-base-table [config]="pickerConfig"></app-base-table>
```

**Where configuration differs:**
```typescript
// Simple: No expansion, no selection
expandable: { enabled: false }
selection: { enabled: false }

// Expandable: Expansion enabled, no selection
expandable: { enabled: true, subTable: {...} }
selection: { enabled: false }

// Picker: No expansion, selection enabled
expandable: { enabled: false }
selection: { enabled: true, mode: 'multi', applyButton: {...} }
```

---

---

## ⚠️ CRITICAL: Development Container Requirement

**ALL npm and ng commands MUST run inside the dev container, NEVER on Thor server directly**

```bash
# ❌ WRONG: Running on Thor server
cd /home/odin/projects/vehicle-discovery-platform
npm install  # DON'T DO THIS

# ✅ CORRECT: Running inside dev container
podman exec -it vehicle-discovery-platform-dev npm install

# ✅ CORRECT: Start Angular dev server
podman exec -it vehicle-discovery-platform-dev npm start -- --host 0.0.0.0 --port 4203

# ✅ CORRECT: Run Angular CLI commands
podman exec -it vehicle-discovery-platform-dev ng generate component my-component
```

**Why?**
- Container has correct Node.js version (18)
- Container has Angular CLI installed globally
- Container has all dependencies installed
- Container environment matches production
- Avoids version conflicts with Thor's system Node.js

---

## Implementation Order

### Phase 1: Foundation (Week 1-2)
1. ✅ Bootstrap Angular project (inside container!)
2. ✅ Install PrimeNG (inside container!)
3. ✅ Create `UrlStateService` (single foundation service)
4. ✅ Create basic routing structure
5. ✅ Implement BroadcastChannel service for pop-outs

### Phase 2: Base Table Component (Week 2-3)
1. Create `BaseTableComponent` with configuration support
2. Implement column rendering, sorting, filtering
3. Implement expandable rows (conditional)
4. Implement selection mode (conditional)
5. Test with simple data (hardcoded JSON)

### Phase 3: API Integration (Week 3-4)
1. Create `ApiService` with generic HTTP methods
2. Implement picker configurations (manufacturer-model)
3. Implement table configurations (vehicle results)
4. Connect BaseTable to live API
5. Test Start Wide, Go Narrow pattern

### Phase 4: Pop-Out Windows (Week 4-5)
1. Create pop-out window service
2. Implement BroadcastChannel synchronization
3. Test cross-window state updates
4. Implement window lifecycle (open, close, restore)

### Phase 5: Polish & Production (Week 5-6)
1. Column manager UI (show/hide columns)
2. localStorage persistence for table preferences
3. Error handling and loading states
4. Responsive design
5. Deployment to Kubernetes

---

## Success Metrics

### Developer Learning (Goal 1)
- ✅ Can implement new dumb component in <30 minutes
- ✅ Can explain URL-first to another developer
- ✅ Can debug cross-window sync issues

### Plugin System (Goal 2)
- ✅ New picker added in <1 hour (config only)
- ✅ Picker works with external API (not just internal)
- ✅ No core code changes needed for new picker

### Table System (Goal 3)
- ✅ Results table configured in <1 hour
- ✅ Expandable rows work reliably
- ✅ Sub-table fetches data on-demand

### Architecture Quality (Goal 4)
- ✅ BaseTable handles all table types
- ✅ <10% code duplication across table types
- ✅ Adding new table feature takes <2 hours

---

**Document Status:** Active Requirements
**Next Step:** Create Feature List with priorities (MoSCoW)
**Reference:** This document informs all ADRs and implementation decisions
