# Checkbox Behavior Specification

**Project:** Vehicle Discovery Platform
**Component:** BaseTableComponent (Hierarchical Selection Mode)
**Date:** 2025-11-11

---

## Overview

The BaseTableComponent implements a **parent-child checkbox pattern** for hierarchical data selection. This pattern is used when data has a natural parent-child relationship (e.g., Manufacturer → Models).

This specification covers **two distinct display modes** with different behaviors:
- **Case 1: Expandable Rows** - Parent-child hierarchy with collapsible row expansion
- **Case 2: Flat Picker Tables** - Flat table with parent and child checkboxes in same row (CURRENT IMPLEMENTATION)

---

## Checkbox States

### Case 1: Expandable Rows (Parent-Child Hierarchy)

#### Parent Checkbox (Tri-State)

| State | Visual | Condition | Meaning |
|-------|--------|-----------|---------|
| **Unchecked** | ☐ | Zero children selected | None of this parent's children are selected |
| **Indeterminate** | ☑ (partial) | Some (but not all) children selected | At least 1 child selected, but not all |
| **Checked** | ☑ (full) | All children selected | Every child for this parent is selected |

#### Child Checkbox (Binary)

| State | Visual | Condition | Meaning |
|-------|--------|-----------|---------|
| **Unchecked** | ☐ | Not in selection | This specific child is not selected |
| **Checked** | ☑ | In selection | This specific child is selected |

**Key:** Parent state is **derived** from children (calculated on-demand). Indeterminate state is possible when some (but not all) children are selected.

---

### Case 2: Flat Picker Tables (Same-Row Parent & Child)

#### Parent Checkbox (Binary)

| State | Visual | Scope | Meaning |
|-------|--------|-------|---------|
| **Unchecked** | ☐ | ALL rows for this parent | No rows for this parent are selected |
| **Checked** | ☑ | ALL rows for this parent | ALL rows for this parent are selected |

**Key:** Parent checkbox state = child checkbox state for that specific row (no indeterminate state). Clicking the parent affects ALL rows of that parent.

#### Child Checkbox (Binary)

| State | Visual | Scope | Meaning |
|-------|--------|-------|---------|
| **Unchecked** | ☐ | This row only | This row is not selected |
| **Checked** | ☑ | This row only | This row is selected |

**Key:** Clicking a child only affects that row. Parent checkbox for other rows is unaffected.

---

## Behavior Rules

### Case 1: Expandable Rows

#### Rule 1a: Parent Checkbox Click

**Action:** User clicks parent checkbox

**Behavior:**

| Current State | Click Effect | Result State | Children Affected |
|---------------|--------------|--------------|-------------------|
| Unchecked ☐ | Click → Check | Checked ☑ | ALL children for parent are SELECTED |
| Indeterminate ☑ (partial) | Click → Check | Checked ☑ | ALL children for parent are SELECTED |
| Checked ☑ (full) | Click → Uncheck | Unchecked ☐ | ALL children for parent are DESELECTED |

**Key Point:** Clicking indeterminate state treats it as unchecked (selects all remaining children)

#### Rule 2a: Child Checkbox Click

**Action:** User clicks child checkbox

**Behavior:**

| Current State | Click Effect | Result State | Parent Impact |
|---------------|--------------|--------------|---------------|
| Unchecked ☐ | Click → Check | Checked ☑ | Parent updates: Unchecked → Indeterminate OR Indeterminate → Checked |
| Checked ☑ | Click → Uncheck | Unchecked ☐ | Parent updates: Checked → Indeterminate OR Indeterminate → Unchecked |

**Key Point:** Parent state automatically recalculates after every child change

#### Rule 3a: Parent State Calculation (Automatic)

**Trigger:** After ANY selection change (parent or child click)

**Algorithm:**
```
Count selected children for this parent
IF selectedCount === 0 THEN
  parentState = 'unchecked'
ELSE IF selectedCount === totalChildren THEN
  parentState = 'checked'
ELSE
  parentState = 'indeterminate'
END IF
```

