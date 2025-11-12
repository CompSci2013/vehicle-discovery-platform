/*
  SELECTION STATE MODELS

  PURPOSE:
  Type-safe models for tracking hierarchical checkbox selection state.
  Implements the parent-child pattern from PICKER-CHECKBOX-BEHAVIOR.md.

  KEY CONCEPTS:
  - Parent state is DERIVED from children (not stored)
  - Selection stored as Set<string> for O(1) performance
  - Key format: "parentValue|childValue" (e.g., "Ford|F-150")
*/

/**
 * CHECKBOX STATE
 * Binary states only - NO indeterminate/partial states
 *
 * PHASE 4 REQUIREMENT:
 * Parent state = child state (always binary)
 * Checked: ALL children selected
 * Unchecked: Less than ALL children selected (including none)
 */
export type CheckboxState = 'unchecked' | 'checked';

/**
 * SELECTION EVENT
 * Emitted when selection changes
 */
export interface SelectionChangeEvent<T = any> {
  selectedKeys: Set<string>;        // All selected keys
  selectedItems: T[];               // All selected data items
  addedKeys?: string[];             // Keys added in this change
  removedKeys?: string[];           // Keys removed in this change
}

/**
 * HIERARCHICAL SELECTION HELPER
 * Utility class for managing parent-child selection state
 *
 * ARCHITECTURE:
 * Uses Map<parentValue, childValue[]> for O(1) parent lookup
 *
 * EXAMPLE:
 * Map {
 *   "BMW" => ["M3", "X5", "3 Series"],
 *   "Ford" => ["F-150", "Mustang"]
 * }
 *
 * USAGE:
 * const helper = new HierarchicalSelectionHelper(data, 'manufacturer', 'model');
 * helper.toggleParent('Ford');  // Selects/deselects all Ford models
 * helper.getParentState('Ford'); // Returns 'checked' | 'indeterminate' | 'unchecked'
 */
export class HierarchicalSelectionHelper<T = any> {
  /**
   * Selection storage: Map<parentValue, childValue[]>
   * Key = manufacturer (e.g., "BMW")
   * Value = array of selected models (e.g., ["M3", "X5"])
   */
  private selections = new Map<string, string[]>();

  constructor(
    private data: T[],
    private parentKey: string,
    private childKey: string
  ) {}

  /**
   * Check if an item is selected
   */
  isSelected(item: T): boolean {
    const parent = (item as any)[this.parentKey];
    const child = (item as any)[this.childKey];

    const selectedChildren = this.selections.get(parent);
    return selectedChildren ? selectedChildren.includes(child) : false;
  }

  /**
   * Get all children for a parent
   */
  getChildren(parentValue: string): T[] {
    return this.data.filter(item => (item as any)[this.parentKey] === parentValue);
  }

  /**
   * Get parent checkbox state (binary only - checked or unchecked)
   *
   * PHASE 4 REQUIREMENT (No tri-state/indeterminate):
   * Checked: ALL children selected
   * Unchecked: Less than ALL children selected (including none)
   *
   * This is the core algorithm from PICKER-CHECKBOX-BEHAVIOR.md
   */
  getParentState(parentValue: string): CheckboxState {
    const allChildren = this.getChildren(parentValue);
    if (allChildren.length === 0) {
      console.log(`[Helper] getParentState(${parentValue}): NO CHILDREN FOUND`);
      return 'unchecked';
    }

    const selectedChildren = this.selections.get(parentValue) || [];
    const selectedCount = selectedChildren.length;

    console.log(`[Helper] getParentState(${parentValue}): ${selectedCount}/${allChildren.length} selected`);
    console.log(`[Helper] Selected children:`, selectedChildren);
    console.log(`[Helper] All selections:`, Object.fromEntries(this.selections));

    // Binary state: checked only if ALL children selected
    if (selectedCount === allChildren.length) return 'checked';
    return 'unchecked';  // Any other state (none or some) = unchecked
  }

  /**
   * Toggle a child item
   */
  toggleChild(item: T): void {
    const parent = (item as any)[this.parentKey];
    const child = (item as any)[this.childKey];

    // Get current selections for this parent
    let selectedChildren = this.selections.get(parent) || [];

    if (selectedChildren.includes(child)) {
      // Remove child
      selectedChildren = selectedChildren.filter(c => c !== child);

      if (selectedChildren.length === 0) {
        // No children left, remove parent entry entirely
        this.selections.delete(parent);
      } else {
        // Update with remaining children
        this.selections.set(parent, selectedChildren);
      }
    } else {
      // Add child
      selectedChildren = [...selectedChildren, child];
      this.selections.set(parent, selectedChildren);
    }

    console.log(`[Helper] toggleChild(${parent}, ${child}): Now ${this.selections.get(parent)?.length || 0} selected`);
  }

  /**
   * Toggle a parent (affects ALL children)
   * Clicking indeterminate or unchecked → select all
   * Clicking checked → deselect all
   */
  toggleParent(parentValue: string): void {
    const allChildren = this.getChildren(parentValue);
    const currentState = this.getParentState(parentValue);

    if (currentState === 'checked') {
      // Deselect all children - remove parent entry
      this.selections.delete(parentValue);
      console.log(`[Helper] toggleParent(${parentValue}): Deselected all (removed from Map)`);
    } else {
      // Select all children (works for both unchecked and indeterminate)
      const allChildValues = allChildren.map(child => (child as any)[this.childKey]);
      this.selections.set(parentValue, allChildValues);
      console.log(`[Helper] toggleParent(${parentValue}): Selected all ${allChildValues.length} children`);
    }
  }

  /**
   * Clear all selections
   */
  clearAll(): void {
    this.selections.clear();
  }

  /**
   * Get all selected keys (for compatibility with SelectionChangeEvent)
   * Returns Set<string> with "parent|child" format
   */
  getSelectedKeys(): Set<string> {
    const keys = new Set<string>();

    this.selections.forEach((children, parent) => {
      children.forEach(child => {
        keys.add(`${parent}|${child}`);
      });
    });

    return keys;
  }

  /**
   * Get all selected items
   */
  getSelectedItems(): T[] {
    return this.data.filter(item => this.isSelected(item));
  }

  /**
   * Set selected keys (for hydration from URL)
   * Accepts Set<string> or string[] with "parent|child" format
   */
  setSelectedKeys(keys: Set<string> | string[]): void {
    this.selections.clear();

    const keysArray = Array.isArray(keys) ? keys : Array.from(keys);

    keysArray.forEach(key => {
      const [parent, child] = key.split('|');
      if (parent && child) {
        const selectedChildren = this.selections.get(parent) || [];
        if (!selectedChildren.includes(child)) {
          selectedChildren.push(child);
          this.selections.set(parent, selectedChildren);
        }
      }
    });

    console.log(`[Helper] setSelectedKeys: Hydrated ${keysArray.length} keys into Map:`, Object.fromEntries(this.selections));
  }

  /**
   * Get selection count (total number of selected children)
   */
  getSelectionCount(): number {
    let count = 0;
    this.selections.forEach(children => {
      count += children.length;
    });
    return count;
  }

  /**
   * Get unique parent values
   */
  getUniqueParents(): string[] {
    const parents = new Set<string>();
    this.data.forEach(item => {
      parents.add((item as any)[this.parentKey]);
    });
    return Array.from(parents);
  }
}
