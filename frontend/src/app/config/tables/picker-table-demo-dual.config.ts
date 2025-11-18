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
 * - Configuration-driven API (references vehicle API config)
 *
 * ARCHITECTURE:
 * - Configuration-driven: All behavior defined here, no code changes needed
 * - Used by demo component for dual-mode variant
 *
 * NOTE:
 * This configuration uses apiConfigRef to reference the vehicle API configuration.
 * The actual API endpoints are defined in src/app/config/api/vehicle-api.config.ts
 */

import { TableConfig } from '../../shared/models/table-config.model';

export const PICKER_TABLE_DEMO_DUAL_CONFIG: TableConfig = {
  id: 'manufacturer-model-picker-dual',

  // API CONFIGURATION REFERENCE
  // This table fetches data from the vehicle API's manufacturerModelCounts endpoint
  apiConfigRef: {
    configId: 'vehicles',
    endpointId: 'manufacturerModelCounts'
  },

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

  // PAGINATION
  pagination: {
    enabled: true,
    pageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
    showCurrentPageReport: true,
    currentPageReportTemplate: 'Showing {first} to {last} of {totalRecords} models'
  },

  // STYLING
  striped: true,
  bordered: false,
  hoverable: true,
  size: 'normal',

  // EMPTY STATE
  emptyMessage: 'No manufacturers or models available'
};
