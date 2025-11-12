# Phase 4: Hierarchical Selection Refinement Implementation Plan

**Status:** Starting Phase 4 Implementation
**Date:** November 12, 2025
**Scope:** Verify and refine hierarchical selection patterns with proper state matching

---

## Overview

Phase 4 ensures hierarchical selection works correctly across both single-selector and dual-selector picker patterns. Key focus: parent-child state matching, configuration-driven behavior, and URL-first persistence.

### Core Requirement: State Matching Rule
```
When parent and child have the same row ID:
  parent.state === child.state  (ALWAYS)

NOT tri-state:
  Parent is always binary (checked or unchecked)
  No indeterminate/partial states
```

---

## Two Picker Patterns

### Pattern 1: Single-Selector Picker
**When to use:** Simple hierarchical selection with parent-only checkboxes

**Configuration:**
```typescript
selection: {
  enabled: true,
  hierarchical: {
    enabled: true,
    parentKey: 'manufacturer',
    childKey: 'model',
    parentColumn: undefined  // No parent checkbox in columns
  },
  displayMode: 'single'  // One checkbox column on left
}
```

**Behavior:**
- Single checkbox column on left side of table
- Click parent checkbox → selects/deselects ALL children for that manufacturer
- Click child checkbox → selects/deselects ONLY that model
- Parent checkbox shows checked if ANY child is selected (visual indicator only)
- NOT tri-state: parent state always matches data

**Template Example:**
```html
<!-- SINGLE MODE -->
<table>
  <thead>
    <tr>
      <th></th>  <!-- Empty header for checkbox column -->
      <th>Manufacturer</th>
      <th>Model</th>
    </tr>
  </thead>
  <tbody>
    <!-- Parent row with parent checkbox -->
    <tr class="parent-row">
      <td>
        <input type="checkbox"
               [checked]="getParentCheckboxValue('Ford')"
               (change)="onParentCheckboxChange('Ford', $event)">
      </td>
      <td><strong>Ford</strong></td>
      <td></td>
    </tr>

    <!-- Child rows with child checkboxes -->
    <tr class="child-row">
      <td>
        <input type="checkbox"
               [checked]="isRowSelected(row)"
               (change)="onChildCheckboxChange(row, $event)">
      </td>
      <td></td>
      <td>F-150</td>
    </tr>
  </tbody>
</table>
```

### Pattern 2: Dual-Selector Picker
**When to use:** Show both parent and child checkboxes in data columns (manufacturer and model on same row)

**Configuration:**
```typescript
selection: {
  enabled: true,
  hierarchical: {
    enabled: true,
    parentKey: 'manufacturer',
    childKey: 'model',
    parentColumn: 0,  // Show parent checkbox in column 0 (manufacturer)
    childColumn: 1    // Show child checkbox in column 1 (model)
  },
  displayMode: 'dual'  // Both checkboxes visible in data rows
}
```

**Behavior:**
- Parent checkbox in manufacturer column
- Child checkbox in model column (SAME ROW, not nested)
- When parent and child share same row ID: parent.checked === child.checked
- Clicking parent checkbox → affects all rows with that manufacturer
- Clicking child checkbox → affects only that row (manufacturer|model)

**Template Example:**
```html
<!-- DUAL MODE -->
<table>
  <thead>
    <tr>
      <th>Manufacturer (Parent)</th>
      <th>Model (Child)</th>
    </tr>
  </thead>
  <tbody>
    <tr class="data-row">
      <!-- Parent checkbox in first column -->
      <td>
        <input type="checkbox"
               [checked]="getParentCheckboxValue(row.manufacturer)"
               (change)="onParentCheckboxChange(row.manufacturer, $event)">
        <span>{{ row.manufacturer }}</span>
      </td>

      <!-- Child checkbox in second column -->
      <td>
        <input type="checkbox"
               [checked]="isRowSelected(row)"
               (change)="onChildCheckboxChange(row, $event)">
        <span>{{ row.model }}</span>
      </td>
    </tr>
  </tbody>
</table>
```

---

## State Matching Rule

### When Parent and Child Share Row ID

**Example: Row with manufacturer='Ford' and model='F-150'**

Row ID (composite key): `Ford|F-150`

**Rule:**
```
If:   row.manufacturer === 'Ford'
And:  row.model === 'F-150'
Then: parentCheckbox['Ford'].state === childCheckbox['Ford|F-150'].state
```

