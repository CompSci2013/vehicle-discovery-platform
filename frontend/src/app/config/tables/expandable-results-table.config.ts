/*
  EXPANDABLE RESULTS TABLE CONFIGURATION

  PURPOSE:
  Configuration for vehicle search results table with expandable rows showing VIN instances.

  FEATURES:
  - Display vehicle search results
  - Expandable rows (click to show VIN instances)
  - Sub-table shows detailed VIN information
  - Sortable columns in both parent and sub-table
  - Pagination for parent table
  - Configuration-driven API (references vehicle API config)

  USAGE:
  import { EXPANDABLE_RESULTS_TABLE_CONFIG } from './config/tables/expandable-results-table.config';
  <app-base-table [config]="EXPANDABLE_RESULTS_TABLE_CONFIG"></app-base-table>

  NOTE:
  This configuration uses apiConfigRef to reference the vehicle API configuration.
  The actual API endpoints are defined in src/app/config/api/vehicle-api.config.ts
*/

import { TableConfig } from '../../shared/models/table-config.model';

export const EXPANDABLE_RESULTS_TABLE_CONFIG: TableConfig = {
  id: 'vehicle-results-expandable-table',

  // API CONFIGURATION REFERENCE
  // Main table uses search endpoint, expansion uses vinInstances endpoint
  apiConfigRef: {
    configId: 'vehicles',
    endpointId: 'search'
  },

  // PARENT TABLE COLUMNS
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
      key: 'instance_count',
      label: 'VIN Count',
      type: 'number',
      width: '100px',
      sortable: true,
      filterable: false,
      visible: true
    }
  ],

  // EXPANDABLE CONFIGURATION
  expandable: {
    enabled: true,
    expandIcon: 'pi pi-chevron-right',
    collapseIcon: 'pi pi-chevron-down',

    // SUB-TABLE (VIN Instances)
    subTable: {
      dataKey: 'vin_instances',  // Property name in parent row containing sub-data
      columns: [
        {
          key: 'vin',
          label: 'VIN',
          type: 'text',
          width: '180px',
          sortable: false,
          visible: true
        },
        {
          key: 'registered_state',
          label: 'State',
          type: 'text',
          width: '80px',
          sortable: false,
          visible: true
        },
        {
          key: 'exterior_color',
          label: 'Color',
          type: 'text',
          width: '100px',
          sortable: false,
          visible: true
        },
        {
          key: 'estimated_value',
          label: 'Value',
          type: 'currency',
          width: '100px',
          sortable: false,
          visible: true
        },
        {
          key: 'mileage',
          label: 'Mileage',
          type: 'number',
          width: '100px',
          sortable: false,
          visible: true
        },
        {
          key: 'condition_rating',
          label: 'Condition',
          type: 'number',
          width: '80px',
          sortable: false,
          visible: true
        },
        {
          key: 'title_status',
          label: 'Title',
          type: 'text',
          width: '100px',
          sortable: false,
          visible: true
        }
      ]
    }
  },

  // PAGINATION (parent table only)
  pagination: {
    enabled: true,
    pageSize: 20,
    pageSizeOptions: [10, 20, 50],
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
