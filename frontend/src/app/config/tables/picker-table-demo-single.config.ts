/**
 * PICKER TABLE CONFIGURATION - SINGLE CHECKBOX MODE
 *
 * Configuration for the demo picker table with single selection column.
 * Demonstrates hierarchical selection with manufacturer-model parent-child relationship.
 *
 * FEATURES:
 * - Single checkbox column on left side
 * - Hierarchical parent-child selection (manufacturer → models)
 * - Sortable and filterable columns
 * - Apply Selection button with counts
 * - URL-first state management for selections
 *
 * ARCHITECTURE:
 * - Configuration-driven: All behavior defined here, no code changes needed
 * - Used by demo component for single-mode variant
 */

import { TableConfig } from '../../shared/models/table-config.model';

export const PICKER_TABLE_DEMO_SINGLE_CONFIG: TableConfig = {
  id: 'manufacturer-model-picker-single',

  // COLUMNS
  columns: [
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      type: 'text',
      sortable: true,        // Enable sort control
      filterable: true,      // Enable filter input
      visible: true,
      width: '200px'
    },
    {
      key: 'model',
      label: 'Model',
      type: 'text',
      sortable: true,        // Enable sort control
      filterable: true,      // Enable filter input
      visible: true,
      width: '200px'
    },
    {
      key: 'count',
      label: 'Vehicles',
      type: 'number',
      sortable: true,        // Enable sort control
      filterable: true,      // Enable filter input
      visible: true,
      width: '100px'
    }
  ],

  // SELECTION CONFIGURATION
  selection: {
    enabled: true,
    mode: 'multi',
    displayMode: 'single',  // One selection column on left

    // Hierarchical selection (parent-child pattern)
    hierarchical: {
      enabled: true,
      parentKey: 'manufacturer',
      childKey: 'model'
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
    urlParam: 'models-single'
  },

  // STYLING
  striped: true,
  bordered: false,
  hoverable: true,
  size: 'normal',

  // EMPTY STATE
  emptyMessage: 'No manufacturers or models available'
};
