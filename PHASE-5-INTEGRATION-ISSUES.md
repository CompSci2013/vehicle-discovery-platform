# Phase 5: Integration Issues & Bug Log

**Date:** November 12, 2025
**Status:** Identifying and documenting issues during code analysis

---

## Overview

This document tracks bugs and integration issues discovered during Phase 5 implementation. Issues are categorized by feature and severity.

---

## Issue #1: Parent Checkbox State with Filtered Data

### Severity: HIGH
### Category: Filter + Hierarchical Selection Integration

### Problem
When a filter is applied:
1. `applyDataTransformations()` filters `this.data` and updates the component's data property
2. `HierarchicalSelectionHelper` was initialized with the ORIGINAL unfiltered data
3. Helper's `getChildren()` method uses original data to calculate parent state
4. Result: Parent checkbox state reflects ALL children, not just VISIBLE children

### Example
```
All Ford models: F-150, Explorer, Mustang (3 total)
User filters by "F-" (shows F-150, Explorer = 2 visible)
User selects all visible: F-150, Explorer (2/2 visible selected)

EXPECTED: Parent Ford checkbox shows "checked" (all visible are selected)
ACTUAL: Parent Ford checkbox shows "unchecked" (2/3 all selected)
```

### Root Cause
**File:** `selection-state.model.ts:95-96`
```typescript
getParentState(parentValue: string): CheckboxState {
  const allChildren = this.getChildren(parentValue);  // Uses this.data (original, not filtered)
```

**File:** `base-table.component.ts:353`
```typescript
this.selectionHelper = new HierarchicalSelectionHelper(this.data, parentKey, childKey);
// Created with original data, never updated when filter changes
```

### Impact
- Single-selector pattern: Parent checkbox shows wrong state when filtered
- Dual-selector pattern: Parent checkboxes only appear on visible rows, so parent state affects all rows but only visible parent checkboxes shown
- User confusion: "Select all visible" button would select all hidden items too

### Solution Options

**Option A: Update Helper on Every Filter Change**
- After `applyDataTransformations()`, recreate `HierarchicalSelectionHelper` with filtered data
- Keep selections separate (stored in helper's internal Map)
- Pros: Simple, parent state always reflects visible children
- Cons: Recreating helper is expensive, selections need to be preserved across recreations

**Option B: Pass Visible Data to Helper**
- When helper is created, pass only visible rows instead of all rows
- But keep selections stored separately for all data
- Requires two data sources: visible and all
- Pros: More efficient
- Cons: More complex architecture

**Option C: Use All-Data Parent State (Current Behavior)**
- Don't change - parent state reflects actual selection across all data
- Selections visible only when unhidden
- Pros: Simple, selections never lost
- Cons: Confusing UX - can't see/modify hidden selections easily

### Recommended Fix
**Option A** (Update Helper on Filter Change):
1. Move selection persistence to a separate Map in BaseTable
2. After filter changes, recreate HierarchicalSelectionHelper with filtered data
3. Reinitialize helper with previously selected keys
4. Update parent checkbox state based on filtered data

---

## Issue #2: Parent Checkbox State Column Reference (Potential)

### Severity: MEDIUM
### Category: Column Reordering + Hierarchical Selection

### Problem
In dual-selector mode, parent and child checkboxes are placed in specific columns:
- Parent checkbox in column at index `config.selection.hierarchical.parentColumn`
- Child checkbox in column at index `config.selection.hierarchical.childColumn`

### Risk
If column reordering changes column indices, checkbox placement might break.

### Actual Implementation Check
Need to verify in `base-table.component.html`:
- Are checkboxes referenced by column INDEX (lines 165-166)?
- Or by column KEY (safer)?

### Expected Status
Should be using column KEY lookup, not index, to survive column reordering.

---

## Issue #3: Pagination Parent State Calculation

### Severity: MEDIUM
### Category: Pagination + Hierarchical Selection

### Problem
Parent checkbox state is calculated based on `allChildren`:
- `allChildren = this.getChildren(parentValue)` uses original data (all rows)
- On page 2 of pagination, user might see "some" children selected
- Parent checkbox would show unchecked (not all selected)
- User clicks parent checkbox expecting to select all VISIBLE children on this page
- Actually selects ALL children across ALL pages

### Example
Parent "Ford" has 10 children: 6 on page 1, 4 on page 2

User navigates to page 2:
- Sees 4 Ford children
- Selects 3 of 4
- Parent checkbox shows unchecked (3/10 selected)
- User clicks parent expecting to select all 4 on page 2
- Actually selects all 10 across all pages

### Root Cause
Same as Issue #1 - parent state uses all data, not filtered/paginated data.

### Solution
Same as Issue #1 - update helper with visible data after pagination or filtering.

---

## Issue #4: Single vs Dual Selector Pattern Not Fully Integrated

### Severity: LOW
### Category: Configuration-Driven Behavior

### Problem
Phase 4 implemented picker pattern detection but might not handle all edge cases:
- What if user switches between single and dual mode dynamically?
- How does pattern switching affect existing selections?
- Are all template branches tested?

### Status
Need to verify both picker patterns work correctly in all scenarios.

---

## Integration Test Matrix

### Tests Passing (Assumed from Phase 4)
- ✅ Single checkbox column on left displays parent/child correctly
- ✅ Dual checkbox columns display in data rows correctly
- ✅ Selections stored in URL parameter
- ✅ Selections restored from URL on page load
- ✅ Binary checkbox states (no indeterminate)

### Tests Failing (Identified)
- ❌ Sort + Selection: Need to verify selections persist and parent state updates
- ❌ Filter + Selection: Parent state reflects ALL data, not visible data (ISSUE #1)
- ❌ Pagination + Selection: Parent state reflects ALL data, not visible data (ISSUE #3)
- ❌ Column Reorder + Selection: Need to verify column indices handled safely (ISSUE #2)

### Tests Not Yet Determined
- ? Multi-feature workflows (sort + filter + select + paginate)
- ? URL parameter consistency across all features
- ? Selection persistence across page navigation

---

## Recommended Fix Order

1. **Fix Issue #1 & #3 (Parent State with Filtered/Paginated Data)**
   - Update HierarchicalSelectionHelper on filter/pagination changes
   - Test sort + selection together
   - Test filter + selection together
   - Test pagination + selection together

2. **Verify Issue #2 (Column Reordering)**
   - Check implementation of parent/child checkbox column references
   - Verify column keys used instead of indices

3. **Test Multi-Feature Workflows**
   - Combine sort + filter + select
   - Combine pagination + select
   - Verify URL has all parameters

---

## Notes

- Phase 4 completion was solid for single-feature selection patterns
- Phase 5 integration reveals that multi-feature workflows need adjustment
- Main issue: HierarchicalSelectionHelper uses all data, not visible/filtered data
- This affects parent checkbox state display and user expectations