---

### Case 2: Flat Picker Tables

#### Rule 1b: Parent Checkbox Click

**Action:** User clicks parent checkbox in any row of a given manufacturer

**Behavior:**

| Current State | Click Effect | Result State | Scope | Other Rows |
|---------------|--------------|--------------|-------|-----------|
| Unchecked ☐ | Click → Check | Checked ☑ | ALL rows for that manufacturer | All become CHECKED |
| Checked ☑ | Click → Uncheck | Unchecked ☐ | ALL rows for that manufacturer | All become UNCHECKED |

**Key Point:**
- Parent checkbox click affects ALL rows for that manufacturer globally
- Rows for OTHER manufacturers are NOT affected
- Parent checkbox state mirrors its corresponding row's child checkbox state

#### Rule 2b: Child Checkbox Click

**Action:** User clicks child checkbox in a single row

**Behavior:**

| Current State | Click Effect | Result State | Scope | Parent State (same row) |
|---------------|--------------|--------------|-------|------------------------|
| Unchecked ☐ | Click → Check | Checked ☑ | This row only | Updates to match (Checked) |
| Checked ☑ | Click → Uncheck | Unchecked ☐ | This row only | Updates to match (Unchecked) |

**Key Point:**
- Child checkbox click affects ONLY that row
- Parent checkbox for that row updates to match
- Parent checkboxes for OTHER rows are unaffected
- No indeterminate state (parent = child for that row)

#### Rule 3b: Parent-Child Synchronization

**Synchronization Rule:**
```
For each row:
  parentCheckboxState[row] = childCheckboxState[row]

Parent checkbox is ALWAYS binary (checked or unchecked), never indeterminate
```

**Key Difference from Case 1:**
- In Case 1, parent state is derived from ALL children
- In Case 2, parent state is per-row and equals that row's child state

---

## Example Scenarios

### Case 1: Expandable Rows

#### Scenario 1A: Select All Models for One Manufacturer

| Step | Action | Ford State | Total Selected |
|------|--------|------------|----------------|
| 1 | Initial | ☐ (0/7) | 0 |
| 2 | Click Ford checkbox | ☑ (7/7) Checked | 7 |
| 3 | Uncheck F-150 | ☑ (6/7) Indeterminate | 6 |
| 4 | Click Ford checkbox (was indeterminate) | ☑ (7/7) Checked | 7 |
| 5 | Click Ford checkbox (was checked) | ☐ (0/7) Unchecked | 0 |

#### Scenario 1B: Partial Selection Across Multiple Parents

| Step | Action | Ford State | Dodge State | Total |
|------|--------|------------|-------------|-------|
| 1 | Check Ford → F-150 | ☑ (1/7) Indeterminate | ☐ (0/2) | 1 |
| 2 | Check Ford → Mustang | ☑ (2/7) Indeterminate | ☐ (0/2) | 2 |
| 3 | Check Dodge → Durango | ☑ (2/7) Indeterminate | ☑ (1/2) Indeterminate | 3 |
| 4 | Click Ford checkbox | ☑ (7/7) Checked | ☑ (1/2) Indeterminate | 8 |

#### Scenario 1C: Single-Model Parent (Edge Case)

**Parent:** MINI (1 model: Cooper)

| Action | Checkbox State | Note |
|--------|----------------|------|
| Click parent checkbox | ☑ Checked | Goes from Unchecked → Checked (never indeterminate) |
| Click child checkbox | ☑ Checked | Same effect as clicking parent |
| Uncheck either | ☐ Unchecked | Parent and child always in sync |

**Why no indeterminate?** Indeterminate requires "some but not all" - impossible with 1 child.

---

### Case 2: Flat Picker Tables (CURRENT IMPLEMENTATION)

#### Scenario 2A: Click Parent Checkbox to Select All Rows of Manufacturer

