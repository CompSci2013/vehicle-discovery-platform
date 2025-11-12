/*
  BASE TABLE COMPONENT

  PURPOSE:
  Universal configuration-driven table component that handles:
  - Simple tables (data display)
  - Picker tables (checkbox selection with Apply button)
  - Expandable tables (rows with sub-tables)

  ARCHITECTURE:
  One component + TableConfig = All table types
  No separate components needed for different table modes.

  USAGE:
  <app-base-table [config]="tableConfig"></app-base-table>

  FEATURES:
  ✅ Configuration-driven rendering
  ✅ Hierarchical checkbox selection (tri-state)
  ✅ Expandable rows with sub-tables
  ✅ Pagination
  ✅ Sorting and filtering
  ✅ Loading states
  ✅ Empty states
*/

import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subject } from 'rxjs';

import { TableConfig, TableColumn } from '../../models/table-config.model';
import { HierarchicalSelectionHelper, CheckboxState, SelectionChangeEvent } from '../../models/selection-state.model';

@Component({
  selector: 'app-base-table',
  templateUrl: './base-table.component.html',
  styleUrls: ['./base-table.component.scss']
})
export class BaseTableComponent implements OnInit, OnChanges, OnDestroy {
  // Configuration
  @Input() config!: TableConfig;

  // URL-first hydration (parent passes initial selection from URL)
  @Input() initialSelection?: Set<string>;

  // Events
  @Output() selectionChange = new EventEmitter<SelectionChangeEvent>();
  @Output() selectionApply = new EventEmitter<SelectionChangeEvent>();
  @Output() rowExpand = new EventEmitter<any>();
  @Output() rowCollapse = new EventEmitter<any>();

  // Table data
  data: any[] = [];
  totalRecords: number = 0;
  loading: boolean = false;

  // Pagination
  first: number = 0;  // PrimeNG paginator uses 'first' (index of first record)
  rows: number = 20;  // PrimeNG paginator uses 'rows' (page size)

  // Selection
  selectionHelper?: HierarchicalSelectionHelper;
  selectedRows: Set<string> = new Set();

  // Parent checkbox state cache (prevents infinite change detection loop)
  // Maps parentValue -> CheckboxState ('checked' | 'indeterminate' | 'unchecked')
  parentCheckboxStates = new Map<string, CheckboxState>();

  // Expandable rows
  expandedRows: Set<any> = new Set();
  subTableData: Map<any, any[]> = new Map();  // Cache for sub-table data

  // Cleanup
  private destroy$ = new Subject<void>();

  /**
   * Lifecycle: Detect changes to @Input() properties
   * Used for URL-first hydration when initialSelection changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Hydrate selection from URL when initialSelection input changes
    if (changes['initialSelection'] && this.initialSelection && this.selectionHelper) {
      console.log('[BaseTable] Hydrating selection from URL:', this.initialSelection);
      this.hydrateSelection(this.initialSelection);
    }
  }

  ngOnInit(): void {
    console.log('[BaseTable] Initializing with config:', this.config);

    // Validate configuration
    if (!this.config) {
      console.error('[BaseTable] ERROR: No config provided!');
      return;
    }

    // Initialize pagination
    if (this.config.pagination?.enabled) {
      this.rows = this.config.pagination.pageSize || 20;
    }

    // Initialize selection helper (if selection enabled)
    if (this.config.selection?.enabled && this.config.selection.hierarchical?.enabled) {
      console.log('[BaseTable] Hierarchical selection enabled');
      // We'll initialize this after data loads
    }

    // Load data
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * LOAD DATA
   * Loads data from config.data (static) or config.api (dynamic)
   */
  private loadData(): void {
    console.log('[BaseTable] loadData() called');

    // Option 1: Static data
    if (this.config.data) {
      console.log('[BaseTable] Using static data:', this.config.data.length, 'rows');
      this.data = this.config.data;
      this.totalRecords = this.data.length;

      // Initialize selection helper after data is loaded
      this.initializeSelectionHelper();
      return;
    }

    // Option 2: API data
    if (this.config.api) {
      console.log('[BaseTable] API loading not yet implemented');
      // TODO: Implement API loading in next iteration
      this.loading = true;
      return;
    }

    // No data source
    console.warn('[BaseTable] No data source configured (config.data or config.api)');
    this.data = [];
    this.totalRecords = 0;
  }

