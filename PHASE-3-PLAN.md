# Phase 3: Column Management Implementation Plan

**Status:** Starting Phase 3 Implementation
**Date:** November 12, 2025
**Scope:** Create ColumnManager component for column visibility, reordering, and width management

---

## Overview

Phase 3 adds column management capabilities to match feature parity with apn's two-component architecture (BaseTable + ColumnManager). Users can control which columns are visible, reorder them, and adjust column widths. Preferences persist to localStorage.

### Key Principle: Separation of Concerns
```
BaseTable = Data Display + Selection + Pagination
ColumnManager = Column Configuration + UI Control
```

---

## Phase 3 Architecture

### Components to Create/Integrate

#### 1. ColumnManager Component (NEW)
**Purpose:** Manage column visibility, order, and width
**Location:** `frontend/src/app/shared/components/column-manager/`

**Features:**
- Toggle column visibility (show/hide)
- Reorder columns (drag-and-drop)
- Resize column widths
- Persist preferences to localStorage
- Export/import column configurations
- Reset to default configuration

**UI Elements:**
- Column list with checkboxes (for visibility)
- Drag handles (for reordering)
- Width slider or input (for resizing)
- Buttons: Reset, Apply, Cancel
- Dropdown or modal overlay

#### 2. BaseTable Component (MODIFY)
**Changes:**
- Accept ColumnManager output events
- Apply column configuration changes
- Filter columns by visibility
- Update column widths dynamically
- Emit column config changes for ColumnManager to persist

#### 3. TableColumn Model (ENHANCE)
**New Fields:**
- `order?: number` - Display order (0-based index)
- `originalWidth?: string` - Default width for reset
- `resizable?: boolean` - Allow width resizing
- `reorderable?: boolean` - Allow reordering

---

## Step-by-Step Implementation

### Step 3.1: Design ColumnManager Architecture

**Data Model:**
```typescript
interface ColumnState {
  key: string;              // Column key (unique identifier)
  visible: boolean;         // Show/hide column
  order: number;            // Display order (0-based)
  width?: string;           // Custom width (e.g., '200px')
}

interface ColumnPreferences {
  tableId: string;          // Which table these are for
  columns: ColumnState[];   // Array of column states
  lastModified: number;     // Timestamp
}
```

**localStorage Key Pattern:**
```
columnPrefs_{tableId}
Example: columnPrefs_manufacturer-model-picker-dual
```

**ColumnManager Inputs:**
```typescript
@Input() config: TableConfig;           // Table config
@Input() columns: TableColumn[];        // All columns
@Input() preferences?: ColumnPreferences; // Saved preferences
```

**ColumnManager Outputs:**
```typescript
@Output() preferencesChange = new EventEmitter<ColumnPreferences>();
@Output() apply = new EventEmitter<ColumnPreferences>();
@Output() cancel = new EventEmitter<void>();
```

### Step 3.2: Create ColumnManager Component

**Component Structure:**
```
ColumnManager/
├── column-manager.component.ts        (Logic)
├── column-manager.component.html      (Template)
├── column-manager.component.scss      (Styles)
└── column-manager.service.ts          (localStorage management)
```

**Features to Implement:**
1. Load preferences from localStorage on init
2. Display columns with checkboxes for visibility
3. Drag-and-drop for reordering
4. Width input/slider for resizing
5. Apply/Cancel/Reset buttons
6. Real-time preview (optional)

### Step 3.3: Implement Column Visibility Toggle

**Logic:**
```typescript
toggleColumnVisibility(columnKey: string): void {
  const column = this.columnStates.find(c => c.key === columnKey);
  if (column) {
    column.visible = !column.visible;
  }
}

getVisibleColumns(): TableColumn[] {
  return this.columns.filter(col => {
    const state = this.getColumnState(col.key);
    return state ? state.visible : col.visible !== false;
  });
}
```

**Template:**
```html
<div class="column-list">
  <div *ngFor="let col of columns" class="column-item">
    <input type="checkbox"
           [checked]="getColumnState(col.key)?.visible"
           (change)="toggleColumnVisibility(col.key)">
    <span class="column-label">{{ col.label }}</span>
  </div>
</div>
```

### Step 3.4: Implement Column Reordering

**Logic:**
```typescript
reorderColumns(fromIndex: number, toIndex: number): void {
  const [moved] = this.columnStates.splice(fromIndex, 1);
  this.columnStates.splice(toIndex, 0, moved);

  // Update order indices
  this.columnStates.forEach((col, idx) => {
    col.order = idx;
  });
}

getSortedColumns(): ColumnState[] {
  return [...this.columnStates].sort((a, b) => a.order - b.order);
}
```

**Drag-and-Drop (using CDK):**
```html
<div cdkDropList (cdkDropListDropped)="drop($event)">
  <div *ngFor="let col of columnStates; let i = index"
       cdkDrag
       class="column-item draggable">
    <span cdkDragHandle class="drag-handle">⋮⋮</span>
    <span class="column-label">{{ col.key }}</span>
  </div>
</div>
```

### Step 3.5: Implement Column Width Resizing

**Logic:**
```typescript
updateColumnWidth(columnKey: string, width: string): void {
  const column = this.columnStates.find(c => c.key === columnKey);
  if (column) {
    column.width = width;
  }
}

getColumnWidth(columnKey: string): string {
  const state = this.getColumnState(columnKey);
  return state?.width || '';
}
```