**Initial State:** All rows unchecked
```
┌─────────────────┬──────────────┐
│ Manufacturer    │ Model        │
├─────────────────┼──────────────┤
│ ☐ Ford          │ ☐ F-150      │
│ ☐ Ford          │ ☐ Mustang    │
│ ☐ Ford          │ ☐ Explorer   │
│ ☐ Dodge         │ ☐ Durango    │
└─────────────────┴──────────────┘
Selected: 0 models
```

**Step 1:** Click parent checkbox in Ford F-150 row
```
┌─────────────────┬──────────────┐
│ Manufacturer    │ Model        │
├─────────────────┼──────────────┤
│ ☑ Ford          │ ☑ F-150      │ ← Clicked here
│ ☑ Ford          │ ☑ Mustang    │ ← Also checked (parent affects ALL Ford rows)
│ ☑ Ford          │ ☑ Explorer   │ ← Also checked (parent affects ALL Ford rows)
│ ☐ Dodge         │ ☐ Durango    │ ← Unaffected
└─────────────────┴──────────────┘
Selected: 3 models (all Ford)
```

**Key Insight:** Clicking Ford parent checkbox in ANY row selects ALL Ford rows

#### Scenario 2B: Click Child Checkbox to Select Single Row

**Starting from Scenario 2A result:**

**Step 2:** Uncheck child checkbox (Mustang) in Ford row
```
┌─────────────────┬──────────────┐
│ Manufacturer    │ Model        │
├─────────────────┼──────────────┤
│ ☑ Ford          │ ☑ F-150      │
│ ☐ Ford          │ ☐ Mustang    │ ← Clicked here (only this row affected)
│ ☑ Ford          │ ☑ Explorer   │ ← Parent + child unchanged
│ ☐ Dodge         │ ☐ Durango    │ ← Unaffected
└─────────────────┴──────────────┘
Selected: 2 models (F-150, Explorer)
```

**Key Insight:** Clicking child checkbox affects ONLY that row. Other rows unaffected.

#### Scenario 2C: Mixed Selection

**Step 3:** Click Ford parent checkbox again (when some Ford rows are selected)
```
┌─────────────────┬──────────────┐
│ Manufacturer    │ Model        │
├─────────────────┼──────────────┤
│ ☐ Ford          │ ☐ F-150      │ ← Parent toggle deselects ALL Ford
│ ☐ Ford          │ ☐ Mustang    │ ← All Ford rows deselected
│ ☐ Ford          │ ☐ Explorer   │ ← All Ford rows deselected
│ ☐ Dodge         │ ☐ Durango    │ ← Unaffected
└─────────────────┴──────────────┘
Selected: 0 models
```

**Key Insight:** Parent checkbox is a toggle for ALL rows of that manufacturer

---

## Display Modes

### Case 1: Expandable Rows - Display Modes

#### Single Checkbox Mode (Expandable)

- **Layout:** Separate checkbox column on the left side, child checkboxes only visible when expanded
- **Column Structure:** `[☐] | Manufacturer | Model (collapsed)`
- **Interaction:** Click row/arrow to expand and see child checkboxes
- **Checkbox Target:** Child selection (selects individual models within expanded parent)
- **Use Case:** Space-efficient selection with hierarchical organization

#### Dual Checkbox Mode (Expandable)

- **Layout:** Checkboxes embedded within data columns
- **Column Structure:** `[☑] Manufacturer (collapsed) | Data columns | ...`
- **Parent Checkbox:** Embedded in Manufacturer column (tri-state, affects ALL children)
- **Child Checkbox:** Visible only when parent row is expanded
- **Use Case:** Bulk manufacturer selection with expand-to-see-models interaction

---

### Case 2: Flat Picker Tables - Display Modes (CURRENT IMPLEMENTATION)

#### Single Checkbox Mode (Flat)

