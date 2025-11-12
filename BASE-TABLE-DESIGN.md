# VDP BaseTable Design - Feature Parity with autos-prime-ng

**Document Date:** November 12, 2025
**Status:** CORRECTED - Design for Feature Parity
**Scope:** vdp's path to achieving feature parity with apn

---

## ⚠️ CORRECTION: Understanding Hierarchical Selection

**Previous Misconception:** Hierarchical selection = tri-state parent checkboxes with indeterminate states
**ACTUAL PATTERN:** Two configurable picker types with parent/child checkboxes on same row

Key corrections:
- ✅ KEEP hierarchical selection (required for pickers)
- ✅ Single-selector picker: Parent checkbox only
- ✅ Dual-selector picker: Parent AND child checkboxes on same row
- ✅ State matching: Parent state = child state when same row id
- ✅ NOT tri-state (parent indeterminate) - states always match
- ✅ ADDING ColumnManager component (for feature parity)
- ✅ Server-side pagination needed NOW

---

## Architecture: Configuration-Driven with Component Separation

vdp will adopt the **best of both approaches**:

### Configuration-Driven Design (from vdp BaseTable)
- ✅ Keep configuration objects for table behavior
- ✅ All variants (simple, expandable, results) via config
- ✅ Code-driven (not visual builders)

### Component Separation (from apn BaseDataTable + ColumnManager)
- ✅ BaseTable for data display and interactions
- ✅ ColumnManager for column visibility/reordering UI
- ✅ Clear separation of concerns

---

## Required Components for Feature Parity

### 1. BaseTable (Configuration-Driven)
**Status:** Partially complete, needs enhancements
**Size:** Currently 630 lines TS, will grow to ~1,000+

**Current Features** ✅
- Configuration-driven rendering
- Client-side sorting (recently added)
- Client-side filtering (recently added)
- Basic pagination state
- Simple row expansion (static data)

**Missing Features** ❌
- Server-side pagination
- Server-side sorting/filtering
- API data fetching integration

**Hierarchical Selection Patterns (KEEP, but clarify)** ✅
- Single-selector picker: Parent checkbox only (configurable)
- Dual-selector picker: Parent AND child on same row (configurable)
- State matching: When parent and child share same row id, states must match
- NOT tri-state: Parent state = child state (no indeterminate/partial states)

### 2. ColumnManager Component (NEW)
**Status:** Does not exist in vdp, needs to be ported/created
**Size:** ~300 lines (TS + HTML)

**Features Required** ✅
- Sidebar UI with PrimeNG PickList
- Column visibility toggle
- Drag-drop column reordering
- Column search/filter
- Reset to defaults
- Column dependency validation
- localStorage persistence

**Reference:** Already exists in apn at `/autos-prime-ng/frontend/src/app/shared/components/column-manager/`

---

## Feature Comparison Matrix (Target State)

| Feature | apn | Current vdp | Target vdp | Priority |
|---------|-----|-----|---|---|
| **Data Source** | | | | |
| Server-side fetch | ✅ | ❌ | ✅ | P0 |
| Pre-fetched data | ✅ | ✅ | ✅ | ✅ |
| API integration | ✅ | Stubbed | ✅ | P0 |
| **Sorting** | | | | |
| Client-side | ✅ | ✅ | ✅ | ✅ |
| Server-side | ✅ | ❌ | ✅ | P0 |
| Multiple columns | ✅ | ❌ | ✅ | P1 |
| **Filtering** | | | | |
| Client-side | ✅ | ✅ | ✅ | ✅ |
| Server-side | ✅ | ❌ | ✅ | P0 |
| Multiple columns | ✅ | ✅ | ✅ | ✅ |
| **Pagination** | | | | |
| Server-side | ✅ | ❌ | ✅ | P0 |
| Client-side | ✅ | Partial | ✅ | P0 |
| Page size options | ✅ | Hardcoded | ✅ | P1 |
| **Columns** | | | | |
| Visibility toggle | ✅ | Config-only | ✅ ColumnManager | P0 |
| Reordering | ✅ Drag-drop | ❌ | ✅ ColumnManager | P0 |
| Lock columns | ✅ | ❌ | ✅ | P1 |
| Custom templates | ✅ | ❌ | ✅ | P1 |
| **Selection** | | | | |
| Checkboxes | ✅ | ✅ Hierarchical | ✅ Hierarchical | ✅ |
| Single-selector | ✅ | ✅ | ✅ | ✅ |
| Dual-selector | ⚠️ | ✅ | ✅ | ✅ |
| State matching | N/A | ✅ | ✅ Parent=Child | ✅ |
| **Row Features** | | | | |
| Expansion | ✅ | ✅ Static | ✅ Sub-tables | P0 |
| Nested tables | ✅ | Basic | ✅ Full | P1 |
| **Persistence** | | | | |
| localStorage | ✅ | ❌ | ✅ ColumnManager | P0 |
| API state | ✅ | ❌ | ✅ | P1 |

---

## Implementation Roadmap

### Phase 1: Foundation (P0 Priority)
**Remove hierarchical selection, add server-side support**

1. **Remove from BaseTable** ❌
   - Delete hierarchical parent-child selection logic
   - Delete tri-state checkbox code
   - Delete dual checkbox display mode
   - Simplify to standard single/multi checkbox selection

2. **Enhance BaseTable** ✅
   - Complete server-side pagination
   - Add server-side sort/filter support
   - Integrate RequestCoordinator
   - Wire API data fetching
   - Support sub-table expansion (not hierarchical)

