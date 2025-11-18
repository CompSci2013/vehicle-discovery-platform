import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { TableConfig, SelectionChangeEvent } from '../../shared/models';
import { DemoApiService, Manufacturer } from '../../demo';
import { UrlStateService } from '../../core/services/url-state.service';
import { PICKER_TABLE_DEMO_SINGLE_CONFIG } from '../../config/tables/picker-table-demo-single.config';
import { PICKER_TABLE_DEMO_DUAL_CONFIG } from '../../config/tables/picker-table-demo-dual.config';
import { EXPANDABLE_DEMO_CONFIG } from '../../config/tables/expandable-demo.config';

/**
 * DEMO PAGE COMPONENT
 *
 * PURPOSE:
 * Development testing page for BaseTableComponent with hierarchical checkbox selection.
 * Uses demo data (no backend required) to validate configuration-driven architecture.
 *
 * DEMONSTRATES:
 * - BaseTableComponent with picker configuration
 * - Hierarchical checkbox pattern (manufacturer-model parent-child)
 * - Tri-state parent checkboxes (unchecked/indeterminate/checked)
 * - Selection events and state management
 * - URL-first state management (selections persist in URL)
 */
@Component({
  selector: 'app-demo',
  templateUrl: './demo.component.html',
  styleUrls: ['./demo.component.scss']
})
export class DemoComponent implements OnInit, OnDestroy {

  /**
   * Picker table configuration - Single Checkbox Mode
   * Demonstrates hierarchical selection with one selection column
   */
  pickerConfigSingle!: TableConfig;

  /**
   * Picker table configuration - Dual Checkbox Mode
   * Demonstrates hierarchical selection with two embedded checkboxes
   */
  pickerConfigDual!: TableConfig;

  /**
   * Expandable table configuration
   * Demonstrates expandable rows with sub-table VIN details
   */
  expandableConfig: TableConfig = EXPANDABLE_DEMO_CONFIG;

  /**
   * Vehicle data with VIN instances for expandable demo
   */
  expandableData: any[] = [];

  /**
   * Expandable config merged with data (for template binding)
   */
  get expandableConfigWithData(): TableConfig {
    return {
      ...this.expandableConfig,
      data: this.expandableData
    };
  }

  /**
   * Current selection state - Single Mode
   */
  selectedKeysSingle: Set<string> = new Set();
  selectedItemsSingle: any[] = [];
  selectionCountSingle = 0;

  /**
   * Current selection state - Dual Mode
   */
  selectedKeysDual: Set<string> = new Set();
  selectedItemsDual: any[] = [];
  selectionCountDual = 0;

  /**
   * URL-first hydration (initial selection from URL)
   */
  initialSelectionSingle?: Set<string>;
  initialSelectionDual?: Set<string>;

  /**
   * Manufacturer-model data from demo API
   * Flattened structure suitable for BaseTableComponent
   */
  manufacturerModelData: any[] = [];

  /**
   * Expose Array constructor to template for Set conversion
   */
  readonly Array = Array;

  /**
   * Cleanup subject for subscription management
   */
  private destroy$ = new Subject<void>();

  constructor(
    private demoApiService: DemoApiService,
    private urlState: UrlStateService
  ) {}