**Enforcement:**
```typescript
// When child checkbox changes
onChildCheckboxChange(row: any, event: any): void {
  this.selectionHelper.toggleChild(row);

  // CRITICAL: Update parent checkbox to match child
  const parentValue = row[parentKey];  // e.g., 'Ford'
  const childKey = row[childKey];      // e.g., 'F-150'

  // Ensure parent state reflects child state
  this.updateParentCheckboxStateCache();
}

// When parent checkbox changes
onParentCheckboxChange(parentValue: string, event: any): void {
  this.selectionHelper.toggleParent(parentValue);

  // Parent click affects ALL children with this parent value
  // State cache will show parent checkbox as checked/unchecked
  // based on child selection count

  this.updateParentCheckboxStateCache();
}
```

### Binary States (NOT Tri-state)

**Parent checkbox has TWO states:**
- ✅ Checked: All children selected
- ❌ Unchecked: No children selected (or some selected)

**Indeterminate/partial state NOT USED:**
```typescript
// WRONG - don't do this:
parentCheckboxValue = null;  // Indeterminate (partial)

// CORRECT - always binary:
parentCheckboxValue = isAllSelected ? true : false;
```

---

## Configuration-Driven Behavior

### Step 4.1: Verify Pattern Configuration

**Code Pattern:**
```typescript
ngOnInit() {
  // Determine which pattern is configured
  const config = this.config.selection;

  if (config?.hierarchical?.parentColumn !== undefined) {
    // Dual-selector pattern
    this.pickerPattern = 'dual';
  } else {
    // Single-selector pattern
    this.pickerPattern = 'single';
  }

  console.log('[BaseTable] Picker pattern:', this.pickerPattern);
}

// Template routing:
<!-- Single-selector mode -->
<div *ngIf="pickerPattern === 'single'">
  <!-- Checkbox column on left, parent-child structure below -->
</div>

<!-- Dual-selector mode -->
<div *ngIf="pickerPattern === 'dual'">
  <!-- Parent checkbox in data column, child checkbox in data column -->
</div>
```

### Step 4.2: Single-Selector Implementation

**Requirements:**
- Checkbox column on far left
- Hierarchical display: parent rows, then indented child rows
- Parent checkbox controls all children for that parent value
- Child checkboxes control only individual children
- Parent state shows based on child selection count

**Code Changes Needed:**
```typescript
// Determine if using single-selector pattern
isSingleSelectorMode(): boolean {
  return this.pickerPattern === 'single';
}

// Get parent rows for display (only parents, not children)
getParentRows(): any[] {
  const parents = this.selectionHelper.getUniqueParents();
  return parents.map(parentValue => ({
    [parentKey]: parentValue,
    isParent: true
  }));
}

// Get child rows for parent (children grouped under parent)
getChildrenForParent(parentValue: string): any[] {
  return this.selectionHelper.getChildren(parentValue);
}

// Template shows parent row, then children grouped under it
```

### Step 4.3: Dual-Selector Implementation

**Requirements:**
- Parent checkbox in manufacturer column (first data column)
- Child checkbox in model column (second data column)
- Both checkboxes on SAME row (not nested)
- Row ID determines state matching: if same row, states must match
- Clicking parent affects all rows with that manufacturer
- Clicking child affects only that row

**Code Changes Needed:**
```typescript
// Determine if using dual-selector pattern
isDualSelectorMode(): boolean {
  return this.pickerPattern === 'dual';
}

// Check if this is a data row (not a summary row)
isDataRow(row: any): boolean {
  return row && row[childKey] !== undefined;
}

// Show parent checkbox for rows with this parent value
shouldShowParentCheckbox(row: any, columnIndex: number): boolean {
  if (!isDualSelectorMode()) return false;
  return columnIndex === config.selection.hierarchical.parentColumn;
}

// Show child checkbox for rows with this child value
shouldShowChildCheckbox(row: any, columnIndex: number): boolean {
  if (!isDualSelectorMode()) return false;
  return columnIndex === config.selection.hierarchical.childColumn;
}

// Template: renders parent and child checkboxes based on column index
```

### Step 4.4: State Matching Enforcement