3. **Create ColumnManager** ✅
   - Port from apn or create vdp version
   - Sidebar UI with PickList
   - Visibility/reordering management
   - localStorage persistence
   - Integration with BaseTable

### Phase 2: Enhancement (P1 Priority)
**Polish and advanced features**

1. **Advanced Sorting**
   - Multi-column sort support
   - Sort direction indicators

2. **Custom Templates**
   - @ContentChild support
   - Custom cell rendering
   - Custom expansion templates

3. **Advanced Features**
   - Column locking
   - Column grouping
   - Advanced filtering UI

### Phase 3: Integration (P2 Priority)
**URL-first and persistence**

1. **URL-first State Management**
   - Integrate with UrlStateService
   - Persist sort/filter in URL
   - Hydrate from URL on load

2. **Server-side Persistence**
   - Save user preferences to backend
   - Load preferences on app init

---

## What TO Do & What NOT to Do

### ✅ KEEP Hierarchical Selection
- vdp pickers use two configurable patterns:
  - Single-selector: Parent checkbox only
  - Dual-selector: Parent AND child checkboxes on same row
- State matching rule: When parent and child share same row id, their states MUST match
- This is NOT tri-state (no indeterminate/partial states)

### ✅ ADD Column Management
- Must port/create ColumnManager
- Required for feature parity
- Users need to control visibility/order

### ✅ Implement Server-Side Features NOW
- Server-side pagination needed NOW
- Server-side sort/filter needed NOW
- These are P0, not future work

### ✅ Use Two-Component Architecture
- Need two components: BaseTable + ColumnManager
- Separation of concerns is important
- Configuration-driven design stays (vdp advantage)
- But components need clear responsibilities

---

## Configuration-Driven Design (Keeping This)

Keep the config-driven approach for:
- **Table modes** (simple, expandable, selector)
- **Column definitions** (sortable, filterable, visible, type)
- **Selection config** (enabled, mode, URL persistence)
- **Pagination config** (pageSize, options, API endpoint)
- **Expansion config** (sub-table columns, API endpoint)

This is vdp's strength vs apn's @Input/@Output approach.

---

## Files to Create/Modify

### Create
```
frontend/src/app/shared/components/column-manager/
├── column-manager.component.ts    (Port from apn or new)
├── column-manager.component.html  (Port from apn or new)
├── column-manager.component.scss  (Port from apn or new)
└── column-manager.component.spec.ts
```

### Modify BaseTable
```
frontend/src/app/shared/components/base-table/
├── base-table.component.ts       (Remove hierarchical, add server-side)
├── base-table.component.html     (Simplify, add ColumnManager)
└── base-table.component.scss     (Keep sort/filter styles)
```

### Create/Update Models
```
frontend/src/app/shared/models/
├── table-config.model.ts         (Already exists, update as needed)
└── table-data-source.ts          (Port from apn or create)
```

---

## Architectural Differences from apn (By Design)

### vdp Uses Config, apn Uses @Inputs
**vdp (Keep This):**
```typescript
// One config object
const tableConfig = {
  id: 'results-table',
  columns: [...],
  selection: {...},
  pagination: {...},
  api: {...}
}

// One component input
<app-base-table [config]="tableConfig"></app-base-table>
```

**apn (Don't Copy):**
```typescript
// Multiple @Inputs
<app-base-data-table
  [columns]="columns"
  [dataSource]="dataSource"
  [queryParams]="queryParams"
  [expandable]="true"
  [showColumnManagement]="true"
  ...
></app-base-data-table>
```

This is actually an advantage for vdp - cleaner API, easier to compose.

---

## Summary of Changes

### DO ✅
✅ Keep configuration-driven design (vdp's advantage)
✅ Keep hierarchical selection (required for pickers)
✅ Support single-selector picker (parent checkbox only)
✅ Support dual-selector picker (parent + child on same row, states match)
✅ Add ColumnManager component (required for feature parity)
✅ Add server-side pagination (needed now)
✅ Add server-side sort/filter (needed now)
✅ Keep BaseTable and ColumnManager separate
✅ Integrate RequestCoordinator
✅ Support sub-table expansion (not hierarchical parents)

### DON'T ❌
❌ Postpone server-side features
❌ Avoid column management UI
❌ Try to match apn's @Input-heavy API (keep config approach)
❌ Use tri-state (parent indeterminate) - states must match parent=child
❌ Remove hierarchical selection patterns

---

## Success Criteria

vdp will have achieved feature parity when:
- [ ] ColumnManager component exists and works
- [ ] BaseTable supports server-side pagination
- [ ] BaseTable supports server-side sort/filter
- [ ] Single-selector picker works (parent checkbox only)
- [ ] Dual-selector picker works (parent + child on same row, states match)
- [ ] Parent state = child state constraint enforced (not tri-state)
- [ ] Column visibility/reordering works
- [ ] Preferences persist to localStorage
- [ ] Configuration-driven design maintained
- [ ] Both pickers and results tables work with same components

---

## Conclusion

vdp's **configuration-driven approach is superior** to apn's @Input-heavy API. Maintain that advantage while achieving feature parity:

**Keep:**
- Configuration-driven design (vdp advantage)
- Hierarchical selection patterns (required for pickers)
- Two-component separation (BaseTable + ColumnManager)

**Add:**
- ColumnManager component (feature parity)
- Server-side pagination/sort/filter (P0 priority)

**Clarify:**
- Single-selector picker: Parent checkbox only
- Dual-selector picker: Parent + child on same row with state matching
- Parent state = child state (not tri-state/indeterminate)

Target: Feature parity with apn while maintaining vdp's superior configuration-driven architecture.
