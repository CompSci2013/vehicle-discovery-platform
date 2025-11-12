/*
  COLUMN PREFERENCES SERVICE

  PURPOSE:
  Manages persistence of column configuration preferences (visibility, order, width)
  to browser localStorage. Allows users' column arrangements to persist across sessions.

  STORAGE:
  Uses localStorage with key pattern: columnPrefs_{tableId}
  Example: columnPrefs_manufacturer-model-picker-dual

  DATA MODEL:
  {
    tableId: string,
    columns: [
      { key: 'manufacturer', visible: true, order: 0, width: '200px' },
      { key: 'model', visible: false, order: 1, width: '150px' }
    ],
    lastModified: 1731401234567
  }

  USAGE:
  constructor(private prefsService: ColumnPreferencesService) {}

  ngOnInit() {
    const saved = this.prefsService.loadPreferences('my-table-id');
    if (saved) {
      this.applyPreferences(saved);
    }
  }

  saveChanges(newPrefs) {
    this.prefsService.savePreferences('my-table-id', newPrefs);
  }
*/

import { Injectable } from '@angular/core';

/**
 * Column state: visibility, order, width
 */
export interface ColumnState {
  key: string;              // Column key (unique identifier)
  visible: boolean;         // Show/hide column
  order: number;            // Display order (0-based index)
  width?: string;           // Custom width (e.g., '200px')
}

/**
 * Complete column preferences for a table
 */
export interface ColumnPreferences {
  tableId: string;          // Which table these preferences are for
  columns: ColumnState[];   // Array of column states
  lastModified: number;     // Timestamp of last modification
}

/**
 * COLUMN PREFERENCES SERVICE
 *
 * Manages persistence of column settings to localStorage.
 * Handles save/load/delete of column visibility, order, and width preferences.
 */
@Injectable({
  providedIn: 'root'
})
export class ColumnPreferencesService {
  // Prefix for all column preference keys in localStorage
  private readonly STORAGE_PREFIX = 'columnPrefs_';

  /**
   * SAVE PREFERENCES
   *
   * Persists column preferences to localStorage.
   * Includes timestamp for tracking when preferences were last modified.
   *
   * @param tableId - The table identifier (should match TableConfig.id)
   * @param preferences - Column preferences to save
   *
   * @example
   * const prefs: ColumnPreferences = {
   *   tableId: 'my-table',
   *   columns: [
   *     { key: 'col1', visible: true, order: 0 },
   *     { key: 'col2', visible: false, order: 1 }
   *   ],
   *   lastModified: Date.now()
   * };
   * this.prefsService.savePreferences('my-table', prefs);
   */
  savePreferences(tableId: string, preferences: ColumnPreferences): void {
    const key = this.generateKey(tableId);
    const dataToStore: ColumnPreferences = {
      ...preferences,
      tableId,
      lastModified: Date.now()
    };

    try {
      localStorage.setItem(key, JSON.stringify(dataToStore));
      console.log('[ColumnPreferencesService] Saved preferences for:', tableId);
    } catch (error) {
      console.error('[ColumnPreferencesService] Error saving preferences:', error);
    }
  }

  /**
   * LOAD PREFERENCES
   *
   * Retrieves column preferences from localStorage.
   * Returns null if no preferences have been saved for this table.
   *
   * @param tableId - The table identifier
   * @returns Saved preferences or null if not found
   *
   * @example
   * const saved = this.prefsService.loadPreferences('my-table');
   * if (saved) {
   *   console.log('User has saved column preferences');
   * } else {
   *   console.log('No saved preferences, use defaults');
   * }
   */
  loadPreferences(tableId: string): ColumnPreferences | null {
    const key = this.generateKey(tableId);

    try {
      const data = localStorage.getItem(key);
      if (data) {
        const prefs = JSON.parse(data) as ColumnPreferences;
        console.log('[ColumnPreferencesService] Loaded preferences for:', tableId);
        return prefs;
      }
    } catch (error) {
      console.error('[ColumnPreferencesService] Error loading preferences:', error);
    }

    return null;
  }

  /**
   * DELETE PREFERENCES
   *
   * Removes saved column preferences from localStorage.
   * Useful when implementing a "Reset to Default" feature.
   *
   * @param tableId - The table identifier
   *
   * @example
   * // User clicks "Reset to Default" button
   * this.prefsService.deletePreferences('my-table');
   * // Reload table with default column configuration
   */
  deletePreferences(tableId: string): void {
    const key = this.generateKey(tableId);

    try {
      localStorage.removeItem(key);
      console.log('[ColumnPreferencesService] Deleted preferences for:', tableId);
    } catch (error) {
      console.error('[ColumnPreferencesService] Error deleting preferences:', error);
    }
  }

  /**
   * DELETE ALL PREFERENCES
   *
   * Removes all column preferences from localStorage.
   * Use with caution - this affects all tables.
   *
   * @example
   * // In a settings/cleanup function
   * this.prefsService.deleteAllPreferences();
   */
  deleteAllPreferences(): void {
    try {
      // Find all keys starting with our prefix
      const keysToDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          keysToDelete.push(key);
        }
      }

      // Delete all found keys
      keysToDelete.forEach((key) => {
        localStorage.removeItem(key);
      });

