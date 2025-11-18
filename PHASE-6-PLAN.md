# Phase 6: Sub-Table Expansion (Expandable Rows)

**Status:** PLANNING
**Date:** November 17, 2025
**Phase:** 6 of 6 (Roadmap Phase 5)
**Prerequisites:** Phases 1-5 Complete ✅

---

## Executive Summary

**Goal:** Implement expandable row functionality with nested sub-tables for displaying hierarchical data (e.g., vehicle details with expandable VIN instances).

**Scope:** Complete the partially-implemented expandable row feature in BaseTableComponent.

**Current State:**
- ✅ Configuration model exists (`ExpandableConfig` interface)
- ✅ Example configuration exists (`EXPANDABLE_RESULTS_TABLE_CONFIG`)
- ✅ TypeScript logic partially implemented (static data only)
- ❌ HTML template missing expandable row rendering
- ❌ API loading not implemented
- ❌ Not tested

**Success Criteria:**
- Expandable rows render correctly with sub-tables
- Static sub-table data works (from parent row property)
- Dynamic sub-table data works (on-demand API loading)
- Recursive BaseTable rendering (sub-table uses same component)
- Expansion state managed in component (session-only, NOT in URL)
- Integration testing complete

---

## Architecture Review

### Expandable Rows vs Hierarchical Selection

**Important Distinction:**

| Feature | Hierarchical Selection (Phase 4) | Expandable Rows (Phase 6) |
|---------|----------------------------------|---------------------------|
| Purpose | Parent-child checkbox relationships (Manufacturer → Model) | Show/hide nested detail data (Vehicle → VIN Instances) |
| Data Structure | Flat array with parent/child keys | Nested data in parent row or fetched via API |
| UI Pattern | Checkboxes with parent-child logic | Expand/collapse icon + sub-table |
| State Management | URL-persisted (selection state) | Session-only (expansion state) |
| Example | Ford (parent) → F-150, Mustang (children) | 2023 Ford F-150 → [VIN1, VIN2, VIN3] |

**They are INDEPENDENT features** and can be combined:
- Expandable picker: Hierarchical selection + Expandable rows
- Results table: No selection + Expandable rows
- Picker table: Hierarchical selection only (no expansion)

### Configuration Model

