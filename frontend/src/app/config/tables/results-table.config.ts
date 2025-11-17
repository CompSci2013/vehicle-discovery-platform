/*
  RESULTS TABLE CONFIGURATION

  PURPOSE:
  Configuration for simple vehicle search results table (non-expandable).

  FEATURES:
  - Display vehicle search results
  - Sortable columns
  - Pagination
  - No selection checkboxes (display only)
  - Configuration-driven API (references vehicle API config)

  USAGE:
  import { RESULTS_TABLE_CONFIG } from './config/tables/results-table.config';
  <app-base-table [config]="RESULTS_TABLE_CONFIG"></app-base-table>

  NOTE:
  This configuration uses apiConfigRef to reference the vehicle API configuration.
  The actual API endpoints are defined in src/app/config/api/vehicle-api.config.ts
*/

import { TableConfig } from '../../shared/models/table-config.model';

export const RESULTS_TABLE_CONFIG: TableConfig = {
  id: 'vehicle-results-table',

  // API CONFIGURATION REFERENCE
  // This table fetches data from the vehicle API's search endpoint
  apiConfigRef: {
    configId: 'vehicles',
    endpointId: 'search'
  },

  // COLUMNS
  columns: [
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      type: 'text',
      width: '150px',
      sortable: true,
      filterable: false,
      visible: true
    },
    {
      key: 'model',
      label: 'Model',
      type: 'text',
      width: '150px',
      sortable: true,
      filterable: false,
      visible: true
    },
    {
      key: 'year',
      label: 'Year',
      type: 'number',
      width: '100px',
      sortable: true,
      filterable: false,
      visible: true
    },
    {
      key: 'body_class',
      label: 'Body Class',
      type: 'text',
      width: '120px',
      sortable: true,
      filterable: false,
      visible: true
    },
    {
      key: 'data_source',
      label: 'Source',
      type: 'text',
      width: '120px',
      sortable: false,
      filterable: false,
      visible: true
    },
    {
      key: 'instance_count',
      label: 'VIN Count',
      type: 'number',
      width: '100px',
      sortable: true,
      filterable: false,
      visible: true
    }
  ],

  // PAGINATION
  pagination: {
    enabled: true,
    pageSize: 20,
    pageSizeOptions: [10, 20, 50, 100],
    position: 'bottom'
  },

  // STYLING
  striped: true,
  bordered: false,
  hoverable: true,
  size: 'normal',

  // EMPTY STATE
  emptyMessage: 'No vehicles found matching your criteria'
};