      console.log('[ColumnPreferencesService] Deleted all preferences, count:', keysToDelete.length);
    } catch (error) {
      console.error('[ColumnPreferencesService] Error deleting all preferences:', error);
    }
  }

  /**
   * GENERATE STORAGE KEY
   *
   * Creates the localStorage key for a specific table's preferences.
   *
   * @param tableId - The table identifier
   * @returns Full localStorage key
   *
   * PATTERN:
   * Input: 'my-table'
   * Output: 'columnPrefs_my-table'
   */
  private generateKey(tableId: string): string {
    return `${this.STORAGE_PREFIX}${tableId}`;
  }

  /**
   * BUILD DEFAULT PREFERENCES
   *
   * Creates default column preferences from a column array.
   * All columns visible, default order, no custom widths.
   *
   * @param tableId - The table identifier
   * @param columns - Array of columns to create preferences from
   * @returns Default preferences
   *
   * @example
   * const defaults = this.prefsService.buildDefaultPreferences(
   *   'my-table',
   *   [
   *     { key: 'col1', label: 'Column 1' },
   *     { key: 'col2', label: 'Column 2' }
   *   ]
   * );
   * // Result: all columns visible, order 0,1, no custom widths
   */
  buildDefaultPreferences(
    tableId: string,
    columns: Array<{ key: string; visible?: boolean }>
  ): ColumnPreferences {
    return {
      tableId,
      columns: columns.map((col, idx) => ({
        key: col.key,
        visible: col.visible !== false,
        order: idx
      })),
      lastModified: Date.now()
    };
  }

  /**
   * MERGE PREFERENCES
   *
   * Merges saved preferences with new columns.
   * Handles case where columns were added/removed since preferences saved.
   *
   * @param saved - Previously saved preferences
   * @param currentColumns - Current list of columns
   * @returns Merged preferences
   *
   * BEHAVIOR:
   * - Columns that still exist: keep saved preferences
   * - New columns: add with default state
   * - Removed columns: skip (not in merged result)
   *
   * @example
   * const saved = { columns: [{ key: 'a', visible: true, order: 0 }] };
   * const current = [{ key: 'a', ... }, { key: 'b', ... }];
   * const merged = this.prefsService.mergePreferences(saved, current);
   * // Result: keeps 'a' settings, adds 'b' as new with defaults
   */
  mergePreferences(
    saved: ColumnPreferences,
    currentColumns: Array<{ key: string; visible?: boolean }>
  ): ColumnPreferences {
    const merged: ColumnState[] = [];

    // Merge existing preferences with current columns
    currentColumns.forEach((col) => {
      const savedState = saved.columns.find((s) => s.key === col.key);

      if (savedState) {
        // Column exists in both: use saved state
        merged.push(savedState);
      } else {
        // New column: add with defaults
        merged.push({
          key: col.key,
          visible: col.visible !== false,
          order: merged.length
        });
      }
    });

    return {
      tableId: saved.tableId,
      columns: merged,
      lastModified: Date.now()
    };
  }

  /**
   * EXPORT PREFERENCES
   *
   * Exports column preferences as JSON string.
   * Useful for: backup, debugging, sharing configurations.
   *
   * @param tableId - The table identifier
   * @returns JSON string representation of preferences
   *
   * @example
   * const json = this.prefsService.exportPreferences('my-table');
   * console.log(json);  // { tableId: 'my-table', columns: [...], ... }
   */
  exportPreferences(tableId: string): string | null {
    const prefs = this.loadPreferences(tableId);
    return prefs ? JSON.stringify(prefs, null, 2) : null;
  }

  /**
   * IMPORT PREFERENCES
   *
   * Imports column preferences from JSON string.
   * Validates format before saving.
   *
   * @param tableId - The table identifier to save as
   * @param json - JSON string representation of preferences
   * @returns true if import successful, false if invalid format
   *
   * @example
   * const json = '{"tableId":"my-table","columns":[...],"lastModified":123}';
   * const success = this.prefsService.importPreferences('my-table', json);
   * if (success) {
   *   console.log('Preferences imported');
   * }
   */
  importPreferences(tableId: string, json: string): boolean {
    try {
      const parsed = JSON.parse(json) as ColumnPreferences;

      // Validate structure
      if (!parsed.columns || !Array.isArray(parsed.columns)) {
        console.error('[ColumnPreferencesService] Invalid preferences format');
        return false;
      }

      // Save with new table ID
      parsed.tableId = tableId;
      parsed.lastModified = Date.now();
      this.savePreferences(tableId, parsed);

      return true;
    } catch (error) {
      console.error('[ColumnPreferencesService] Error importing preferences:', error);
      return false;
    }
  }

  /**
   * GET STORAGE STATS
   *
   * Returns statistics about stored preferences for debugging.
   *
   * @returns Object with storage statistics
   *
   * @example
   * const stats = this.prefsService.getStorageStats();
   * console.log(stats);
   * // { count: 3, totalSize: 1234, tables: ['table1', 'table2', 'table3'] }
   */
  getStorageStats(): {
    count: number;
    tables: string[];
    totalSize: number;
  } {
    const tables: string[] = [];
    let totalSize = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_PREFIX)) {
          const tableId = key.substring(this.STORAGE_PREFIX.length);
          tables.push(tableId);

          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      }
    } catch (error) {
      console.error('[ColumnPreferencesService] Error getting storage stats:', error);
    }

    return {
      count: tables.length,
      tables,
      totalSize
    };
  }
}