- **Layout:** Separate checkbox column on the left side
- **Column Structure:** `[☐] | Manufacturer | Model | Vehicles`
- **Checkbox Target:** Child selection only (selects individual models)
- **Parent Checkbox Visibility:** NOT VISIBLE
- **Use Case:** Precise individual model selection with all data visible
- **Row Independence:** Each row is independent (clicking doesn't affect other rows)

#### Dual Checkbox Mode (Flat) - ACTUAL IMPLEMENTATION

- **Layout:** Checkboxes embedded within data columns (same row)
- **Column Structure:** `[☑] Manufacturer | [☐] Model | Vehicles`
- **Parent Checkbox:** Embedded in Manufacturer column
  - **Behavior:** Clicking parent checkbox selects/deselects ALL rows for that manufacturer
  - **State:** Binary (checked or unchecked) = child checkbox state for that row
  - **Indeterminate:** NOT USED in flat tables
- **Child Checkbox:** Embedded in Model column
  - **Behavior:** Clicking child checkbox affects ONLY that row
  - **State:** Binary (checked or unchecked)
- **Key Distinction:** Parent checkbox click has GLOBAL scope (all rows for that manufacturer), child click has LOCAL scope (one row only)
- **Use Case:** Bulk manufacturer selection + individual row fine-tuning

---

## Implementation Notes

### Data Structure

**Selection Storage:**
```typescript
// Map<parentValue, childValue[]>
// Example: Map { "Ford" => ["F-150", "Mustang", "Explorer"] }
```

**Selected Keys Format:**
```typescript
// Set<string> with "parent|child" format
// Example: Set { "Ford|F-150", "Ford|Mustang", "Dodge|Durango" }
```

### Performance

| Operation | Complexity | Method |
|-----------|-----------|--------|
| Check if child selected | O(1) | Array.includes() on parent's child array |
| Select/deselect child | O(n) | Array filter or concat (n = children for parent) |
| Calculate parent state | O(n) | Count selected children (n = children for parent) |
| Get total selection count | O(m) | Sum all child arrays (m = total parents) |

### State Management

- Parent state is **calculated on-demand**, never stored
- Selection state is stored in `HierarchicalSelectionHelper` class
- Selection changes emit `SelectionChangeEvent` with:
  - `selectedKeys: Set<string>` - All selected items
  - `selectedItems: T[]` - Full data objects

---

## Visual Examples

### Empty State
```
┌─────────────────┬──────────────┬──────────┐
│ Manufacturer    │ Model        │ Vehicles │
├─────────────────┼──────────────┼──────────┤
│ ☐ Ford          │ ☐ F-150      │ 45,231   │
│ ☐ Ford          │ ☐ Mustang    │ 12,450   │
│ ☐ Ford          │ ☐ Explorer   │  8,920   │
│ ☐ Dodge         │ ☐ Durango    │  3,456   │
│ ☐ Dodge         │ ☐ Ram 1500   │ 12,345   │
└─────────────────┴──────────────┴──────────┘
Selected: 0 models
```

### All Ford Selected (Checked Parent)
```
┌─────────────────┬──────────────┬──────────┐
│ Manufacturer    │ Model        │ Vehicles │
├─────────────────┼──────────────┼──────────┤
│ ☑ Ford          │ ☑ F-150      │ 45,231   │
│ ☑ Ford          │ ☑ Mustang    │ 12,450   │
│ ☑ Ford          │ ☑ Explorer   │  8,920   │
│ ☐ Dodge         │ ☐ Durango    │  3,456   │
│ ☐ Dodge         │ ☐ Ram 1500   │ 12,345   │
└─────────────────┴──────────────┴──────────┘
Selected: 3 models (3 Ford)
```

### Partial Ford + One Dodge (Indeterminate Parents)
```
┌─────────────────┬──────────────┬──────────┐
│ Manufacturer    │ Model        │ Vehicles │
├─────────────────┼──────────────┼──────────┤
│ ☑ Ford          │ ☑ F-150      │ 45,231   │ (Indeterminate: 2/3)
│ ☑ Ford          │ ☑ Mustang    │ 12,450   │
│ ☑ Ford          │ ☐ Explorer   │  8,920   │
│ ☑ Dodge         │ ☑ Durango    │  3,456   │ (Indeterminate: 1/2)
│ ☑ Dodge         │ ☐ Ram 1500   │ 12,345   │
└─────────────────┴──────────────┴──────────┘
Selected: 3 models (2 Ford + 1 Dodge)
```

---

## Design Rationale

### Case 1: Expandable Rows

#### Why Tri-State Parent Checkboxes?

1. **Efficiency:** Select all Ford models (7+) with one click vs. 7+ individual clicks
2. **Visual Feedback:** Indeterminate state shows partial selection at a glance
3. **Flexibility:** Toggle entire parent or cherry-pick individual children
4. **Intuitive:** Matches familiar patterns (file system, email clients)

#### Why Derive Parent State?

- **Single source of truth:** Children are the only stored selection state
- **Consistency:** Parent state always matches actual child selections
- **Simplicity:** No need to sync parent/child state on every change

#### Why Treat Indeterminate as Unchecked?

- **User Intent:** Clicking partial selection usually means "finish selecting all"
- **Predictability:** One more click always gets to fully selected state
- **Efficiency:** Completing selection is more common than clearing partial selection

---

### Case 2: Flat Picker Tables (CURRENT IMPLEMENTATION)

#### Why Binary Parent Checkboxes (No Indeterminate)?

1. **Row-level display:** Parent and child both visible in same row, so parent mirrors child state for that row
2. **Clarity:** No ambiguity about which specific row's state is being represented
3. **Flat structure:** No hidden/collapsed children, so "partial selection" concept doesn't apply to a row
4. **Bulk operations:** Parent click intentionally affects ALL rows of manufacturer (global toggle), not just visible children

#### Why Parent Click Affects ALL Rows for a Manufacturer?

- **Efficiency:** Select/deselect all Ford models (across all rows) with one click
- **Consistency:** All Ford rows stay in sync when bulk-toggling
- **User Intent:** Parent checkbox behavior is "toggle all rows for this manufacturer"
- **Clear Scope:** Distinguishes parent (global) vs. child (local) interaction

#### Why Child Click Affects Only That Row?

- **Precision:** Individual row-level selection for cherry-picking specific models
- **Isolation:** Doesn't affect sibling rows of same manufacturer
- **Intuitive:** Matches "click this row's checkbox" mental model

#### Key Design Difference from Case 1

| Aspect | Case 1 (Expandable) | Case 2 (Flat) |
|--------|-------------------|--------------|
| Parent State | Derived from ALL children (tri-state) | Mirrors single row's child state (binary) |
| Parent Click Scope | Affects only hidden/collapsed children | Affects ALL visible rows for manufacturer |
| Child Click Scope | Affects one child, parent recalculates | Affects one row, parent syncs |
| Indeterminate State | YES (some but not all children) | NO (parent always = child for row) |
| Visual Feedback | Indeterminate icon shows partial selection | Child state directly visible |

---

**Document Purpose:** Specification for hierarchical checkbox behavior in BaseTableComponent
**Status:** Active - Updated to cover both Case 1 (Expandable Rows) and Case 2 (Flat Picker Tables)
**Current Implementation:** Case 2 - Flat Picker Tables (dual checkbox mode with binary parent states)
**Last Updated:** 2025-11-11

---

## Summary: Case 1 vs Case 2

| Feature | Case 1: Expandable | Case 2: Flat (CURRENT) |
|---------|-------------------|----------------------|
| **Table Structure** | Parent row can expand to show children | All rows visible, flat structure |
| **Parent Checkbox State** | Tri-state (unchecked/indeterminate/checked) | Binary (unchecked/checked) |
| **Parent-Child Visibility** | Child checkboxes hidden until expand | Parent and child both visible in same row |
| **Parent Click Effect** | Toggles ALL hidden children | Toggles ALL visible rows for that manufacturer |
| **Child Click Effect** | Affects one child, parent recalculates | Affects one row, parent mirrors |
| **Indeterminate Used** | YES | NO |
| **Use Case** | Hierarchical organization | Flat selection with bulk operations |
