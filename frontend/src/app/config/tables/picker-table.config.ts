/*
  PICKER TABLE CONFIGURATION

  PURPOSE:
  Configuration for manufacturer-model picker table with hierarchical selection.

  FEATURES:
  - Hierarchical parent-child selection (manufacturer → models)
  - Tri-state checkboxes for manufacturers
  - Binary checkboxes for models
  - Apply Selection button
  - Selection count display
  - Configuration-driven API (references vehicle API config)

  USAGE:
  import { PICKER_TABLE_CONFIG } from './config/tables/picker-table.config';
  <app-base-table [config]="PICKER_TABLE_CONFIG"></app-base-table>

  NOTE:
  This configuration uses apiConfigRef to reference the vehicle API configuration.
  The actual API endpoints are defined in src/app/config/api/vehicle-api.config.ts
*/

import { TableConfig } from '../../shared/models/table-config.model';

export const PICKER_TABLE_CONFIG: TableConfig = {
  id: 'manufacturer-model-picker',

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
      width: '200px',
      sortable: true,
      filterable: true,
      visible: true
    },
    {
      key: 'model',
      label: 'Model',
      type: 'text',
      width: '200px',
      sortable: true,
      filterable: true,
      visible: true
    }
  ],

  // SELECTION CONFIGURATION
  selection: {
    enabled: true,
    mode: 'multi',
    displayMode: 'single',  // Single checkbox column on left

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
    clearButton: true
  },

  // STYLING
  striped: true,
  bordered: false,
  hoverable: true,
  size: 'normal',

  // EMPTY STATE
  emptyMessage: 'No manufacturers or models available'
};
