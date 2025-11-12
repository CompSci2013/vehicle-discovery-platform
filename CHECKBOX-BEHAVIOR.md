# Checkbox Behavior Specification

**Project:** Vehicle Discovery Platform
**Component:** BaseTableComponent (Hierarchical Selection Mode)
**Date:** 2025-11-11

---

## Overview

The BaseTableComponent implements a **parent-child checkbox pattern** for hierarchical data selection. This pattern is used when data has a natural parent-child relationship (e.g., Manufacturer → Models).

**Key Principles:**
- Parent checkbox controls ALL children
- Parent state is **derived** from children (not stored separately)
- Clicking indeterminate parent checkbox selects ALL remaining children

---

## Checkbox States

### Parent Checkbox (Tri-State)

| State | Visual | Condition | Meaning |
|-------|--------|-----------|---------|
| **Unchecked** | ☐ | Zero children selected | None of this parent's children are selected |
| **Indeterminate** | ☑ (partial) | Some (but not all) children selected | At least 1 child selected, but not all |
| **Checked** | ☑ (full) | All children selected | Every child for this parent is selected |

### Child Checkbox (Binary)

| State | Visual | Condition | Meaning |
|-------|--------|-----------|---------|
| **Unchecked** | ☐ | Not in selection | This specific child is not selected |
| **Checked** | ☑ | In selection | This specific child is selected |

---

## Behavior Rules

### Rule 1: Parent Checkbox Click

**Action:** User clicks parent checkbox

**Behavior:**

| Current State | Click Effect | Result State | Children Affected |
|---------------|--------------|--------------|-------------------|
| Unchecked ☐ | Click → Check | Checked ☑ | ALL children for parent are SELECTED |
| Indeterminate ☑ (partial) | Click → Check | Checked ☑ | ALL children for parent are SELECTED |
| Checked ☑ (full) | Click → Uncheck | Unchecked ☐ | ALL children for parent are DESELECTED |

**Key Point:** Clicking indeterminate state treats it as unchecked (selects all remaining children)

### Rule 2: Child Checkbox Click

**Action:** User clicks child checkbox

**Behavior:**

| Current State | Click Effect | Result State | Parent Impact |
|---------------|--------------|--------------|---------------|
| Unchecked ☐ | Click → Check | Checked ☑ | Parent updates: Unchecked → Indeterminate OR Indeterminate → Checked |
| Checked ☑ | Click → Uncheck | Unchecked ☐ | Parent updates: Checked → Indeterminate OR Indeterminate → Unchecked |

**Key Point:** Parent state automatically recalculates after every child change

### Rule 3: Parent State Calculation (Automatic)

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

## Example Scenarios

### Scenario A: Select All Models for One Manufacturer

| Step | Action | Ford State | Total Selected |
|------|--------|------------|----------------|
| 1 | Initial | ☐ (0/7) | 0 |
| 2 | Click Ford checkbox | ☑ (7/7) Checked | 7 |
| 3 | Uncheck F-150 | ☑ (6/7) Indeterminate | 6 |
| 4 | Click Ford checkbox (was indeterminate) | ☑ (7/7) Checked | 7 |
| 5 | Click Ford checkbox (was checked) | ☐ (0/7) Unchecked | 0 |

### Scenario B: Partial Selection Across Multiple Parents

| Step | Action | Ford State | Dodge State | Total |
|------|--------|------------|-------------|-------|
| 1 | Check Ford → F-150 | ☑ (1/7) Indeterminate | ☐ (0/2) | 1 |
| 2 | Check Ford → Mustang | ☑ (2/7) Indeterminate | ☐ (0/2) | 2 |
| 3 | Check Dodge → Durango | ☑ (2/7) Indeterminate | ☑ (1/2) Indeterminate | 3 |
| 4 | Click Ford checkbox | ☑ (7/7) Checked | ☑ (1/2) Indeterminate | 8 |

### Scenario C: Single-Model Parent (Edge Case)

**Parent:** MINI (1 model: Cooper)

| Action | Checkbox State | Note |
|--------|----------------|------|
| Click parent checkbox | ☑ Checked | Goes from Unchecked → Checked (never indeterminate) |
| Click child checkbox | ☑ Checked | Same effect as clicking parent |
| Uncheck either | ☐ Unchecked | Parent and child always in sync |

**Why no indeterminate?** Indeterminate requires "some but not all" - impossible with 1 child.

---

## Display Modes

### Single Checkbox Mode

- **Layout:** Separate checkbox column on the left side
- **Column Structure:** `[☐] | Manufacturer | Model | Vehicles`
- **Checkbox Target:** Child selection only (selects individual models)
- **Use Case:** Precise individual model selection with all data visible

### Dual Checkbox Mode

- **Layout:** Checkboxes embedded within data columns
- **Column Structure:** `[☑] Manufacturer | [☐] Model | Vehicles`
- **Parent Checkbox:** Embedded in Manufacturer column (tri-state)
- **Child Checkbox:** Embedded in Model column (binary)
- **Use Case:** Bulk manufacturer selection + individual model cherry-picking

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

### Why Tri-State Parent Checkboxes?

1. **Efficiency:** Select all Ford models (7+) with one click vs. 7+ individual clicks
2. **Visual Feedback:** Indeterminate state shows partial selection at a glance
3. **Flexibility:** Toggle entire parent or cherry-pick individual children
4. **Intuitive:** Matches familiar patterns (file system, email clients)

### Why Derive Parent State?

- **Single source of truth:** Children are the only stored selection state
- **Consistency:** Parent state always matches actual child selections
- **Simplicity:** No need to sync parent/child state on every change

### Why Treat Indeterminate as Unchecked?

- **User Intent:** Clicking partial selection usually means "finish selecting all"
- **Predictability:** One more click always gets to fully selected state
- **Efficiency:** Completing selection is more common than clearing partial selection

---

**Document Purpose:** Specification for hierarchical checkbox behavior in BaseTableComponent
**Status:** Active - drives BaseTableComponent implementation
**Last Updated:** 2025-11-11
