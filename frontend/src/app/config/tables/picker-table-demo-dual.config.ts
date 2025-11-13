/**
 * PICKER TABLE CONFIGURATION - DUAL CHECKBOX MODE
 *
 * Configuration for the demo picker table with dual embedded checkboxes.
 * Demonstrates hierarchical selection with manufacturer-model parent-child relationship.
 *
 * FEATURES:
 * - Dual checkboxes embedded in manufacturer and model columns
 * - Hierarchical parent-child selection (manufacturer → models)
 * - Sortable and filterable columns
 * - Apply Selection button with counts
 * - URL-first state management for selections
 *
 * ARCHITECTURE:
 * - Configuration-driven: All behavior defined here, no code changes needed
 * - Used by demo component for dual-mode variant
 */

import { TableConfig } from '../../shared/models/table-config.model';

export const PICKER_TABLE_DEMO_DUAL_CONFIG: TableConfig = {
  id: 'manufacturer-model-picker-dual',

  // COLUMNS
  columns: [
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      type: 'text',
      sortable: true,        // Enable sort control
      filterable: false,      // Enable filter input
      visible: true,
      width: '125px'
    },
    {
      key: 'model',
      label: 'Model',
      type: 'text',
      sortable: false,        // Enable sort control
      filterable: true,      // Enable filter input
      visible: true,
      width: '250px'
    },
    {
      key: 'count',
      label: 'Vehicles',
      type: 'number',
      sortable: true,        // Enable sort control
      filterable: false,      // Enable filter input
      visible: true,
      width: '100px'
    }
  ],

  // SELECTION CONFIGURATION
  selection: {
    enabled: true,
    mode: 'multi',
    displayMode: 'dual',   // Two embedded checkboxes

    // Hierarchical selection (parent-child pattern)
    hierarchical: {
      enabled: true,
      parentKey: 'manufacturer',
      childKey: 'model',
      parentColumn: 0,       // Checkbox in manufacturer column
      childColumn: 1         // Checkbox in model column
    },

    // Apply button
    applyButton: {
      enabled: true,
      text: 'Apply Selection',
      position: 'both'  // Show in header and footer
    },

    // Selection info
    showCount: true,
    clearButton: true,

    // URL-first state management
    urlParam: 'models-dual'
  },

  // STYLING
  striped: true,
  bordered: false,
  hoverable: true,
  size: 'normal',

  // EMPTY STATE
  emptyMessage: 'No manufacturers or models available'
};