  /**
   * INITIALIZE SELECTION HELPER
   * Creates HierarchicalSelectionHelper for parent-child checkboxes
   */
  private initializeSelectionHelper(): void {
    if (!this.config.selection?.hierarchical?.enabled) {
      return;
    }

    const parentKey = this.config.selection.hierarchical.parentKey;
    const childKey = this.config.selection.hierarchical.childKey;

    console.log('[BaseTable] Creating HierarchicalSelectionHelper:', { parentKey, childKey, dataCount: this.data.length });
    this.selectionHelper = new HierarchicalSelectionHelper(this.data, parentKey, childKey);

    // Apply initial selection if provided (URL hydration)
    if (this.initialSelection && this.initialSelection.size > 0) {
      console.log('[BaseTable] Applying initial selection from URL:', this.initialSelection);
      this.hydrateSelection(this.initialSelection);
    }

    // Build initial parent checkbox state cache
    this.updateParentCheckboxStateCache();
  }

  /**
   * HYDRATE SELECTION (URL-first state management)
   * Restores selection state from URL query parameters
   * Called when initialSelection input changes or after data loads
   */
  private hydrateSelection(keys: Set<string>): void {
    if (!this.selectionHelper) {
      console.warn('[BaseTable] Cannot hydrate: selection helper not initialized');
      return;
    }

    console.log('[BaseTable] Hydrating selection with keys:', keys);
    this.selectionHelper.setSelectedKeys(keys);

    // Update parent checkbox state cache
    this.updateParentCheckboxStateCache();

    // Emit selection change to update parent component's display
    this.emitSelectionChange();
  }

  /**
   * UPDATE PARENT CHECKBOX STATE CACHE
   * Builds cache of all parent checkbox states to prevent infinite change detection loops
   * This cache is used by the template instead of calling getParentCheckboxState() directly
   */
  private updateParentCheckboxStateCache(): void {
    if (!this.selectionHelper) {
      return;
    }

    // Clear existing cache
    this.parentCheckboxStates.clear();

    // Build cache for all unique parents
    const parents = this.selectionHelper.getUniqueParents();
    parents.forEach(parentValue => {
      const state = this.selectionHelper!.getParentState(parentValue);
      this.parentCheckboxStates.set(parentValue, state);
    });

    console.log('[BaseTable] Updated parent checkbox state cache:', this.parentCheckboxStates.size, 'parents');
  }

  /**
   * CHECKBOX: Is row selected?
   */
  isRowSelected(row: any): boolean {
    if (!this.selectionHelper) {
      return false;
    }
    return this.selectionHelper.isSelected(row);
  }

  /**
   * CHECKBOX: Get parent checkbox state (tri-state logic)
   * NOTE: This method should NOT be called from templates (causes infinite loop).
   * Templates should use getCachedParentState() instead which uses the cache.
   */
  getParentCheckboxState(parentValue: string): CheckboxState {
    if (!this.selectionHelper) {
      return 'unchecked';
    }
    return this.selectionHelper.getParentState(parentValue);
  }

  /**
   * CHECKBOX: Get cached parent checkbox state (for template use)
   * Uses cached state to prevent infinite change detection loops
   */
  getCachedParentState(parentValue: string): CheckboxState {
    return this.parentCheckboxStates.get(parentValue) || 'unchecked';
  }

  /**
   * CHECKBOX: Get parent checkbox value for PrimeNG (true/false/null)
   * PrimeNG tri-state checkbox expects: true (checked), false (unchecked), null (indeterminate)
   */
  getParentCheckboxValue(parentValue: string): boolean | null {
    const state = this.getParentCheckboxState(parentValue);
    if (state === 'checked') return true;
    if (state === 'unchecked') return false;
    return null; // indeterminate
  }

  /**
   * CHECKBOX: Toggle child row
   */
  onChildCheckboxChange(row: any, event: any): void {
    console.log('[BaseTable] onChildCheckboxChange:', row, 'checked:', event.checked);

    if (!this.selectionHelper) {
      console.warn('[BaseTable] Selection helper not initialized');
      return;
    }

    this.selectionHelper.toggleChild(row);

    // Update parent checkbox state cache
    this.updateParentCheckboxStateCache();

    // Emit selection change event
    this.emitSelectionChange();
  }

  /**
   * CHECKBOX: Toggle parent (affects all children)
   *
   * BEHAVIOR (per CHECKBOX-BEHAVIOR.md):
   * - If parent is CHECKED (all children selected) → Click UNCHECKS all children
   * - If parent is UNCHECKED or INDETERMINATE → Click CHECKS all children
   */
  onParentCheckboxChange(parentValue: string, event: any): void {
    console.log('[BaseTable] onParentCheckboxChange:', parentValue, 'event:', event);

    if (!this.selectionHelper) {
      console.warn('[BaseTable] Selection helper not initialized');
      return;
    }

    // toggleParent already implements the correct behavior:
    // - checked → deselect all
    // - unchecked or indeterminate → select all
    this.selectionHelper.toggleParent(parentValue);

    // Update parent checkbox state cache
    this.updateParentCheckboxStateCache();

    // Emit selection change event
    this.emitSelectionChange();
  }