**Critical Logic:**
```typescript
// When ANY checkbox changes, enforce state matching rule
private enforceStateMatching(): void {
  // For each row in data
  this.data.forEach(row => {
    const rowId = this.generateRowId(row);  // e.g., 'Ford|F-150'
    const parentValue = row[parentKey];

    // Get parent and child selection states
    const isChildSelected = this.selectionHelper.isSelected(row);
    const parentState = this.selectionHelper.getParentState(parentValue);

    // RULE: If same row ID, parent state must match child state
    // This is more complex:
    // - If this is a PARENT row (no child value), parent checkbox shows selection status
    // - If this is a DATA row (has child value), parent and child must match

    // For now, just ensure parent checkbox reflects child selections
  });
}

// Method called after every selection change
private updateParentCheckboxStateCache(): void {
  if (!this.selectionHelper) return;

  this.parentCheckboxStates.clear();
  const parents = this.selectionHelper.getUniqueParents();

  parents.forEach(parentValue => {
    const state = this.selectionHelper.getParentState(parentValue);
    this.parentCheckboxStates.set(parentValue, state);
  });
}
```

---

## URL Persistence for Selections

### Step 4.5: Selection State in URL

**URL Format:**
```
?selected=Ford|F-150,Ford|Mustang,Chevrolet|Corvette
```

**Code Pattern:**
```typescript
// Serialize selected items to URL
serializeSelection(): string {
  const selectedItems = this.selectionHelper.getSelectedItems();
  const keys = selectedItems.map(item =>
    `${item[parentKey]}|${item[childKey]}`
  ).join(',');
  return keys;
}

// Deserialize URL to selected items
deserializeSelection(urlValue: string): Set<string> {
  const keys = urlValue.split(',').map(k => k.trim());
  return new Set(keys);
}

// When selection changes, update URL
onSelectionChange(): void {
  const selectedUrl = this.serializeSelection();
  this.urlState.setQueryParams({
    [this.config.selection.urlParam]: selectedUrl
  }).subscribe(...);
}
```

---

## Testing Strategy

### Test Cases for Single-Selector

1. **Click parent checkbox:**
   - ✅ All children for that parent become selected
   - ✅ Parent checkbox appears checked
   - ✅ Selection is in URL

2. **Click child checkbox:**
   - ✅ Only that child is selected
   - ✅ Parent checkbox shows partial state (or binary based on config)
   - ✅ Child appears in selected list

3. **Uncheck parent:**
   - ✅ All children deselected
   - ✅ Selection URL updated

### Test Cases for Dual-Selector

1. **Parent checkbox in data row:**
   - ✅ Appears in manufacturer column
   - ✅ Clicking affects all rows with that manufacturer
   - ✅ Child checkbox on same row

2. **Child checkbox in data row:**
   - ✅ Appears in model column (same row as parent)
   - ✅ Clicking affects only that row
   - ✅ State matches parent if same row

3. **State Matching:**
   - ✅ Parent state === Child state when same row
   - ✅ No tri-state indeterminate values
   - ✅ Always binary (checked or unchecked)

### Test Cases for URL Persistence

1. **Navigate with selection URL:**
   - ✅ Page loads and reconstructs selected items
   - ✅ Checkboxes show correct state
   - ✅ Multiple selections work

2. **Modify selection:**
   - ✅ URL updates immediately
   - ✅ Bookmark URL works
   - ✅ Share URL shows correct selection

---

## Code Architecture

### Key Files to Review/Modify

**Already Exists:**
- [base-table.component.ts](frontend/src/app/shared/components/base-table/base-table.component.ts) - Selection logic
- [selection-state.model.ts](frontend/src/app/shared/models/selection-state.model.ts) - HierarchicalSelectionHelper
- [table-config.model.ts](frontend/src/app/shared/models/table-config.model.ts) - TableConfig interface

**May Need Enhancement:**
- BaseTable template: Verify single vs dual selector rendering
- HierarchicalSelectionHelper: Ensure parent state logic is correct
- Selection serialization: Ensure URL format is consistent

---

## Success Criteria

✅ Single-selector pattern working correctly
✅ Dual-selector pattern working correctly
✅ State matching rule enforced (parent === child)
✅ NO tri-state indeterminate values
✅ Selection persists to URL
✅ URL rehydration restores selection
✅ Configuration-driven behavior works
✅ No regressions in existing functionality

---

## Phase 4 Deliverables

1. ✅ Verified hierarchical selection patterns
2. ✅ Single-selector pattern implemented
3. ✅ Dual-selector pattern implemented
4. ✅ State matching rule enforced
5. ✅ URL persistence working
6. ✅ All tests passing

---

## Next Steps

After Phase 4 complete:
- **Phase 5:** Sub-table expansion with API support
- **Phase 6:** Testing & documentation