  ngOnInit(): void {
    console.log('[DemoComponent] Initializing...');

    // Subscribe to URL state changes for single mode
    this.urlState.getQueryParam('models-single')
      .pipe(takeUntil(this.destroy$))
      .subscribe(urlValue => {
        console.log('[DemoComponent] URL param models-single changed:', urlValue);
        if (urlValue) {
          this.hydrateSelectionSingle(urlValue);
        } else {
          this.initialSelectionSingle = new Set();
        }
      });

    // Subscribe to URL state changes for dual mode
    this.urlState.getQueryParam('models-dual')
      .pipe(takeUntil(this.destroy$))
      .subscribe(urlValue => {
        console.log('[DemoComponent] URL param models-dual changed:', urlValue);
        if (urlValue) {
          this.hydrateSelectionDual(urlValue);
        } else {
          this.initialSelectionDual = new Set();
        }
      });

    // Load manufacturer-model data
    this.loadManufacturerModelData();

    // Load expandable demo data
    this.loadExpandableData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load manufacturer-model combinations from demo API
   * Transforms hierarchical structure into flat table rows
   */
  private loadManufacturerModelData(): void {
    console.log('[DemoComponent] Loading manufacturer-model data...');

    this.demoApiService.getManufacturerModelCounts().subscribe({
      next: (manufacturers) => {
        console.log('[DemoComponent] Received data:', manufacturers);

        // Transform hierarchical structure (Manufacturer -> Models[])
        // Into flat structure (one row per model with manufacturer reference)
        this.manufacturerModelData = this.flattenManufacturerModelData(manufacturers);

        // Initialize both picker configs with loaded data
        this.initializePickerConfigs();

        console.log('[DemoComponent] Data loaded successfully. Total rows:', this.manufacturerModelData.length);

        // After config is initialized, trigger URL hydration if URL params exist
        // This handles page refresh where URL subscription fires before data loads
        // Use take(1) to get current value only once (not an ongoing subscription)
        this.urlState.getQueryParam('models-single')
          .pipe(take(1))
          .subscribe(urlValue => {
            if (urlValue) {
              console.log('[DemoComponent] Re-hydrating single mode after data load:', urlValue);
              this.hydrateSelectionSingle(urlValue);
            }
          });

        this.urlState.getQueryParam('models-dual')
          .pipe(take(1))
          .subscribe(urlValue => {
            if (urlValue) {
              console.log('[DemoComponent] Re-hydrating dual mode after data load:', urlValue);
              this.hydrateSelectionDual(urlValue);
            }
          });
      },
      error: (error) => {
        console.error('[DemoComponent] Error loading data:', error);
      }
    });
  }

  /**
   * Transform hierarchical manufacturer-model data into flat table rows
   *
   * INPUT (hierarchical):
   * [
   *   { manufacturer: 'Ford', count: 50, models: [
   *     { model: 'F-150', count: 20 },
   *     { model: 'Mustang', count: 30 }
   *   ]},
   *   ...
   * ]
   *
   * OUTPUT (flat):
   * [
   *   { manufacturer: 'Ford', model: 'F-150', count: 20 },
   *   { manufacturer: 'Ford', model: 'Mustang', count: 30 },
   *   ...
   * ]
   */
  private flattenManufacturerModelData(manufacturers: Manufacturer[]): any[] {
    const flatData: any[] = [];

    manufacturers.forEach(mfr => {
      mfr.models.forEach(model => {
        flatData.push({
          manufacturer: mfr.manufacturer,
          model: model.model,
          count: model.count
        });
      });
    });

    return flatData;
  }

  /**
   * Initialize both picker table configurations
   * Uses configuration files (PICKER_TABLE_DEMO_SINGLE_CONFIG and PICKER_TABLE_DEMO_DUAL_CONFIG)
   * to demonstrate configuration-driven architecture per GOALS.md
   */
  private initializePickerConfigs(): void {
    // SINGLE CHECKBOX MODE - Load from configuration file
    this.pickerConfigSingle = {
      ...PICKER_TABLE_DEMO_SINGLE_CONFIG,
      data: this.manufacturerModelData,
      selection: {
        enabled: PICKER_TABLE_DEMO_SINGLE_CONFIG.selection?.enabled ?? true,
        mode: PICKER_TABLE_DEMO_SINGLE_CONFIG.selection?.mode ?? 'multi',
        displayMode: PICKER_TABLE_DEMO_SINGLE_CONFIG.selection?.displayMode,
        hierarchical: PICKER_TABLE_DEMO_SINGLE_CONFIG.selection?.hierarchical,
        applyButton: PICKER_TABLE_DEMO_SINGLE_CONFIG.selection?.applyButton,
        showCount: PICKER_TABLE_DEMO_SINGLE_CONFIG.selection?.showCount,
        clearButton: PICKER_TABLE_DEMO_SINGLE_CONFIG.selection?.clearButton,
        urlParam: PICKER_TABLE_DEMO_SINGLE_CONFIG.selection?.urlParam,
        // URL-first state management
        serializer: (items: any[]) => {
          // Convert items to URL format: "Ford:F-150,Ford:Mustang,Dodge:Durango"
          return items.map(item => `${item.manufacturer}:${item.model}`).join(',');
        },
        deserializer: (urlValue: string) => {
          // Parse URL format back to items
          return urlValue.split(',').map(pair => {
            const [manufacturer, model] = pair.split(':');
            return { manufacturer, model };
          });
        },
        keyGenerator: (item: any) => {
          // Generate unique key: "manufacturer|model"
          return `${item.manufacturer}|${item.model}`;
        }
      }
    };

    // DUAL CHECKBOX MODE - Load from configuration file
    this.pickerConfigDual = {
      ...PICKER_TABLE_DEMO_DUAL_CONFIG,
      data: this.manufacturerModelData,
      selection: {
        enabled: PICKER_TABLE_DEMO_DUAL_CONFIG.selection?.enabled ?? true,
        mode: PICKER_TABLE_DEMO_DUAL_CONFIG.selection?.mode ?? 'multi',
        displayMode: PICKER_TABLE_DEMO_DUAL_CONFIG.selection?.displayMode,
        hierarchical: PICKER_TABLE_DEMO_DUAL_CONFIG.selection?.hierarchical,
        applyButton: PICKER_TABLE_DEMO_DUAL_CONFIG.selection?.applyButton,
        showCount: PICKER_TABLE_DEMO_DUAL_CONFIG.selection?.showCount,
        clearButton: PICKER_TABLE_DEMO_DUAL_CONFIG.selection?.clearButton,
        urlParam: PICKER_TABLE_DEMO_DUAL_CONFIG.selection?.urlParam,
        // URL-first state management
        serializer: (items: any[]) => {
          // Convert items to URL format: "Ford:F-150,Ford:Mustang,Dodge:Durango"
          return items.map(item => `${item.manufacturer}:${item.model}`).join(',');
        },
        deserializer: (urlValue: string) => {
          // Parse URL format back to items
          return urlValue.split(',').map(pair => {
            const [manufacturer, model] = pair.split(':');
            return { manufacturer, model };
          });
        },
        keyGenerator: (item: any) => {
          // Generate unique key: "manufacturer|model"
          return `${item.manufacturer}|${item.model}`;
        }
      }
    };
  }

  /**
   * Hydrate selection from URL - Single Mode
   * Called when URL param 'models-single' changes
   */
  private hydrateSelectionSingle(urlValue: string): void {
    console.log('[DemoComponent] Hydrating single mode from URL:', urlValue);

    if (!this.pickerConfigSingle?.selection?.deserializer || !this.pickerConfigSingle?.selection?.keyGenerator) {
      console.warn('[DemoComponent] Config not ready yet, will hydrate after data loads');
      console.warn('[DemoComponent] urlValue will be processed when pickerConfigSingle is initialized');
      // Store URL value for hydration after data loads
      // The URL subscription will fire again or we'll use the stored value
      return;
    }

    // Parse URL value to items using config deserializer
    const items = this.pickerConfigSingle.selection.deserializer(urlValue);
    console.log('[DemoComponent] Deserialized items:', items);

    // Convert items to keys using config keyGenerator
    const keys = new Set(items.map(item => this.pickerConfigSingle.selection!.keyGenerator!(item)));
    console.log('[DemoComponent] Generated keys:', Array.from(keys));

    // Update initialSelection (triggers BaseTableComponent hydration via ngOnChanges)
    this.initialSelectionSingle = keys;

    console.log('[DemoComponent] Set initialSelectionSingle, size:', keys.size);
  }

  /**
   * Hydrate selection from URL - Dual Mode
   * Called when URL param 'models-dual' changes
   */
  private hydrateSelectionDual(urlValue: string): void {
    console.log('[DemoComponent] Hydrating dual mode from URL:', urlValue);

    if (!this.pickerConfigDual?.selection?.deserializer || !this.pickerConfigDual?.selection?.keyGenerator) {
      console.warn('[DemoComponent] Cannot hydrate: config missing deserializer or keyGenerator');
      return;
    }

    // Parse URL value to items using config deserializer
    const items = this.pickerConfigDual.selection.deserializer(urlValue);

    // Convert items to keys using config keyGenerator
    const keys = new Set(items.map(item => this.pickerConfigDual.selection!.keyGenerator!(item)));

    // Update initialSelection (triggers BaseTableComponent hydration via ngOnChanges)
    this.initialSelectionDual = keys;

    console.log('[DemoComponent] Hydrated dual mode:', keys);
  }

  /**
   * Handle selection change event - Single Mode
   */
  onSelectionChangeSingle(event: SelectionChangeEvent): void {
    console.log('[DemoComponent] Single mode selection changed:', event);
    this.selectedKeysSingle = event.selectedKeys;
    this.selectedItemsSingle = event.selectedItems;
    this.selectionCountSingle = event.selectedKeys.size;
  }

  /**
   * Handle apply button click - Single Mode
   * Writes selection to URL (URL-first state management)
   */
  onApplySelectionSingle(event: SelectionChangeEvent): void {
    console.log('[DemoComponent] Single mode apply clicked:', event);
    this.selectedKeysSingle = event.selectedKeys;
    this.selectedItemsSingle = event.selectedItems;
    this.selectionCountSingle = event.selectedKeys.size;

    // URL-first: Write selection to URL
    if (this.pickerConfigSingle?.selection?.serializer && this.pickerConfigSingle?.selection?.urlParam) {
      const urlValue = this.pickerConfigSingle.selection.serializer(event.selectedItems);
      console.log('[DemoComponent] Writing to URL:', { param: this.pickerConfigSingle.selection.urlParam, value: urlValue });

      this.urlState.setQueryParams({
        [this.pickerConfigSingle.selection.urlParam]: urlValue
      });
    }

    alert(`SINGLE MODE: Applied ${this.selectionCountSingle} selections!\n\nCheck console and URL for details.`);
  }

  /**
   * Handle selection change event - Dual Mode
   */
  onSelectionChangeDual(event: SelectionChangeEvent): void {
    console.log('[DemoComponent] Dual mode selection changed:', event);
    this.selectedKeysDual = event.selectedKeys;
    this.selectedItemsDual = event.selectedItems;
    this.selectionCountDual = event.selectedKeys.size;
  }

  /**
   * Handle apply button click - Dual Mode
   * Writes selection to URL (URL-first state management)
   */
  onApplySelectionDual(event: SelectionChangeEvent): void {
    console.log('[DemoComponent] Dual mode apply clicked:', event);
    this.selectedKeysDual = event.selectedKeys;
    this.selectedItemsDual = event.selectedItems;
    this.selectionCountDual = event.selectedKeys.size;

    // URL-first: Write selection to URL
    if (this.pickerConfigDual?.selection?.serializer && this.pickerConfigDual?.selection?.urlParam) {
      const urlValue = this.pickerConfigDual.selection.serializer(event.selectedItems);
      console.log('[DemoComponent] Writing to URL:', { param: this.pickerConfigDual.selection.urlParam, value: urlValue });

      this.urlState.setQueryParams({
        [this.pickerConfigDual.selection.urlParam]: urlValue
      });
    }

    alert(`DUAL MODE: Applied ${this.selectionCountDual} selections!\n\nCheck console and URL for details.`);
  }

  /**
   * Load expandable demo data (vehicle results with VIN instances)
   * Demonstrates Phase 6: Expandable rows functionality
   */
  private loadExpandableData(): void {
    console.log('[DemoComponent] Loading expandable demo data...');

    // Get vehicle details for a few manufacturers/models for demo
    this.demoApiService.getVehicleDetails({
      models: 'Ford:F-150,Chevrolet:Corvette,Toyota:Camry,Tesla:Model 3',
      page: 1,
      size: 10
    }).subscribe({
      next: (response) => {
        // Response includes VIN instances embedded in each vehicle (from DemoApiService enhancement)
        this.expandableData = response.results;
        console.log('[DemoComponent] Expandable data loaded:', this.expandableData.length, 'vehicles');
      },
      error: (error) => {
        console.error('[DemoComponent] Error loading expandable data:', error);
      }
    });
  }
}