  /**
   * SELECTION: Emit selection change event
   */
  private emitSelectionChange(): void {
    if (!this.selectionHelper) {
      return;
    }

    const event: SelectionChangeEvent = {
      selectedKeys: this.selectionHelper.getSelectedKeys(),
      selectedItems: this.selectionHelper.getSelectedItems()
    };

    console.log('[BaseTable] Emitting selectionChange:', event.selectedKeys.size, 'items');
    this.selectionChange.emit(event);
  }

  /**
   * SELECTION: Apply button clicked
   */
  onApplySelection(): void {
    if (!this.selectionHelper) {
      return;
    }

    const event: SelectionChangeEvent = {
      selectedKeys: this.selectionHelper.getSelectedKeys(),
      selectedItems: this.selectionHelper.getSelectedItems()
    };

    console.log('[BaseTable] Emitting selectionApply:', event.selectedKeys.size, 'items');
    this.selectionApply.emit(event);
  }

  /**
   * SELECTION: Clear all selections
   */
  onClearSelection(): void {
    if (!this.selectionHelper) {
      return;
    }

    console.log('[BaseTable] Clearing all selections');
    this.selectionHelper.clearAll();

    // Update parent checkbox state cache
    this.updateParentCheckboxStateCache();

    this.emitSelectionChange();
  }

  /**
   * SELECTION: Get selection count
   */
  getSelectionCount(): number {
    if (!this.selectionHelper) {
      return 0;
    }
    return this.selectionHelper.getSelectionCount();
  }

  /**
   * EXPANDABLE: Is row expanded?
   */
  isRowExpanded(row: any): boolean {
    return this.expandedRows.has(row);
  }

  /**
   * EXPANDABLE: Toggle row expansion
   */
  toggleRowExpansion(row: any): void {
    console.log('[BaseTable] toggleRowExpansion:', row);

    if (this.isRowExpanded(row)) {
      // Collapse
      this.expandedRows.delete(row);
      this.rowCollapse.emit(row);
    } else {
      // Expand
      this.expandedRows.add(row);
      this.rowExpand.emit(row);

      // Load sub-table data if needed
      this.loadSubTableData(row);
    }
  }

  /**
   * EXPANDABLE: Load sub-table data
   */
  private loadSubTableData(parentRow: any): void {
    if (!this.config.expandable?.subTable) {
      return;
    }

    const subTableConfig = this.config.expandable.subTable;

    // Option 1: Data is in parent row
    if (subTableConfig.dataKey && parentRow[subTableConfig.dataKey]) {
      console.log('[BaseTable] Sub-table data found in parent row:', subTableConfig.dataKey);
      this.subTableData.set(parentRow, parentRow[subTableConfig.dataKey]);
      return;
    }

    // Option 2: Fetch from API
    if (subTableConfig.api) {
      console.log('[BaseTable] Sub-table API loading not yet implemented');
      // TODO: Implement API loading in next iteration
      return;
    }

    console.warn('[BaseTable] No sub-table data source configured');
  }

  /**
   * EXPANDABLE: Get sub-table data for row
   */
  getSubTableData(parentRow: any): any[] {
    return this.subTableData.get(parentRow) || [];
  }

  /**
   * PAGINATION: Page change event
   */
  onPageChange(event: any): void {
    console.log('[BaseTable] Page changed:', event);
    this.first = event.first;
    this.rows = event.rows;

    // If using API, reload data with new page
    if (this.config.api) {
      this.loadData();
    }
  }

  /**
   * UTILITY: Get visible columns
   */
  getVisibleColumns(): TableColumn[] {
    return this.config.columns.filter(col => col.visible !== false);
  }

  /**
   * UTILITY: Get unique parent values (for hierarchical rendering)
   */
  getUniqueParents(): string[] {
    if (!this.selectionHelper) {
      return [];
    }
    return this.selectionHelper.getUniqueParents();
  }

  /**
   * UTILITY: Get children for parent
   */
  getChildrenForParent(parentValue: string): any[] {
    if (!this.selectionHelper) {
      return [];
    }
    return this.selectionHelper.getChildren(parentValue);
  }
}