**Template:**
```html
<div class="column-width">
  <label>{{ col.label }} Width:</label>
  <input type="text"
         [value]="getColumnWidth(col.key)"
         (input)="updateColumnWidth(col.key, $event.target.value)"
         placeholder="e.g., 150px, 20%">
</div>
```

### Step 3.6: Integrate with BaseTable

**BaseTable Changes:**
```typescript
// Input: Accept ColumnManager output
@Input() columnPreferences?: ColumnPreferences;

// Method: Apply preferences to columns
applyColumnPreferences(prefs: ColumnPreferences): void {
  this.config.columns.forEach(col => {
    const pref = prefs.columns.find(c => c.key === col.key);
    if (pref) {
      col.visible = pref.visible;
      col.width = pref.width;
      // Update order if needed
    }
  });
}

// Method: Get visible columns
getVisibleColumns(): TableColumn[] {
  return this.config.columns.filter(col => col.visible !== false);
}
```

**Template Integration:**
```html
<!-- ColumnManager Popup/Modal -->
<app-column-manager
  [config]="config"
  [columns]="config.columns"
  [preferences]="columnPreferences"
  (preferencesChange)="columnPreferences = $event"
  (apply)="onColumnPreferencesApply($event)"
  (cancel)="onColumnPreferencesCancel()">
</app-column-manager>

<!-- BaseTable uses filtered columns -->
<table>
  <thead>
    <tr>
      <th *ngFor="let col of getVisibleColumns()" [style.width]="col.width">
        {{ col.label }}
      </th>
    </tr>
  </thead>
  <tbody>...</tbody>
</table>
```

### Step 3.7: Persist Preferences to localStorage

**ColumnManager Service:**
```typescript
@Injectable({providedIn: 'root'})
export class ColumnPreferencesService {
  savePreferences(tableId: string, prefs: ColumnPreferences): void {
    const key = `columnPrefs_${tableId}`;
    localStorage.setItem(key, JSON.stringify(prefs));
  }

  loadPreferences(tableId: string): ColumnPreferences | null {
    const key = `columnPrefs_${tableId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  deletePreferences(tableId: string): void {
    const key = `columnPrefs_${tableId}`;
    localStorage.removeItem(key);
  }
}
```

**ColumnManager Integration:**
```typescript
constructor(private prefsService: ColumnPreferencesService) {}

ngOnInit(): void {
  // Load saved preferences
  const saved = this.prefsService.loadPreferences(this.config.id);
  if (saved) {
    this.applyStoredPreferences(saved);
  } else {
    this.initializeFromConfig();
  }
}

onApply(): void {
  const prefs = this.buildPreferences();
  this.prefsService.savePreferences(this.config.id, prefs);
  this.apply.emit(prefs);
}
```

---

## Code Patterns

### Pattern 1: Manage Column State
```typescript
private columnStates: ColumnState[] = [];

private initializeColumnStates(): void {
  this.columnStates = this.columns.map((col, idx) => ({
    key: col.key,
    visible: col.visible !== false,
    order: idx,
    width: col.width
  }));
}

getColumnState(columnKey: string): ColumnState | undefined {
  return this.columnStates.find(c => c.key === columnKey);
}
```

### Pattern 2: Handle Drag-and-Drop
```typescript
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { moveItemInArray } from '@angular/cdk/drag-drop';

drop(event: CdkDragDrop<ColumnState[]>): void {
  moveItemInArray(
    this.columnStates,
    event.previousIndex,
    event.currentIndex
  );

  // Update order indices
  this.columnStates.forEach((col, idx) => {
    col.order = idx;
  });
}
```

### Pattern 3: Apply Preferences to Table
```typescript
onColumnPreferencesApply(prefs: ColumnPreferences): void {
  // Update BaseTable with new preferences
  this.applyColumnPreferences(prefs);

  // Recreate columns array with new order
  const orderedColumns = prefs.columns
    .sort((a, b) => a.order - b.order)
    .map(pref => {
      const col = this.config.columns.find(c => c.key === pref.key);
      return {
        ...col,
        visible: pref.visible,
        width: pref.width
      };
    });

  this.config.columns = orderedColumns;
}
```

---

## Success Criteria

✅ ColumnManager component created
✅ Column visibility toggle implemented
✅ Column reordering with drag-and-drop working
✅ Column width resizing implemented
✅ BaseTable uses column preferences
✅ Preferences persist to localStorage
✅ Reset to default configuration works
✅ No regressions in existing functionality

---

## Files to Create/Modify

### Create
```
frontend/src/app/shared/components/column-manager/
├── column-manager.component.ts
├── column-manager.component.html
├── column-manager.component.scss
└── column-manager.service.ts

frontend/src/app/shared/services/
└── column-preferences.service.ts
```

### Modify
```
frontend/src/app/shared/components/base-table/base-table.component.ts
frontend/src/app/shared/components/base-table/base-table.component.html
frontend/src/app/shared/models/table-config.model.ts
frontend/src/app/shared/components/index.ts (barrel export)
```

---

## Dependencies

**Already Available:**
- Angular CDK for drag-and-drop (@angular/cdk)
- RxJS for observable patterns
- TypeScript for type safety

**No New Dependencies Required**

---

## Next Steps After Phase 3

Once Phase 3 complete:
- Phase 4: Hierarchical selection refinement
- Phase 5: Sub-table expansion with API support
- Phase 6: Testing & documentation
