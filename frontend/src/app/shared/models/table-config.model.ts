/*
  TABLE CONFIGURATION MODELS

  PURPOSE:
  Type-safe configuration interfaces for BaseTableComponent.
  Enables configuration-driven table behavior without code changes.

  ARCHITECTURE:
  One component (BaseTableComponent) + Multiple configurations = All table types
  - Picker: SelectionConfig.enabled = true
  - Results: SelectionConfig.enabled = false
  - Expandable: ExpandableConfig.enabled = true
*/

/**
 * COLUMN TYPE
 * Determines how the column value is rendered
 */
export type ColumnType =
  | 'text'           // Plain text display
  | 'number'         // Numeric display (formatted)
  | 'date'           // Date display (formatted)
  | 'currency'       // Currency display ($)
  | 'boolean'        // Checkbox or Yes/No
  | 'template';      // Custom ng-template

/**
 * COLUMN DEFINITION
 * Defines a single column in the table
 */
export interface TableColumn {
  key: string;                    // Property name in data object
  label: string;                  // Display header text
  type?: ColumnType;              // How to render the value (default: 'text')
  width?: string;                 // Column width (e.g., '150px', '20%')
  sortable?: boolean;             // Enable column sorting
  filterable?: boolean;           // Enable column filtering
  visible?: boolean;              // Column visibility (default: true)
  locked?: boolean;               // Prevent reordering/hiding (e.g., checkbox column)
  resizable?: boolean;            // Allow width resizing in ColumnManager (default: true)
  reorderable?: boolean;          // Allow reordering in ColumnManager (default: true)

  // Formatting
  dateFormat?: string;            // Date format string (for type: 'date')
  numberFormat?: string;          // Number format string (for type: 'number')

  // Template slot
  templateName?: string;          // ng-template reference (for type: 'template')

  // Hierarchical columns (for picker parent-child pattern)
  hierarchical?: {
    enabled: boolean;             // This column has parent-child relationships
    parentKey: string;            // Property that groups children (e.g., 'manufacturer')
    childKey: string;             // Property that identifies children (e.g., 'model')
  };
}

/**
 * SELECTION MODE
 * How many rows can be selected
 */
export type SelectionMode = 'single' | 'multi';

/**
 * SELECTION DISPLAY MODE
 * Determines checkbox column layout
 */
export type SelectionDisplayMode =
  | 'single'   // One selection column (left side) - for simple pickers
  | 'dual';    // Two checkbox columns embedded in data columns - for manufacturer-model pattern

/**
 * SELECTION CONFIGURATION
 * Controls checkbox selection behavior
 */
export interface SelectionConfig {
  enabled: boolean;                           // Enable selection checkboxes
  mode?: SelectionMode;                       // Single or multi-select (default: 'multi')
  displayMode?: SelectionDisplayMode;         // Checkbox layout mode (default: 'single')

  // Hierarchical selection (parent-child checkboxes)
  hierarchical?: {
    enabled: boolean;                         // Enable parent-child checkbox pattern
    parentKey: string;                        // Property that groups children (e.g., 'manufacturer')
    childKey: string;                         // Property that identifies children (e.g., 'model')
    parentColumn?: number;                    // Column index for parent checkbox (dual mode)
    childColumn?: number;                     // Column index for child checkbox (dual mode)
  };

  // Apply button (for pickers)
  applyButton?: {
    enabled: boolean;                         // Show "Apply Selection" button
    text?: string;                            // Button text (default: 'Apply Selection')
    position?: 'header' | 'footer' | 'both'; // Where to show button
  };

  // Selection info (count display)
  showCount?: boolean;                        // Show "X items selected"
  clearButton?: boolean;                      // Show "Clear All" button

  // URL-first state management (optional - enables URL persistence)
  urlParam?: string;                          // Query param name (e.g., 'models', 'manufacturers')
  serializer?: (selectedItems: any[]) => string;  // Convert selections to URL string
  deserializer?: (urlValue: string) => any[];     // Parse URL string to selections
  keyGenerator?: (item: any) => string;           // Generate key from item (e.g., 'Ford|F-150')
}

/**
 * EXPANDABLE CONFIGURATION
 * Controls row expansion for nested data
 */
export interface ExpandableConfig {
  enabled: boolean;                           // Enable row expansion
  expandIcon?: string;                        // PrimeNG icon class (default: 'pi pi-chevron-right')
  collapseIcon?: string;                      // PrimeNG icon class (default: 'pi pi-chevron-down')

  // Sub-table configuration
  subTable?: {
    columns: TableColumn[];                   // Columns for expanded sub-table
    dataKey: string;                          // Property name for sub-data (or use API)
    api?: {
      endpoint: string;                       // API endpoint for fetching sub-data
      paramMapper?: (parentRow: any) => any;  // Map parent row to API params
    };
  };
}

/**
 * PAGINATION CONFIGURATION
 * Controls pagination behavior
 */
export interface PaginationConfig {
  enabled: boolean;                           // Enable pagination
  pageSize?: number;                          // Items per page (default: 20)
  pageSizeOptions?: number[];                 // Page size dropdown options
  position?: 'top' | 'bottom' | 'both';      // Where to show pagination controls
}

/**
 * API CONFIGURATION
 * How to fetch data from backend
 */
export interface ApiConfig {
  // Option 1: Direct HTTP (for flexibility)
  http?: {
    method: 'GET' | 'POST';
    endpoint: string;
    baseUrl?: string;                         // Optional different API base URL
  };

  // Option 2: Service method (backward compatible)
  service?: {
    name: string;                             // Service name (injected)
    method: string;                           // Method name to call
  };

  // Common config
  paramMapper?: (params: any) => any;         // Transform query params before API call
  responseTransformer?: (response: any) => any; // Transform API response to table data
}

/**
 * MAIN TABLE CONFIGURATION
 * Complete configuration for BaseTableComponent
 */
export interface TableConfig<T = any> {
  id: string;                                 // Unique table identifier
  columns: TableColumn[];                     // Column definitions

  // Features
  selection?: SelectionConfig;                // Checkbox selection
  expandable?: ExpandableConfig;              // Row expansion
  pagination?: PaginationConfig;              // Pagination

  // Data source
  api?: ApiConfig;                            // API configuration
  data?: T[];                                 // Static data (for testing)

  // Styling
  striped?: boolean;                          // Striped rows
  bordered?: boolean;                         // Table borders
  hoverable?: boolean;                        // Row hover effect
  size?: 'small' | 'normal' | 'large';       // Table size

  // Empty state
  emptyMessage?: string;                      // Message when no data

  // Loading
  loading?: boolean;                          // Show loading spinner
  loadingMessage?: string;                    // Loading message
}
