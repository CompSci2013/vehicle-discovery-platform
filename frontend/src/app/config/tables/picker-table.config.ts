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

  USAGE:
  import { PICKER_TABLE_CONFIG } from './config/tables/picker-table.config';
  <app-base-table [config]="PICKER_TABLE_CONFIG"></app-base-table>
*/

import { TableConfig } from '../../shared/models/table-config.model';

export const PICKER_TABLE_CONFIG: TableConfig = {
  id: 'manufacturer-model-picker',

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
