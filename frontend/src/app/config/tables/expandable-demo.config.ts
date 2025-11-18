/*
  EXPANDABLE ROW DEMO CONFIGURATION

  PURPOSE:
  Demonstrates expandable row functionality with static sub-table data.
  Shows vehicle search results with expandable VIN instance details.

  FEATURES:
  - Expandable vehicle rows (click chevron to expand)
  - Static VIN instance sub-table data (from parent row property)
  - No selection checkboxes (results table mode)
  - Demonstrates recursive BaseTable rendering
  - Compact sub-table styling

  USAGE:
  import { EXPANDABLE_DEMO_CONFIG } from './config/tables/expandable-demo.config';
  <app-base-table [config]="EXPANDABLE_DEMO_CONFIG" [data]="vehicleData"></app-base-table>

  DATA STRUCTURE:
  Parent rows must contain a 'vin_instances' property with an array of VIN details:
  {
    manufacturer: 'Ford',
    model: 'F-150',
    year: 2023,
    instance_count: 3,
    vin_instances: [
      { vin: '1FTFW1...', registered_state: 'TX', ... },
      ...
    ]
  }
*/

import { TableConfig } from '../../shared/models/table-config.model';

export const EXPANDABLE_DEMO_CONFIG: TableConfig = {
  id: 'expandable-demo-table',

  // PARENT TABLE COLUMNS (Vehicle summary)
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

  // EXPANDABLE CONFIGURATION
  expandable: {
    enabled: true,
    expandIcon: 'pi pi-chevron-right',
    collapseIcon: 'pi pi-chevron-down',

    // SUB-TABLE (VIN Instances)
    subTable: {
      // Property name in parent row containing sub-data
      dataKey: 'vin_instances',

      // Sub-table columns
      columns: [
        {
          key: 'vin',
          label: 'VIN',
          type: 'text',
          width: '200px',
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
          width: '90px',
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

  // PAGINATION
  pagination: {
    enabled: true,
    pageSize: 10,
    pageSizeOptions: [5, 10, 20, 50],
    showCurrentPageReport: true,
    currentPageReportTemplate: 'Showing {first} to {last} of {totalRecords} vehicles'
  },

  // STYLING
  striped: true,
  bordered: false,
  hoverable: true,
  size: 'normal',

  // EMPTY STATE
  emptyMessage: 'No vehicles found. Click "Load Demo Data" to see expandable rows in action.'
};