Already defined in [table-config.model.ts:109-126](frontend/src/app/shared/models/table-config.model.ts#L109-L126):

```typescript
export interface ExpandableConfig {
  enabled: boolean;                           // Enable row expansion
  expandIcon?: string;                        // Default: 'pi pi-chevron-right'
  collapseIcon?: string;                      // Default: 'pi pi-chevron-down'

  subTable?: {
    columns: TableColumn[];                   // Sub-table column definitions
    dataKey: string;                          // Property name for sub-data in parent row
    api?: {                                   // OR fetch sub-data from API
      endpoint: string;                       // API endpoint
      paramMapper?: (parentRow: any) => any;  // Map parent row to API params
    };
  };
}
```

**Data Source Options:**

**Option 1: Static Data (from parent row)**
```typescript
// Parent row contains sub-data
{
  manufacturer: 'Ford',
  model: 'F-150',
  year: 2023,
  vin_instances: [                     // ← Sub-table data
    { vin: 'ABC123', state: 'CA', ... },
    { vin: 'XYZ789', state: 'TX', ... }
  ]
}

// Config
expandable: {
  enabled: true,
  subTable: {
    dataKey: 'vin_instances',          // Property name
    columns: [...]
  }
}
```

**Option 2: Dynamic Data (on-demand API)**
```typescript
// Parent row
{
  manufacturer: 'Ford',
  model: 'F-150',
  year: 2023,
  instance_count: 145                  // Count only, not full data
}

// Config
expandable: {
  enabled: true,
  subTable: {
    api: {
      endpoint: '/api/vehicles/instances',
      paramMapper: (row) => ({
        manufacturer: row.manufacturer,
        model: row.model,
        year: row.year
      })
    },
    columns: [...]
  }
}
```

---

## Current Implementation Status

### TypeScript Logic (BaseTableComponent)

**Already Implemented:**

1. **Expansion State Tracking** ([base-table.component.ts:85](frontend/src/app/shared/components/base-table/base-table.component.ts#L85))
   ```typescript
   expandedRows: Set<any> = new Set();
   ```

2. **Sub-Table Data Cache** ([base-table.component.ts:86](frontend/src/app/shared/components/base-table/base-table.component.ts#L86))
   ```typescript
   subTableData: Map<any, any[]> = new Map();
   ```

3. **Row Expansion Check** ([base-table.component.ts:736](frontend/src/app/shared/components/base-table/base-table.component.ts#L736))
   ```typescript
   isRowExpanded(row: any): boolean {
     return this.expandedRows.has(row);
   }
   ```

4. **Toggle Expansion** ([base-table.component.ts:742-753](frontend/src/app/shared/components/base-table/base-table.component.ts#L742-L753))
   ```typescript
   toggleRowExpansion(row: any): void {
     if (this.isRowExpanded(row)) {
       this.expandedRows.delete(row);
       console.log('[BaseTable] Row collapsed');
     } else {
       this.expandedRows.add(row);
       this.loadSubTableData(row);
       console.log('[BaseTable] Row expanded');
     }
   }
   ```

5. **Load Sub-Table Data (PARTIAL)** ([base-table.component.ts:762-784](frontend/src/app/shared/components/base-table/base-table.component.ts#L762-L784))
   ```typescript
   private loadSubTableData(parentRow: any): void {
     if (!this.config.expandable?.subTable) {
       return;
     }

     const subTableConfig = this.config.expandable.subTable;

     // ✅ Option 1: Data in parent row (IMPLEMENTED)
     if (subTableConfig.dataKey && parentRow[subTableConfig.dataKey]) {
       console.log('[BaseTable] Sub-table data found in parent row');
       this.subTableData.set(parentRow, parentRow[subTableConfig.dataKey]);
       return;
     }

     // ❌ Option 2: Fetch from API (NOT IMPLEMENTED)
     if (subTableConfig.api) {
       console.log('[BaseTable] Sub-table API loading not yet implemented');
       // TODO: Implement API loading in next iteration ← PHASE 6 TASK
       return;
     }

     console.warn('[BaseTable] No sub-table data source configured');
   }
   ```

6. **Get Sub-Table Data** ([base-table.component.ts:789-791](frontend/src/app/shared/components/base-table/base-table.component.ts#L789-L791))
   ```typescript
   getSubTableData(parentRow: any): any[] {
     return this.subTableData.get(parentRow) || [];
   }
   ```

**Not Yet Implemented:**
- ❌ API loading logic
- ❌ Loading state for on-demand sub-table fetching

### HTML Template

**Current Status:** Template exists (252 lines) but MISSING expandable row rendering.

**Backup File Available:** `base-table.component.html.backup` contains working expandable template ([lines 138-155](frontend/src/app/shared/components/base-table/base-table.component.html.backup#L138-L155))

**Required Template Pattern:**
```html
<!-- Parent row with expand button -->
<tr>
  <!-- Expand button column -->
  <td *ngIf="config.expandable?.enabled">
    <button
      pButton
      [icon]="isRowExpanded(row) ? (config.expandable.collapseIcon || 'pi pi-chevron-down') : (config.expandable.expandIcon || 'pi pi-chevron-right')"
      class="p-button-text p-button-sm"
      (click)="toggleRowExpansion(row)">
    </button>
  </td>

  <!-- Data columns -->
  ...
</tr>

<!-- Expanded sub-table row -->
<tr *ngIf="isRowExpanded(row) && config.expandable?.enabled" class="expanded-row">
  <td [attr.colspan]="getVisibleColumns().length + extraColumnsCount">
    <div class="sub-table-container">
      <!-- Recursive BaseTable for sub-data -->
      <app-base-table
        *ngIf="config.expandable.subTable"
        [config]="{
          id: config.id + '-sub',
          columns: config.expandable.subTable.columns,
          data: getSubTableData(row),
          striped: true,
          size: 'small'
        }">
      </app-base-table>
    </div>
  </td>
</tr>
```

**Key Features:**
- Expand/collapse icon toggles based on `isRowExpanded(row)`
- Expanded row spans all columns (colspan calculation)
- Sub-table rendered using recursive `<app-base-table>` component
- Sub-table data retrieved via `getSubTableData(row)`
- Compact styling (`size: 'small'`)

---

## Phase 6 Tasks

### Step 6.1: Restore Expandable Row Template ⏳

**Goal:** Add expandable row rendering to BaseTableComponent HTML template.

**Tasks:**
1. Review backup file (`base-table.component.html.backup`)
2. Identify where to add expandable row template in current HTML
3. Add expand button column to table headers
4. Add expand button to table body rows
5. Add expanded sub-table row template
6. Calculate correct colspan for expanded row
7. Add CSS styles for expanded rows

**Files to Modify:**
- `frontend/src/app/shared/components/base-table/base-table.component.html`
- `frontend/src/app/shared/components/base-table/base-table.component.scss`

**Technical Considerations:**
- Must handle all table modes (single-selector, dual-selector, simple)
- Expand column appears BEFORE checkbox columns
- Colspan must account for: expand column + checkbox columns + data columns
- Sub-table receives simplified config (no pagination, smaller size)

**Acceptance Criteria:**
- [ ] Expand icon appears when `config.expandable.enabled = true`
- [ ] Icon toggles between expand/collapse states
- [ ] Clicking expand button toggles row expansion
- [ ] Expanded row shows sub-table with correct data
- [ ] Sub-table renders using recursive BaseTable
- [ ] Collapsed rows hide sub-table content

---

### Step 6.2: Implement API Loading for Sub-Tables ⏳

**Goal:** Enable on-demand loading of sub-table data from API.

**Current Code ([base-table.component.ts:776-780](frontend/src/app/shared/components/base-table/base-table.component.ts#L776-L780)):**
```typescript
// Option 2: Fetch from API
if (subTableConfig.api) {
  console.log('[BaseTable] Sub-table API loading not yet implemented');
  // TODO: Implement API loading in next iteration
  return;
}
```

**Implementation:**
```typescript
// Option 2: Fetch from API
if (subTableConfig.api) {
  console.log('[BaseTable] Fetching sub-table data from API');

  // Build API params from parent row
  const apiParams = subTableConfig.api.paramMapper
    ? subTableConfig.api.paramMapper(parentRow)
    : {};

  // Set loading state for this row
  this.subTableLoading.set(parentRow, true);

  // Fetch data from API
  this.apiService.get<any, any[]>(
    // TODO: Need to support direct endpoint or apiConfigRef
    subTableConfig.api.endpoint,
    apiParams
  )
  .pipe(takeUntil(this.destroy$))
  .subscribe({
    next: (data) => {
      this.subTableData.set(parentRow, data);
      this.subTableLoading.delete(parentRow);
      console.log('[BaseTable] Sub-table data loaded:', data.length);
    },
    error: (error) => {
      console.error('[BaseTable] Sub-table API error:', error);
      this.subTableLoading.delete(parentRow);
      this.subTableData.set(parentRow, []); // Empty on error
    }
  });

  return;
}
```

**Additional State:**
```typescript
// Add to component class
subTableLoading: Map<any, boolean> = new Map();

// Helper method
isSubTableLoading(row: any): boolean {
  return this.subTableLoading.get(row) || false;
}
```

**Template Update:**
```html
<!-- Loading state in expanded row -->
<tr *ngIf="isRowExpanded(row) && config.expandable?.enabled" class="expanded-row">
  <td [attr.colspan]="getVisibleColumns().length + extraColumnsCount">
    <div class="sub-table-container">
      <!-- Loading spinner -->
      <div *ngIf="isSubTableLoading(row)" class="sub-table-loading">
        <p-progressSpinner [style]="{width: '30px', height: '30px'}"></p-progressSpinner>
        <span>Loading...</span>
      </div>

      <!-- Sub-table -->
      <app-base-table
        *ngIf="!isSubTableLoading(row) && config.expandable.subTable"
        [config]="..."
        [data]="getSubTableData(row)">
      </app-base-table>
    </div>
  </td>
</tr>
```

**API Configuration Enhancement:**

**Option A: Direct Endpoint (Simpler)**
```typescript
subTable: {
  api: {
    endpoint: '/api/vehicles/instances',
    paramMapper: (row) => ({ vehicleId: row.id })
  }
}
```

**Option B: apiConfigRef (Configuration-Driven - RECOMMENDED)**
```typescript
subTable: {
  apiConfigRef: {
    configId: 'vehicles',
    endpointId: 'vinInstances'
  },
  paramMapper: (row) => ({
    manufacturer: row.manufacturer,
    model: row.model,
    year: row.year
  })
}
```

**Decision Point:** Use Option B (apiConfigRef) to maintain consistency with Phase 5 generic API architecture.

**Files to Modify:**
- `frontend/src/app/shared/components/base-table/base-table.component.ts`
- `frontend/src/app/shared/components/base-table/base-table.component.html`
- `frontend/src/app/shared/models/table-config.model.ts` (add apiConfigRef to SubTableConfig)

**Acceptance Criteria:**
- [ ] API loading triggered on row expansion
- [ ] Loading spinner displayed while fetching
- [ ] Sub-table data displayed after successful load
- [ ] Error handling (empty state on API failure)
- [ ] No duplicate API calls (check if data already loaded)
- [ ] Supports both direct endpoint and apiConfigRef patterns

---

### Step 6.3: Create Expandable Demo Configuration ⏳

**Goal:** Create demo configuration and test page for expandable rows.

**New File:** `frontend/src/app/config/tables/expandable-demo.config.ts`

```typescript
/*
  EXPANDABLE ROW DEMO CONFIGURATION

  PURPOSE:
  Demonstrates expandable row functionality with static sub-table data.

  FEATURES:
  - Expandable vehicle rows
  - Static VIN instance sub-table data (from DemoApiService)
  - No selection (results table mode)
  - Demonstrates recursive BaseTable rendering
*/

import { TableConfig } from '../../shared/models/table-config.model';

export const EXPANDABLE_DEMO_CONFIG: TableConfig = {
  id: 'expandable-demo-table',

  // Parent table columns (vehicle summary)
  columns: [
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      type: 'text',
      width: '150px',
      sortable: true,
      visible: true
    },
    {
      key: 'model',
      label: 'Model',
      type: 'text',
      width: '150px',
      sortable: true,
      visible: true
    },
    {
      key: 'year',
      label: 'Year',
      type: 'number',
      width: '100px',
      sortable: true,
      visible: true
    },
    {
      key: 'instance_count',
      label: 'VIN Count',
      type: 'number',
      width: '100px',
      sortable: true,
      visible: true
    }
  ],

  // EXPANDABLE CONFIGURATION
  expandable: {
    enabled: true,
    expandIcon: 'pi pi-chevron-right',
    collapseIcon: 'pi pi-chevron-down',

    // Sub-table (VIN instances)
    subTable: {
      dataKey: 'vin_instances',  // Static data from parent row

      columns: [
        {
          key: 'vin',
          label: 'VIN',
          type: 'text',
          width: '180px',
          visible: true
        },
        {
          key: 'registered_state',
          label: 'State',
          type: 'text',
          width: '80px',
          visible: true
        },
        {
          key: 'exterior_color',
          label: 'Color',
          type: 'text',
          width: '100px',
          visible: true
        },
        {
          key: 'estimated_value',
          label: 'Value',
          type: 'currency',
          width: '100px',
          visible: true
        }
      ]
    }
  },

  // Styling
  striped: true,
  bordered: false,
  hoverable: true,
  size: 'normal',
  emptyMessage: 'No vehicles found'
};
```

**Demo Data Enhancement:**

Update `DemoApiService` to include VIN instances in vehicle results:

```typescript
// In demo-api.service.ts
getVehicleDetails(): Observable<VehicleResult[]> {
  return of([
    {
      manufacturer: 'Ford',
      model: 'F-150',
      year: 2023,
      body_class: 'Pickup',
      instance_count: 3,

      // Add VIN instances for expandable demo
      vin_instances: [
        {
          vin: '1FTFW1E50NFA12345',
          registered_state: 'TX',
          exterior_color: 'Blue',
          estimated_value: 42000,
          mileage: 15000,
          condition_rating: 4,
          title_status: 'Clean'
        },
        {
          vin: '1FTFW1E50NFA67890',
          registered_state: 'CA',
          exterior_color: 'Red',
          estimated_value: 38000,
          mileage: 28000,
          condition_rating: 3,
          title_status: 'Clean'
        },
        // ... more VINs
      ]
    },
    // ... more vehicles
  ]);
}
```

**Demo Page Update:**

Add new demo section to `demo.component.ts`:

```typescript
// Add to demo.component.ts
import { EXPANDABLE_DEMO_CONFIG } from '../config/tables/expandable-demo.config';

export class DemoComponent {
  // ... existing configs ...

  expandableDemoConfig = EXPANDABLE_DEMO_CONFIG;
  expandableDemoData: any[] = [];

  ngOnInit(): void {
    // ... existing initialization ...

    // Load expandable demo data
    this.demoApiService.getVehicleDetails().subscribe(data => {
      this.expandableDemoData = data;
    });
  }
}
```

**Template Update:**

```html
<!-- Add to demo.component.html -->
<section class="demo-section">
  <h2>Expandable Rows Demo</h2>
  <p>Click chevron icon to expand/collapse vehicle rows and view VIN instances.</p>

  <app-base-table
    [config]="expandableDemoConfig"
    [data]="expandableDemoData">
  </app-base-table>
</section>
```

**Files to Create/Modify:**
- Create: `frontend/src/app/config/tables/expandable-demo.config.ts`
- Modify: `frontend/src/app/demo/demo-api.service.ts`
- Modify: `frontend/src/app/features/demo/demo.component.ts`
- Modify: `frontend/src/app/features/demo/demo.component.html`

**Acceptance Criteria:**
- [ ] New demo section appears on demo page
- [ ] Table displays vehicle summary data
- [ ] Expand icons appear in first column
- [ ] Clicking expand shows VIN instances
- [ ] Sub-table renders with 4 columns (VIN, State, Color, Value)
- [ ] Clicking collapse hides sub-table
- [ ] Multiple rows can be expanded simultaneously

---

### Step 6.4: Integration Testing ⏳

**Goal:** Systematically verify expandable row functionality.

**Test Plan:**

**Test 6.1: Static Data Expansion**
- Action: Click expand icon on first vehicle row
- Expected: Sub-table appears with VIN instances
- Verify: Correct number of VIN rows displayed
- Verify: Sub-table columns match configuration

**Test 6.2: Multiple Row Expansion**
- Action: Expand 3 different vehicle rows
- Expected: All 3 rows show expanded sub-tables
- Verify: Each sub-table shows correct data for that vehicle

**Test 6.3: Collapse Functionality**
- Action: Click collapse icon on expanded row
- Expected: Sub-table disappears
- Verify: Other expanded rows remain expanded

**Test 6.4: Sort Parent Table**
- Setup: Expand 2 rows
- Action: Sort parent table by manufacturer
- Expected: Parent rows re-order, expanded state preserved
- Note: Expansion state is object reference-based, may need key-based tracking

**Test 6.5: Filter Parent Table**
- Setup: Expand 2 rows
- Action: Filter parent table
- Expected: Only matching rows visible, expansion state preserved for visible rows

**Test 6.6: Recursive Rendering**
- Verify: Sub-table uses BaseTableComponent
- Verify: Sub-table has compact styling (`size: 'small'`)
- Verify: Sub-table has no pagination
- Verify: Sub-table has striped rows

**Test 6.7: API Loading (Phase 6.2 only)**
- Setup: Configure sub-table with API endpoint
- Action: Expand row with no cached data
- Expected: Loading spinner appears
- Expected: API call triggered with correct params
- Expected: Sub-table displays after load completes

**Test 6.8: Error Handling (Phase 6.2 only)**
- Setup: Configure sub-table with failing API endpoint
- Action: Expand row
- Expected: Error handled gracefully
- Expected: Empty state message or error icon displayed

**Files to Update:**
- Update: `SESSION-START.md` (add Phase 6 test results)
- Create: Test report document if needed

**Acceptance Criteria:**
- [ ] All 6 static data tests pass
- [ ] All 2 API tests pass (if implementing API loading)
- [ ] No console errors
- [ ] Expansion state behaves predictably

---

### Step 6.5: Documentation & Cleanup ⏳

**Goal:** Document Phase 6 implementation and update project docs.

**Tasks:**

1. **Update SESSION-START.md**
   - Add Phase 6 to completion tree
   - Update current status to "Phase 6 Complete"
   - Add test results summary

2. **Update IMPLEMENTATION-ROADMAP.md**
   - Mark "Phase 5: Sub-Table Expansion" as complete
   - Add implementation notes

3. **Create Phase 6 Summary**
   - Copy pattern from PHASE-5-SUMMARY.md
   - Document what was implemented
   - Include code examples

4. **Update Table Architecture Docs**
   - Add expandable row examples to TABLE_ARCHITECTURE_README.md
   - Update TABLE_ARCHITECTURE_QUICK_REFERENCE.md

5. **Code Comments**
   - Ensure all new methods have JSDoc comments
   - Document expansion state management approach
   - Note session-only state (not URL-persisted)

6. **Delete Backup File**
   - Remove `base-table.component.html.backup` (template code restored)

**Files to Modify:**
- `SESSION-START.md`
- `IMPLEMENTATION-ROADMAP.md`
- `frontend/src/app/shared/components/TABLE_ARCHITECTURE_README.md`
- `frontend/src/app/shared/components/TABLE_ARCHITECTURE_QUICK_REFERENCE.md`

**Files to Create:**
- `PHASE-6-SUMMARY.md`

**Files to Delete:**
- `frontend/src/app/shared/components/base-table/base-table.component.html.backup`

**Acceptance Criteria:**
- [ ] All documentation updated
- [ ] Code comments complete
- [ ] No orphaned backup files
- [ ] Phase 6 marked complete in session docs

---

## URL-First Architecture Compliance

### Expansion State: Session-Only (NOT URL-Persisted)

**Decision:** Expansion state is stored in component memory, NOT in URL.

**Rationale:**
1. **User Experience:** Expansion is a temporary UI state (user intent to view details)
2. **URL Pollution:** Tracking expanded rows in URL creates verbose, confusing URLs
3. **Transient Nature:** Unlike selections (persist across navigation), expansion is session-scoped
4. **Performance:** Avoids URL updates on every expand/collapse action

**Comparison:**

| State Type | Persistence | Reason |
|------------|-------------|--------|
| Selection (Phase 4) | URL | User intent to work with specific items, shareable |
| Sort (Phase 1) | URL | Affects data view, shareable preference |
| Filter (Phase 1) | URL | Affects data view, shareable criteria |
| Pagination (Phase 1) | URL | Affects data view, bookmarkable page |
| Expansion (Phase 6) | Session-only | Temporary detail view, not shareable |

**Implementation:**
```typescript
// Component memory (NOT in URL)
expandedRows: Set<any> = new Set();
subTableData: Map<any, any[]> = new Map();

// State cleared on navigation
ngOnDestroy(): void {
  this.expandedRows.clear();
  this.subTableData.clear();
}
```

**Edge Case:** If user refreshes page, all rows collapse (expected behavior).

---

## Technical Decisions

### Decision 1: Recursive BaseTable for Sub-Tables

**Approach:** Sub-tables render using the same `<app-base-table>` component.

**Pros:**
- Code reuse (no duplicate sub-table logic)
- Consistent rendering between parent and sub-tables
- Sub-tables inherit all BaseTable features (sort, filter, etc.)
- Supports nested expansion (sub-sub-tables if needed)

**Cons:**
- Circular component reference (component renders itself)
- Potential performance impact (more component instances)

**Implementation:**
```html
<app-base-table
  [config]="{
    id: config.id + '-sub',
    columns: config.expandable.subTable.columns,
    data: getSubTableData(row),
    striped: true,
    size: 'small',
    pagination: { enabled: false }  // Disable pagination for sub-tables
  }">
</app-base-table>
```

**Limitation:** Angular requires components to be properly imported. BaseTable importing itself should work since it's already declared in the module.

---

### Decision 2: API Configuration Pattern

**Approach:** Support both direct endpoints and apiConfigRef (Phase 5 pattern).

**SubTableConfig Enhancement:**
```typescript
subTable?: {
  columns: TableColumn[];
  dataKey?: string;  // Static data from parent row

  // API Option 1: Direct endpoint (simpler)
  api?: {
    endpoint: string;
    paramMapper?: (parentRow: any) => any;
  };

  // API Option 2: Configuration reference (recommended)
  apiConfigRef?: {
    configId: string;
    endpointId: string;
    paramMapper?: (parentRow: any) => any;
  };
};
```

**Usage:**
```typescript
// Option 1: Direct endpoint
expandable: {
  subTable: {
    api: {
      endpoint: '/api/vehicles/instances',
      paramMapper: (row) => ({ vehicleId: row.id })
    }
  }
}

// Option 2: Configuration reference (preferred)
expandable: {
  subTable: {
    apiConfigRef: {
      configId: 'vehicles',
      endpointId: 'vinInstances'
    },
    paramMapper: (row) => ({
      manufacturer: row.manufacturer,
      model: row.model,
      year: row.year
    })
  }
}
```

**Rationale:** Maintain consistency with Phase 5 generic API architecture while allowing simpler direct endpoints for basic use cases.

---

### Decision 3: Expansion State Key

**Problem:** How to track which rows are expanded when data re-sorts/re-filters?

**Options:**

**Option A: Object Reference (Current)**
```typescript
expandedRows: Set<any> = new Set();
// Uses row object identity
```
- Pro: Simple, no key generation needed
- Con: Breaks when data array is replaced (sort/filter)

**Option B: Generated Key**
```typescript
expandedRows: Set<string> = new Set();
// Generate key from row data
private getRowKey(row: any): string {
  return `${row.manufacturer}|${row.model}|${row.year}`;
}
```
- Pro: Survives data transformations
- Con: Requires unique key configuration

**Decision:** Start with Option A (object reference) for Phase 6.1-6.3. If testing reveals issues with sort/filter, upgrade to Option B in Phase 6.4.

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Circular component reference breaks module | Low | High | Test immediately; Angular supports this pattern |
| API loading introduces race conditions | Medium | Medium | Use takeUntil + loading state map |
| Sub-table data too large (performance) | Low | Medium | Add pagination support to sub-tables if needed |
| Expansion state lost on sort/filter | Medium | Low | Implement key-based expansion tracking (Decision 3) |
| Colspan calculation incorrect | Low | Low | Calculate dynamically based on config |

---

## Success Metrics

**Functional Completeness:**
- ✅ Static sub-table data works
- ✅ Expand/collapse UI functions correctly
- ✅ Recursive BaseTable rendering works
- ✅ API loading for sub-tables works (if implemented)
- ✅ Loading states handled gracefully
- ✅ Error states handled gracefully

**Code Quality:**
- ✅ No TypeScript errors
- ✅ No console warnings/errors
- ✅ All methods documented with JSDoc
- ✅ Follows existing code patterns

**Testing:**
- ✅ All integration tests pass
- ✅ Works in Chrome, Firefox, Safari
- ✅ Works with different table configurations (picker, results, etc.)

**Documentation:**
- ✅ SESSION-START.md updated
- ✅ Phase 6 summary created
- ✅ Architecture docs updated
- ✅ Code comments complete

---

## Next Steps After Phase 6

**Phase 7 Candidates:**

1. **Search Page Implementation**
   - Wire up real search component
   - Connect to vehicle API
   - Implement expandable results table

2. **Workshop Page (Drag-and-Drop Layout)**
   - Grid-based layout system
   - Draggable panels
   - Pop-out windows with BroadcastChannel sync

3. **Performance Optimization**
   - Virtual scrolling for large datasets
   - Lazy loading for sub-tables
   - Request caching improvements

4. **Additional Table Features**
   - Column resizing (drag column borders)
   - Column freezing (sticky columns)
   - Export to CSV/Excel
   - Print view

**Priority Decision:** Defer to odin (Project Manager) for Phase 7 direction.

---

## Appendix: File Checklist

**Files to Create:**
- [ ] `PHASE-6-SUMMARY.md`
- [ ] `frontend/src/app/config/tables/expandable-demo.config.ts`

**Files to Modify:**
- [ ] `frontend/src/app/shared/components/base-table/base-table.component.html` (add expandable template)
- [ ] `frontend/src/app/shared/components/base-table/base-table.component.ts` (implement API loading)
- [ ] `frontend/src/app/shared/components/base-table/base-table.component.scss` (add styles)
- [ ] `frontend/src/app/shared/models/table-config.model.ts` (enhance SubTableConfig)
- [ ] `frontend/src/app/demo/demo-api.service.ts` (add VIN instances)
- [ ] `frontend/src/app/features/demo/demo.component.ts` (add demo config)
- [ ] `frontend/src/app/features/demo/demo.component.html` (add demo section)
- [ ] `SESSION-START.md` (update status)
- [ ] `IMPLEMENTATION-ROADMAP.md` (mark complete)
- [ ] `frontend/src/app/shared/components/TABLE_ARCHITECTURE_README.md` (add examples)
- [ ] `frontend/src/app/shared/components/TABLE_ARCHITECTURE_QUICK_REFERENCE.md` (add reference)

**Files to Delete:**
- [ ] `frontend/src/app/shared/components/base-table/base-table.component.html.backup`

---

**Last Updated:** November 17, 2025
**Status:** READY TO BEGIN
**First Task:** Step 6.1 - Restore Expandable Row Template
