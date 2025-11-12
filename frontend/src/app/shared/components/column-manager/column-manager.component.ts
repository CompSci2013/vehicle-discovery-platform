/*
  COLUMN MANAGER COMPONENT

  PURPOSE:
  Provides UI for managing column visibility, order, and width.
  Allows users to customize table column layout and persist preferences.

  ARCHITECTURE:
  - Separate component from BaseTable (separation of concerns)
  - Can be displayed as modal, dropdown, or sidebar
  - Integrates with ColumnPreferencesService for persistence

  FEATURES:
  - Toggle column visibility (show/hide)
  - Reorder columns (up/down buttons)
  - Resize column widths
  - Apply/Cancel/Reset buttons
  - Real-time preview (optional)

  USAGE:
  <app-column-manager
    [config]="tableConfig"
    [columns]="columns"
    [preferences]="savedPreferences"
    (preferencesChange)="onPreferencesChange($event)"
    (apply)="onApply($event)"
    (cancel)="onCancel()">
  </app-column-manager>
*/

import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TableConfig, TableColumn } from '../../models/table-config.model';
import {
  ColumnPreferencesService,
  ColumnPreferences,
  ColumnState
} from '../../services/column-preferences.service';

/**
 * COLUMN MANAGER COMPONENT
 *
 * Manages column visibility, order, and width for tables.
 * Provides UI controls and persistence via localStorage.
 */
@Component({
  selector: 'app-column-manager',
  templateUrl: './column-manager.component.html',
  styleUrls: ['./column-manager.component.scss']
})
export class ColumnManagerComponent implements OnInit, OnDestroy {
  // INPUTS: Configuration and data
  @Input() config!: TableConfig;
  @Input() columns: TableColumn[] = [];
  @Input() preferences?: ColumnPreferences;

  // OUTPUTS: Events
  @Output() preferencesChange = new EventEmitter<ColumnPreferences>();
  @Output() apply = new EventEmitter<ColumnPreferences>();
  @Output() cancel = new EventEmitter<void>();

  // Internal state
  columnStates: ColumnState[] = [];
  workingCopy: ColumnState[] = [];  // Temporary copy for editing
  hasChanges: boolean = false;

  // Cleanup
  private destroy$ = new Subject<void>();

  constructor(private prefsService: ColumnPreferencesService) {}

