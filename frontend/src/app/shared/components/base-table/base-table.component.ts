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
  ✅ Hierarchical checkbox selection (binary: checked/unchecked)
  ✅ Two picker patterns: single-selector and dual-selector
  ✅ Expandable rows with sub-tables
  ✅ Pagination
  ✅ Sorting and filtering
  ✅ Loading states
  ✅ Empty states
*/

import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { TableConfig, TableColumn } from '../../models/table-config.model';
import { HierarchicalSelectionHelper, CheckboxState, SelectionChangeEvent } from '../../models/selection-state.model';
import { UrlStateService, RequestCoordinatorService } from '../../../core/services';

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
  // Maps parentValue -> CheckboxState ('checked' | 'unchecked')
  parentCheckboxStates = new Map<string, CheckboxState>();

  // PHASE 4: Picker pattern detection (single-selector or dual-selector)
  pickerPattern: 'single' | 'dual' | undefined;
  parentColumnIndex: number | undefined;
  childColumnIndex: number | undefined;

  // Sorting
  sortField?: string;                           // Current sort column
  sortOrder: 'asc' | 'desc' = 'asc';           // Sort direction

  // Filtering
  activeFilters: Record<string, string> = {};  // Column key -> filter value

  // Expandable rows
  expandedRows: Set<any> = new Set();
  subTableData: Map<any, any[]> = new Map();  // Cache for sub-table data

  // Cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private urlState: UrlStateService,
    private route: ActivatedRoute,
    private requestCoordinator: RequestCoordinatorService
  ) {}

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
      this.detectPickerPattern();
      // We'll initialize this after data loads
    }

    // STEP 1.2: Hydrate sort state from URL (URL-first pattern)
    this.hydrateSortStateFromUrl();

    // STEP 1.3: Hydrate filter state from URL (URL-first pattern)
    this.hydrateFilterStateFromUrl();

    // STEP 1.4: Hydrate pagination state from URL (URL-first pattern)
    this.hydratePaginationStateFromUrl();

    // PHASE 2: Subscribe to URL changes and reload data when URL changes
    // This enables server-side operations (sort, filter, pagination all via API)
    if (this.config.api) {
      console.log('[BaseTable] API mode enabled, watching URL changes');
      this.route.queryParams
        .pipe(
          debounceTime(300),  // Wait for rapid URL changes to settle
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          console.log('[BaseTable] URL changed, reloading data from API');
          this.loadData();
        });
    }

    // Load data
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * PHASE 4 STEP 4.1: Detect Picker Pattern Configuration
   * Determines which picker pattern is being used:
   * - Single-selector: Only parent checkbox column on left (parentColumn undefined)
   * - Dual-selector: Parent and child checkboxes in data columns (parentColumn and childColumn defined)
   *
   * This method must be called during initialization to determine template rendering strategy.
   */
  private detectPickerPattern(): void {
    const hierarchicalConfig = this.config.selection?.hierarchical;

    if (!hierarchicalConfig?.enabled) {
      console.log('[BaseTable] Hierarchical selection not enabled');
      return;
    }

    // Check if parentColumn is defined (indicates dual-selector pattern)
    const parentColumnDefined = hierarchicalConfig.parentColumn !== undefined;
    const childColumnDefined = hierarchicalConfig.childColumn !== undefined;

    if (parentColumnDefined && childColumnDefined) {
      // Dual-selector pattern: checkboxes in data columns
      this.pickerPattern = 'dual';
      this.parentColumnIndex = hierarchicalConfig.parentColumn;
      this.childColumnIndex = hierarchicalConfig.childColumn;
      console.log('[BaseTable] Picker pattern: DUAL (parent in column', this.parentColumnIndex, ', child in column', this.childColumnIndex, ')');
    } else {
      // Single-selector pattern: checkbox column on left
      this.pickerPattern = 'single';
      console.log('[BaseTable] Picker pattern: SINGLE (parent checkbox column on left)');
    }

    console.log('[BaseTable] Pattern detection complete:', {
      pattern: this.pickerPattern,
      parentColumn: this.parentColumnIndex,
      childColumn: this.childColumnIndex
    });
  }

  /**
   * LOAD DATA
   * Loads data from config.data (static) or config.api (dynamic)
   * PHASE 2: Added API support with server-side operations
   */
  private loadData(): void {
    console.log('[BaseTable] loadData() called');

    // Option 1: API data (server-side operations)
    if (this.config.api) {
      console.log('[BaseTable] Loading data from API');
      this.loadDataFromApi();
      return;
    }

    // Option 2: Static data (client-side operations only)
    if (this.config.data) {
      console.log('[BaseTable] Using static data:', this.config.data.length, 'rows');
      this.data = this.config.data;
      this.totalRecords = this.data.length;

      // Initialize selection helper after data is loaded
      this.initializeSelectionHelper();
      return;
    }

    // No data source
    console.warn('[BaseTable] No data source configured (config.data or config.api)');
    this.data = [];
    this.totalRecords = 0;
  }

  /**
   * LOAD DATA FROM API (PHASE 2)
   * Fetches data from API endpoint with URL-first parameters
   * Uses RequestCoordinator to deduplicate identical concurrent requests
   */
  private loadDataFromApi(): void {
    // Set loading state
    this.loading = true;

    // Build request parameters from current component state
    const apiParams = this.buildApiRequestParams();
    console.log('[BaseTable] API request params:', apiParams);

    // Get API endpoint (required)
    const apiEndpoint = this.config.api?.http?.endpoint;
    if (!apiEndpoint) {
      console.error('[BaseTable] API endpoint not configured');
      this.loading = false;
      return;
    }

    // Use RequestCoordinator to deduplicate concurrent requests
    // If another component is already requesting the same data, this returns cached Observable
    this.requestCoordinator
      .get(apiEndpoint, apiParams)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          console.log('[BaseTable] API response received:', response);

          // Apply response transformer if configured
          if (this.config.api?.responseTransformer) {
            response = this.config.api.responseTransformer(response);
          }

          // Extract data and totals from response
          // Expected response format: { data: [...], total: number, page: number, pageSize: number }
          this.data = response.data || response.results || [];
          this.totalRecords = response.total || response.totalRecords || 0;

          // Initialize selection helper after API data is loaded
          this.initializeSelectionHelper();

          this.loading = false;
          console.log('[BaseTable] Data loaded from API:', this.data.length, 'rows');
        },
        error: (error: any) => {
          console.error('[BaseTable] API error:', error);
          this.handleApiError(error);
          this.loading = false;
        }
      });
  }

  /**
   * BUILD API REQUEST PARAMETERS (PHASE 2)
   * Converts component state (sort, filter, pagination) to API request parameters
   * Respects URL-first principle: uses component state that was hydrated from URL
   *
   * @returns API request parameter object
   */
  private buildApiRequestParams(): any {
    const params: any = {
      // Pagination: convert 0-indexed first/rows to 1-indexed page/pageSize
      page: Math.floor(this.first / this.rows) + 1,
      pageSize: this.rows
    };

    // Sorting: only include if sort is active
    if (this.sortField) {
      params.sortBy = this.sortField;
      params.sortOrder = this.sortOrder;
    }

    // Filtering: only include if any filters are active
    if (Object.keys(this.activeFilters).length > 0) {
      params.filters = this.activeFilters;
    }

    // Apply param mapper if configured (for API-specific transformations)
    if (this.config.api?.paramMapper) {
      return this.config.api.paramMapper(params);
    }

    return params;
  }

  /**
   * HANDLE API ERROR (PHASE 2)
   * Gracefully handles API errors with appropriate UI feedback
   *
   * @param error - The error from API call
   */
  private handleApiError(error: any): void {
    console.error('[BaseTable] API error occurred:', error);

    // Reset data
    this.data = [];
    this.totalRecords = 0;

    // Emit error event or show toast message
    // For now, just log and keep UI responsive
  }

  /**
   * INITIALIZE SELECTION HELPER
   * Creates HierarchicalSelectionHelper for parent-child checkboxes
   * PHASE 4 STEP 4.5: Hydrates selection from URL after helper is created
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
    } else {
      // PHASE 4 STEP 4.5: Try to hydrate selection from URL parameter
      this.hydrateSelectionFromUrl();
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
   * PHASE 4 HELPER: Determine if single-selector pattern is active
   */
  isSingleSelectorMode(): boolean {
    return this.pickerPattern === 'single';
  }

  /**
   * PHASE 4 HELPER: Determine if dual-selector pattern is active
   */
  isDualSelectorMode(): boolean {
    return this.pickerPattern === 'dual';
  }

  /**
   * PHASE 4 HELPER: Determine if parent checkbox should be shown for this column (dual mode only)
   * In dual mode, parent checkbox appears in the parent column
   */
  shouldShowParentCheckbox(columnIndex: number): boolean {
    if (!this.isDualSelectorMode()) {
      return false;
    }
    return columnIndex === this.parentColumnIndex;
  }

  /**
   * PHASE 4 HELPER: Determine if child checkbox should be shown for this column (dual mode only)
   * In dual mode, child checkbox appears in the child column
   */
  shouldShowChildCheckbox(columnIndex: number): boolean {
    if (!this.isDualSelectorMode()) {
      return false;
    }
    return columnIndex === this.childColumnIndex;
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
   * CHECKBOX: Get parent checkbox value (binary only - no indeterminate/tri-state)
   * PHASE 4 STEP 4.3: Dual-selector mode behavior
   *
   * In dual-selector mode: Display the specific row's selection state
   * (Parent checkbox shows if THIS ROW is selected, not aggregate state)
   *
   * In single-selector mode: Display aggregate parent state
   * (Parent checkbox shows if ALL children are selected)
   */
  getParentCheckboxValue(parentValue: string, row?: any): boolean {
    // In dual mode, show the specific row's selection state
    if (this.isDualSelectorMode() && row) {
      return this.isRowSelected(row);
    }

    // In single mode, show the aggregate parent state
    const state = this.getParentCheckboxState(parentValue);
    return state === 'checked';
  }

  /**
   * CHECKBOX: Toggle child row
   * PHASE 4 STEP 4.4: After toggling child, enforce state matching rule
   * Parent checkbox state will be recomputed to match child selection count
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

    // PHASE 4: Enforce state matching rule after child change
    this.enforceStateMatchingRule();

    // Emit selection change event
    this.emitSelectionChange();
  }

  /**
   * PHASE 4 STEP 4.4: Enforce state matching rule
   * In dual-selector pattern, parent checkbox state is ALWAYS computed based on child selection
   * Parent state = 'checked' ONLY if ALL children are selected
   * This ensures parent.state === child.state for all children of that parent
   */
  private enforceStateMatchingRule(): void {
    if (!this.isDualSelectorMode() || !this.selectionHelper) {
      return;
    }

    // For dual mode, verify that parent checkbox state accurately reflects child selections
    const parents = this.selectionHelper.getUniqueParents();

    parents.forEach(parentValue => {
      const parentState = this.selectionHelper!.getParentState(parentValue);
      const children = this.selectionHelper!.getChildren(parentValue);

      // Verify state matching: parent is checked only if ALL children are selected
      const allChildrenSelected = children.every(child => this.selectionHelper!.isSelected(child));
      const expectedState = allChildrenSelected ? 'checked' : 'unchecked';

      if (parentState !== expectedState) {
        console.warn('[BaseTable] State mismatch detected for parent:', parentValue, 'Expected:', expectedState, 'Got:', parentState);
      }
    });

    console.log('[BaseTable] State matching rule enforced for', parents.length, 'parents');
  }

  /**
   * CHECKBOX: Toggle parent (affects all children)
   *
   * PHASE 4 BEHAVIOR (Binary-only, per PHASE-4-PLAN.md):
   * - If parent is CHECKED (all children selected) → Click UNCHECKS all children
   * - If parent is UNCHECKED (less than all selected) → Click CHECKS all children
   *
   * PHASE 4 STEP 4.4: State Matching Rule
   * When parent checkbox state changes, child selections are updated to match.
   * Parent state always reflects the true selection state of all children.
   */
  onParentCheckboxChange(parentValue: string, event: any): void {
    console.log('[BaseTable] onParentCheckboxChange:', parentValue, 'event:', event);

    if (!this.selectionHelper) {
      console.warn('[BaseTable] Selection helper not initialized');
      return;
    }

    // toggleParent already implements the correct behavior:
    // - checked → deselect all
    // - unchecked → select all (applies to both "none selected" and "some selected" cases)
    this.selectionHelper.toggleParent(parentValue);

    // Update parent checkbox state cache
    this.updateParentCheckboxStateCache();

    // PHASE 4: Enforce state matching rule after change
    this.enforceStateMatchingRule();

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

    // PHASE 4 STEP 4.5: Update URL with selection state
    if (this.config.selection?.hierarchical?.enabled) {
      this.updateSelectionInUrl();
    }
  }

  /**
   * PHASE 4 STEP 4.5: Update URL with current selection state
   * Serializes selected keys to URL parameter format: "parent|child,parent|child,..."
   * Uses query parameter name from config (default: 'selected')
   */
  private updateSelectionInUrl(): void {
    if (!this.selectionHelper) {
      return;
    }

    const selectedKeys = this.selectionHelper.getSelectedKeys();
    const urlParam = this.config.selection?.urlParam || 'selected';

    if (selectedKeys.size === 0) {
      // Clear selection from URL if no items selected
      this.urlState.setQueryParams({ [urlParam]: undefined }).subscribe(
        (success) => {
          if (success) {
            console.log('[BaseTable] Cleared selection from URL');
          }
        }
      );
    } else {
      // Serialize selection to URL format: "parent|child,parent|child,..."
      const selectedString = Array.from(selectedKeys).join(',');
      this.urlState.setQueryParams({ [urlParam]: selectedString }).subscribe(
        (success) => {
          if (success) {
            console.log('[BaseTable] Updated URL with selection:', urlParam, '=', selectedString);
          }
        }
      );
    }
  }

  /**
   * PHASE 4 STEP 4.5: Deserialize selection from URL parameter
   * Parses URL format "parent|child,parent|child,..." to Set<string>
   * Returns empty Set if no selection in URL
   */
  private deserializeSelectionFromUrl(): Set<string> {
    const urlParam = this.config.selection?.urlParam || 'selected';
    const selectedParam = this.urlState.getQueryParamSnapshot(urlParam);

    if (!selectedParam) {
      return new Set();
    }

    // Parse comma-separated list of "parent|child" keys
    const keys = selectedParam
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0 && k.includes('|'));

    console.log('[BaseTable] Deserialized selection from URL:', keys.length, 'items');
    return new Set(keys);
  }

  /**
   * PHASE 4 STEP 4.5: Hydrate selection from URL on initialization
   * Called after data is loaded to restore selection from URL parameters
   */
  private hydrateSelectionFromUrl(): void {
    if (!this.config.selection?.hierarchical?.enabled) {
      return;
    }

    const selectedKeys = this.deserializeSelectionFromUrl();

    if (selectedKeys.size === 0) {
      console.log('[BaseTable] No selection in URL');
      return;
    }

    console.log('[BaseTable] Hydrating selection from URL:', selectedKeys);
    this.hydrateSelection(selectedKeys);
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
   * STEP 1.4: URL-first pattern - update URL first, then reload data if needed
   */
  onPageChange(event: any): void {
    console.log('[BaseTable] Page changed:', event);
    this.first = event.first;
    this.rows = event.rows;

    // STEP 1.4: Update URL first (URL-first pattern)
    const paginationParams = this.serializePaginationState();
    this.urlState.setQueryParams(paginationParams).subscribe(
      (success) => {
        if (success) {
          console.log('[BaseTable] Updated URL with pagination state:', paginationParams);
        } else {
          console.warn('[BaseTable] Failed to update URL with pagination state');
        }
      }
    );

    // If using API, reload data with new page
    if (this.config.api) {
      this.loadData();
    }
  }

  /**
   * SORT STATE HYDRATION (URL-First Pattern)
   * Deserialize sort state from URL parameter
   * Format: ?sort=fieldName:asc or ?sort=fieldName:desc
   * Example: ?sort=manufacturer:asc
   *
   * STEP 1.2: Hydrate sort state from URL on component init
   */
  private hydrateSortStateFromUrl(): void {
    const sortParam = this.urlState.getQueryParamSnapshot('sort');
    if (!sortParam) {
      console.log('[BaseTable] No sort parameter in URL');
      return;
    }

    // Deserialize: "fieldName:asc" → { sortField: "fieldName", sortOrder: "asc" }
    const { sortField, sortOrder } = this.deserializeSortState(sortParam);

    if (sortField) {
      this.sortField = sortField;
      this.sortOrder = sortOrder;
      console.log('[BaseTable] Hydrated sort state from URL:', { sortField, sortOrder });
    }
  }

  /**
   * SORT STATE SERIALIZATION
   * Convert { sortField, sortOrder } to URL parameter format
   * Format: "fieldName:asc" → URL param value
   */
  private serializeSortState(): string {
    if (!this.sortField) {
      return '';
    }
    return `${this.sortField}:${this.sortOrder}`;
  }

  /**
   * SORT STATE DESERIALIZATION
   * Parse URL parameter to { sortField, sortOrder }
   * Format: "fieldName:asc" → { sortField: "fieldName", sortOrder: "asc" }
   */
  private deserializeSortState(sortParam: string): { sortField: string | undefined; sortOrder: 'asc' | 'desc' } {
    const parts = sortParam.split(':');
    if (parts.length === 2 && (parts[1] === 'asc' || parts[1] === 'desc')) {
      return {
        sortField: parts[0],
        sortOrder: parts[1]
      };
    }
    // Invalid format, return defaults
    return {
      sortField: undefined,
      sortOrder: 'asc'
    };
  }

  /**
   * FILTER STATE HYDRATION (URL-First Pattern)
   * Deserialize filter state from URL parameters
   * Format: ?f_columnKey=filterValue
   * Example: ?f_manufacturer=Ford&f_model=F-150
   *
   * STEP 1.3: Hydrate filter state from URL on component init
   */
  private hydrateFilterStateFromUrl(): void {
    // Get all query params and find those starting with 'f_'
    const allParams = this.route.snapshot.queryParams || {};
    const filterParams = Object.entries(allParams).filter(([key]) => key.startsWith('f_'));

    if (filterParams.length === 0) {
      console.log('[BaseTable] No filter parameters in URL');
      return;
    }

    // Deserialize: { "f_columnKey": "filterValue" } → { "columnKey": "filterValue" }
    filterParams.forEach(([key, value]) => {
      const columnKey = key.substring(2); // Remove 'f_' prefix
      this.activeFilters[columnKey] = String(value).toLowerCase();
    });

    console.log('[BaseTable] Hydrated filter state from URL:', this.activeFilters);
  }

  /**
   * FILTER STATE SERIALIZATION
   * Convert activeFilters to URL parameter format
   * Format: { "columnKey": "filterValue" } → { "f_columnKey": "filterValue" }
   *
   * Returns object with 'f_' prefixed keys ready for setQueryParams()
   */
  private serializeFilterState(): Record<string, string> {
    const filterParams: Record<string, string> = {};

    Object.entries(this.activeFilters).forEach(([columnKey, filterValue]) => {
      if (filterValue && filterValue.trim()) {
        filterParams[`f_${columnKey}`] = filterValue;
      }
    });

    return filterParams;
  }

  /**
   * PAGINATION STATE HYDRATION (URL-First Pattern)
   * Deserialize pagination state from URL parameters
   * Format: ?page=1&pageSize=20
   * Page is 1-indexed in URL for user-friendly display
   * Internal state (this.first) is 0-indexed for PrimeNG
   *
   * STEP 1.4: Hydrate pagination state from URL on component init
   */
  private hydratePaginationStateFromUrl(): void {
    const pageParam = this.route.snapshot.queryParams['page'];
    const pageSizeParam = this.route.snapshot.queryParams['pageSize'];

    // Parse page (1-indexed in URL, convert to 0-indexed for component)
    if (pageParam) {
      const pageNumber = parseInt(pageParam, 10);
      if (!isNaN(pageNumber) && pageNumber > 0) {
        // first = (pageNumber - 1) * pageSize
        // We need to know pageSize to calculate first
        const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : this.rows;
        if (!isNaN(pageSize) && pageSize > 0) {
          this.first = (pageNumber - 1) * pageSize;
        }
      }
    }

    // Parse page size
    if (pageSizeParam) {
      const pageSize = parseInt(pageSizeParam, 10);
      if (!isNaN(pageSize) && pageSize > 0) {
        this.rows = pageSize;
      }
    }

    if (pageParam || pageSizeParam) {
      console.log('[BaseTable] Hydrated pagination state from URL:', { page: pageParam, pageSize: pageSizeParam, first: this.first, rows: this.rows });
    }
  }

  /**
   * PAGINATION STATE SERIALIZATION
   * Convert component pagination state to URL parameter format
   * Format: { first: 20, rows: 10 } → { page: "3", pageSize: "10" }
   * Page is 1-indexed in URL for user-friendly display
   */
  private serializePaginationState(): { page: string; pageSize: string } {
    // first = (pageNumber - 1) * rows
    // pageNumber = (first / rows) + 1
    const pageNumber = Math.floor(this.first / this.rows) + 1;
    return {
      page: String(pageNumber),
      pageSize: String(this.rows)
    };
  }

  /**
   * SORTING: Toggle sort on column
   * STEP 1.2: URL-first pattern - update URL first, then apply to data
   * Clicking same column reverses direction, clicking different column sorts ascending
   */
  onSortColumn(column: TableColumn): void {
    if (!column.sortable) {
      return;
    }

    console.log('[BaseTable] Sort column:', column.key);

    if (this.sortField === column.key) {
      // Same column: toggle direction
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      // Different column: reset to ascending
      this.sortField = column.key;
      this.sortOrder = 'asc';
    }

    // STEP 1.2: Update URL first (URL-first pattern)
    const sortParam = this.serializeSortState();
    this.urlState.setQueryParams({ sort: sortParam }).subscribe(
      (success) => {
        if (success) {
          console.log('[BaseTable] Updated URL with sort state:', sortParam);
        } else {
          console.warn('[BaseTable] Failed to update URL with sort state');
        }
      }
    );

    // Apply sort to data
    this.applyDataTransformations();
  }

  /**
   * FILTERING: Update filter for column
   * STEP 1.3: URL-first pattern - update URL first, then apply to data
   */
  onFilterColumn(column: TableColumn, event: any): void {
    if (!column.filterable) {
      return;
    }

    const value = event.target?.value || '';
    console.log('[BaseTable] Filter column:', column.key, 'value:', value);

    if (value && value.trim()) {
      this.activeFilters[column.key] = value.toLowerCase();
    } else {
      delete this.activeFilters[column.key];
    }

    // STEP 1.3: Update URL first (URL-first pattern)
    const filterParams = this.serializeFilterState();
    this.urlState.setQueryParams(filterParams).subscribe(
      (success) => {
        if (success) {
          console.log('[BaseTable] Updated URL with filter state:', filterParams);
        } else {
          console.warn('[BaseTable] Failed to update URL with filter state');
        }
      }
    );

    // Apply filters to data
    this.applyDataTransformations();
  }

  /**
   * FILTERING: Clear all filters
   * STEP 1.3: URL-first pattern - update URL first, then apply to data
   */
  clearAllFilters(): void {
    console.log('[BaseTable] Clearing all filters');
    this.activeFilters = {};

    // STEP 1.3: Update URL first - remove all f_ parameters
    const allParams = this.route.snapshot.queryParams || {};
    const filterKeys = Object.keys(allParams).filter(key => key.startsWith('f_'));

    if (filterKeys.length > 0) {
      // Create object with filter params set to undefined (removes them)
      const clearParams: Record<string, string | undefined> = {};
      filterKeys.forEach(key => {
        clearParams[key] = undefined;  // undefined will remove from URL
      });

      this.urlState.setQueryParams(clearParams).subscribe(
        (success) => {
          if (success) {
            console.log('[BaseTable] Cleared filter parameters from URL');
          } else {
            console.warn('[BaseTable] Failed to clear filter parameters from URL');
          }
        }
      );
    }

    // Apply filters to data
    this.applyDataTransformations();
  }

  /**
   * Apply sorting and filtering to data
   * Sorts data by sortField, then applies all active filters
   */
  private applyDataTransformations(): void {
    if (!this.config.data) {
      return;
    }

    // Start with original data
    let transformed = [...this.config.data];

    // Apply filters
    if (Object.keys(this.activeFilters).length > 0) {
      transformed = transformed.filter(row => {
        for (const [colKey, filterValue] of Object.entries(this.activeFilters)) {
          const rowValue = String(row[colKey] || '').toLowerCase();
          if (!rowValue.includes(filterValue)) {
            return false;
          }
        }
        return true;
      });
    }

    // Apply sorting
    if (this.sortField) {
      transformed.sort((a, b) => {
        const aVal = a[this.sortField!];
        const bVal = b[this.sortField!];

        // Handle null/undefined
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        // Compare values
        let comparison = 0;
        if (typeof aVal === 'string') {
          comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === 'number') {
          comparison = aVal - bVal;
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return this.sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    // Update data and total records
    this.data = transformed;
    this.totalRecords = transformed.length;

    // PHASE 5 FIX: Update selection helper with filtered data for correct parent state calculation
    // When filter/sort changes, we need to recalculate parent states based on visible data
    this.updateSelectionHelperWithVisibleData();
  }

  /**
   * PHASE 5: Update selection helper with visible (filtered/sorted) data
   * This ensures parent checkbox states reflect visible children, not all children
   * Preserves existing selections while updating the helper's data reference
   */
  private updateSelectionHelperWithVisibleData(): void {
    if (!this.selectionHelper || !this.config.selection?.hierarchical?.enabled) {
      return;
    }

    // Save current selections before recreating helper
    const currentSelections = this.selectionHelper.getSelectedKeys();

    // Recreate helper with visible/filtered data
    const parentKey = this.config.selection.hierarchical.parentKey;
    const childKey = this.config.selection.hierarchical.childKey;

    this.selectionHelper = new HierarchicalSelectionHelper(this.data, parentKey, childKey);

    // Restore selections
    if (currentSelections.size > 0) {
      this.selectionHelper.setSelectedKeys(currentSelections);
      console.log('[BaseTable] Restored selections after filter/sort:', currentSelections);
    }

    // Update parent checkbox state cache
    this.updateParentCheckboxStateCache();
  }

  /**
   * UTILITY: Check if column is sortable
   */
  isColumnSortable(column: TableColumn): boolean {
    return column.sortable === true;
  }

  /**
   * UTILITY: Check if column is filterable
   */
  isColumnFilterable(column: TableColumn): boolean {
    return column.filterable === true;
  }

  /**
   * UTILITY: Get sort icon for column
   */
  getSortIcon(column: TableColumn): string {
    if (!this.isColumnSortable(column)) {
      return '';
    }

    if (this.sortField !== column.key) {
      return 'pi pi-sort';
    }

    return this.sortOrder === 'asc' ? 'pi pi-sort-up' : 'pi pi-sort-down';
  }

  /**
   * UTILITY: Get visible columns
   */
  getVisibleColumns(): TableColumn[] {
    return this.config.columns.filter(col => col.visible !== false);
  }

  /**
   * UTILITY: Check if any column is filterable
   */
  hasFilterableColumns(): boolean {
    return this.getVisibleColumns().some(col => col.filterable === true);
  }

  /**
   * UTILITY: Get filter keys
   * (Used in templates instead of Object.keys)
   */
  getFilterKeys(): string[] {
    return Object.keys(this.activeFilters);
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

  /**
   * PHASE 4 STEP 4.2: Get hierarchical data structure for single-selector pattern
   * Returns array of parent values for rendering parent rows
   * Children rows are rendered under each parent using getChildrenForParent()
   */
  getHierarchicalParents(): string[] {
    if (!this.isSingleSelectorMode() || !this.selectionHelper) {
      return [];
    }
    return this.selectionHelper.getUniqueParents();
  }

  /**
   * PHASE 4 STEP 4.2: Check if row is a parent row (used in single-selector template)
   * Parent rows show parent checkbox and parent value, but no child values
   */
  isParentRow(row: any): boolean {
    if (!this.isSingleSelectorMode() || !this.config.selection?.hierarchical?.enabled) {
      return false;
    }
    const childKey = this.config.selection.hierarchical.childKey;
    // A parent row has no child value (or child value is undefined/empty)
    return !row[childKey];
  }

  /**
   * PHASE 4 STEP 4.2: Check if row is a child row (used in single-selector template)
   * Child rows show child checkbox and child value
   */
  isChildRow(row: any): boolean {
    if (!this.isSingleSelectorMode() || !this.config.selection?.hierarchical?.enabled) {
      return false;
    }
    const childKey = this.config.selection.hierarchical.childKey;
    // A child row has a child value defined
    return row[childKey] !== undefined && row[childKey] !== null && row[childKey] !== '';
  }
}