  ngOnInit(): void {
    console.log('[ColumnManager] Initializing with config:', this.config?.id);

    // Initialize column states from preferences or config
    this.initializeColumnStates();

    // Create working copy for editing
    this.syncWorkingCopy();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * INITIALIZE COLUMN STATES
   *
   * Sets up column states from preferences or config defaults.
   * Merges saved preferences with current columns (handles added/removed columns).
   */
  private initializeColumnStates(): void {
    if (!this.config) {
      console.error('[ColumnManager] No config provided');
      return;
    }

    // Try to load saved preferences
    const saved = this.preferences ||
      this.prefsService.loadPreferences(this.config.id);

    if (saved && saved.columns.length > 0) {
      console.log('[ColumnManager] Using saved preferences');
      // Merge saved preferences with current columns
      const merged = this.prefsService.mergePreferences(saved, this.columns);
      this.columnStates = merged.columns;
    } else {
      console.log('[ColumnManager] Using default preferences');
      // Build default preferences from config
      const defaults = this.prefsService.buildDefaultPreferences(
        this.config.id,
        this.columns
      );
      this.columnStates = defaults.columns;
    }

    console.log('[ColumnManager] Initialized column states:', this.columnStates);
  }

  /**
   * SYNC WORKING COPY
   *
   * Creates a deep copy of column states for editing.
   * Prevents changes from affecting original until "Apply" is clicked.
   */
  private syncWorkingCopy(): void {
    this.workingCopy = this.columnStates.map((state) => ({ ...state }));
    this.hasChanges = false;
  }

  /**
   * TOGGLE COLUMN VISIBILITY
   *
   * Shows/hides a column by toggling its visible flag.
   *
   * @param columnKey - The column key to toggle
   */
  toggleColumnVisibility(columnKey: string): void {
    const column = this.workingCopy.find((c) => c.key === columnKey);
    if (column) {
      column.visible = !column.visible;
      this.markAsChanged();
      console.log('[ColumnManager] Toggled visibility for:', columnKey, column.visible);
    }
  }

  /**
   * UPDATE COLUMN WIDTH
   *
   * Updates the width for a specific column.
   *
   * @param columnKey - The column key
   * @param width - New width value (e.g., '150px', '20%')
   */
  updateColumnWidth(columnKey: string, width: string): void {
    const column = this.workingCopy.find((c) => c.key === columnKey);
    if (column) {
      column.width = width || undefined;
      this.markAsChanged();
      console.log('[ColumnManager] Updated width for:', columnKey, width);
    }
  }

  /**
   * MOVE COLUMN UP
   *
   * Reorders columns by moving a column up in the list.
   * Updates order indices after reordering.
   *
   * @param index - Index of column to move up
   */
  moveColumnUp(index: number): void {
    if (index <= 0) return;

    // Swap with previous column
    const temp = this.workingCopy[index];
    this.workingCopy[index] = this.workingCopy[index - 1];
    this.workingCopy[index - 1] = temp;

    // Update order indices
    this.workingCopy.forEach((col, idx) => {
      col.order = idx;
    });

    this.markAsChanged();
    console.log('[ColumnManager] Moved column up:', index);
  }

  /**
   * MOVE COLUMN DOWN
   *
   * Reorders columns by moving a column down in the list.
   * Updates order indices after reordering.
   *
   * @param index - Index of column to move down
   */
  moveColumnDown(index: number): void {
    if (index >= this.workingCopy.length - 1) return;

    // Swap with next column
    const temp = this.workingCopy[index];
    this.workingCopy[index] = this.workingCopy[index + 1];
    this.workingCopy[index + 1] = temp;

    // Update order indices
    this.workingCopy.forEach((col, idx) => {
      col.order = idx;
    });

    this.markAsChanged();
    console.log('[ColumnManager] Moved column down:', index);
  }

  /**
   * MARK AS CHANGED
   *
   * Sets hasChanges flag and emits preferencesChange event.
   * Used to enable Apply button and track modifications.
   */
  private markAsChanged(): void {
    this.hasChanges = true;
    this.emitPreferencesChange();
  }

  /**
   * EMIT PREFERENCES CHANGE
   *
   * Emits current working preferences for real-time preview (optional).
   */
  private emitPreferencesChange(): void {
    const prefs: ColumnPreferences = {
      tableId: this.config.id,
      columns: this.workingCopy,
      lastModified: Date.now()
    };
    this.preferencesChange.emit(prefs);
  }

  /**
   * ON APPLY
   *
   * Applies changes, saves to localStorage, and emits apply event.
   * This is called when user clicks "Apply" button.
   */
  onApply(): void {
    console.log('[ColumnManager] Applying changes');

    const prefs: ColumnPreferences = {
      tableId: this.config.id,
      columns: this.workingCopy,
      lastModified: Date.now()
    };

    // Save to localStorage
    this.prefsService.savePreferences(this.config.id, prefs);

    // Update column states
    this.columnStates = this.workingCopy.map((state) => ({ ...state }));

    // Emit apply event for parent to handle
    this.apply.emit(prefs);

    console.log('[ColumnManager] Changes applied and saved');
  }

  /**
   * ON CANCEL
   *
   * Discards changes and reverts to saved state.
   * This is called when user clicks "Cancel" button.
   */
  onCancel(): void {
    console.log('[ColumnManager] Canceling changes');

    // Revert working copy to original
    this.syncWorkingCopy();

    // Emit cancel event
    this.cancel.emit();
  }

  /**
   * ON RESET
   *
   * Resets to default column configuration.
   * Deletes saved preferences from localStorage.
   */
  onReset(): void {
    console.log('[ColumnManager] Resetting to defaults');

    // Delete saved preferences
    this.prefsService.deletePreferences(this.config.id);

    // Reset column states to defaults
    const defaults = this.prefsService.buildDefaultPreferences(
      this.config.id,
      this.columns
    );
    this.columnStates = defaults.columns;
    this.syncWorkingCopy();

    // Emit changes
    this.emitPreferencesChange();
  }

  /**
   * GET COLUMN LABEL
   *
   * Gets the display label for a column key.
   *
   * @param columnKey - The column key
   * @returns The column label
   */
  getColumnLabel(columnKey: string): string {
    const col = this.columns.find((c) => c.key === columnKey);
    return col?.label || columnKey;
  }

  /**
   * GET VISIBLE COLUMN COUNT
   *
   * Counts how many columns are currently visible.
   *
   * @returns Count of visible columns
   */
  getVisibleColumnCount(): number {
    return this.workingCopy.filter((c) => c.visible).length;
  }

  /**
   * GET TOTAL COLUMN COUNT
   *
   * Gets total number of columns.
   *
   * @returns Total column count
   */
  getTotalColumnCount(): number {
    return this.workingCopy.length;
  }

  /**
   * IS LOCKED COLUMN
   *
   * Checks if a column is locked (cannot be hidden).
   * Locked columns are typically system columns like checkboxes.
   *
   * @param columnKey - The column key
   * @returns true if column is locked
   */
  isLockedColumn(columnKey: string): boolean {
    const col = this.columns.find((c) => c.key === columnKey);
    return col?.locked === true;
  }

  /**
   * IS REORDERABLE
   *
   * Checks if columns can be reordered.
   * Can be disabled via config for tables that don't need reordering.
   *
   * @returns true if reordering is enabled
   */
  isReorderable(): boolean {
    // Enable reordering by default unless explicitly disabled
    return true;
  }

  /**
   * IS RESIZABLE
   *
   * Checks if a column width can be resized.
   *
   * @param columnKey - The column key
   * @returns true if column is resizable
   */
  isResizable(columnKey: string): boolean {
    const col = this.columns.find((c) => c.key === columnKey);
    return col?.resizable !== false;  // Default to true
  }
}
