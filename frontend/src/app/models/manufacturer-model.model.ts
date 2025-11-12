/*
  MANUFACTURER-MODEL DATA MODELS

  PURPOSE:
  These interfaces define the structure of manufacturer and model data
  used throughout the application, particularly in the picker component
  and vehicle search results.

  DATA SOURCE:
  This data comes from the backend API endpoint:
  GET /api/search/manufacturer-model-counts

  USAGE:
  - ManufacturerModelPickerComponent uses these to display the picker UI
  - UrlStateService stores selected combinations as "Ford:F-150,Chevrolet:Corvette"
  - Backend API uses model combinations to filter vehicle search results
*/

/**
 * MODEL INTERFACE
 *
 * Represents a single vehicle model within a manufacturer.
 *
 * Example:
 * {
 *   model: "F-150",
 *   count: 45231
 * }
 *
 * Count represents the number of vehicle records in the database
 * for this specific manufacturer-model combination across all years.
 */
export interface Model {
  /**
   * MODEL NAME
   * The name of the vehicle model
   * Examples: "F-150", "Mustang", "Civic", "Accord"
   */
  model: string;

  /**
   * RECORD COUNT
   * How many vehicle records exist for this manufacturer-model combination
   *
   * This count is the TOTAL across all years, body styles, etc.
   * For example, "Ford F-150" might have 45,000 records spanning:
   * - Years: 1990-2024 (35 years)
   * - Body styles: Regular Cab, SuperCab, SuperCrew
   * - Trim levels: XL, XLT, Lariat, King Ranch, Platinum, Limited
   */
  count: number;
}

/**
 * MANUFACTURER INTERFACE
 *
 * Represents a vehicle manufacturer and all their models.
 *
 * Example:
 * {
 *   manufacturer: "Ford",
 *   models: [
 *     { model: "F-150", count: 45231 },
 *     { model: "Mustang", count: 12450 },
 *     { model: "Explorer", count: 8923 }
 *   ]
 * }
 */
export interface Manufacturer {
  /**
   * MANUFACTURER NAME
   * The name of the vehicle manufacturer/brand
   * Examples: "Ford", "Chevrolet", "Toyota", "Honda"
   */
  manufacturer: string;

  /**
   * MODELS ARRAY
   * Array of all models produced by this manufacturer
   * Sorted alphabetically by model name in the UI
   */
  models: Model[];
}

/**
 * MANUFACTURER-MODEL COUNTS RESPONSE
 *
 * The top-level response from the backend API.
 * This is what we receive from GET /api/search/manufacturer-model-counts
 *
 * Example API Response:
 * {
 *   manufacturers: [
 *     {
 *       manufacturer: "Ford",
 *       models: [
 *         { model: "F-150", count: 45231 },
 *         { model: "Mustang", count: 12450 }
 *       ]
 *     },
 *     {
 *       manufacturer: "Chevrolet",
 *       models: [
 *         { model: "Silverado", count: 38920 },
 *         { model: "Corvette", count: 9341 }
 *       ]
 *     }
 *   ]
 * }
 */
export interface ManufacturerModelCountsResponse {
  /**
   * MANUFACTURERS ARRAY
   * Array of all manufacturers and their models
   * Sorted alphabetically by manufacturer name in the UI
   */
  manufacturers: Manufacturer[];
}

/**
 * MODEL COMBINATION INTERFACE
 *
 * Represents a selected manufacturer-model combination.
 * This is what the picker component emits when user makes selections.
 *
 * Example:
 * {
 *   manufacturer: "Ford",
 *   model: "F-150"
 * }
 *
 * USAGE IN URL:
 * Multiple combinations are encoded in URL as comma-separated strings:
 * ?models=Ford:F-150,Chevrolet:Corvette,Toyota:Camry
 *
 * The UrlStateService handles encoding/decoding this format.
 */
export interface ModelCombination {
  /**
   * MANUFACTURER NAME
   * The selected manufacturer
   */
  manufacturer: string;

  /**
   * MODEL NAME
   * The selected model within that manufacturer
   */
  model: string;
}

/**
 * HELPER FUNCTIONS
 *
 * These utility functions help convert between different representations
 * of manufacturer-model combinations.
 */

/**
 * MODEL COMBINATION TO STRING
 *
 * Converts a ModelCombination object to its string representation.
 *
 * @param combo - The combination to convert
 * @returns String in format "Manufacturer:Model"
 *
 * Example:
 * modelComboToString({ manufacturer: "Ford", model: "F-150" })
 * // Returns: "Ford:F-150"
 */
export function modelComboToString(combo: ModelCombination): string {
  return `${combo.manufacturer}:${combo.model}`;
}

/**
 * STRING TO MODEL COMBINATION
 *
 * Converts a string representation back to a ModelCombination object.
 *
 * @param str - String in format "Manufacturer:Model"
 * @returns ModelCombination object
 *
 * Example:
 * stringToModelCombo("Ford:F-150")
 * // Returns: { manufacturer: "Ford", model: "F-150" }
 */
export function stringToModelCombo(str: string): ModelCombination {
  const [manufacturer, model] = str.split(':');
  return { manufacturer, model };
}

/**
 * MODEL COMBINATIONS TO STRING ARRAY
 *
 * Converts an array of ModelCombination objects to string array.
 *
 * @param combos - Array of combinations
 * @returns Array of strings in format ["Manufacturer:Model", ...]
 *
 * Example:
 * modelCombosToStrings([
 *   { manufacturer: "Ford", model: "F-150" },
 *   { manufacturer: "Chevrolet", model: "Corvette" }
 * ])
 * // Returns: ["Ford:F-150", "Chevrolet:Corvette"]
 */
export function modelCombosToStrings(combos: ModelCombination[]): string[] {
  return combos.map(modelComboToString);
}

/**
 * STRING ARRAY TO MODEL COMBINATIONS
 *
 * Converts a string array back to ModelCombination objects.
 *
 * @param strings - Array of strings in format ["Manufacturer:Model", ...]
 * @returns Array of ModelCombination objects
 *
 * Example:
 * stringsToModelCombos(["Ford:F-150", "Chevrolet:Corvette"])
 * // Returns: [
 * //   { manufacturer: "Ford", model: "F-150" },
 * //   { manufacturer: "Chevrolet", model: "Corvette" }
 * // ]
 */
export function stringsToModelCombos(strings: string[]): ModelCombination[] {
  return strings.map(stringToModelCombo);
}

/**
 * URL PARAM TO MODEL COMBINATIONS
 *
 * Converts the URL query parameter format to ModelCombination array.
 * This handles the comma-separated format used in URLs.
 *
 * @param param - URL query parameter value (comma-separated combinations)
 * @returns Array of ModelCombination objects
 *
 * Example:
 * urlParamToModelCombos("Ford:F-150,Chevrolet:Corvette,Toyota:Camry")
 * // Returns: [
 * //   { manufacturer: "Ford", model: "F-150" },
 * //   { manufacturer: "Chevrolet", model: "Corvette" },
 * //   { manufacturer: "Toyota", model: "Camry" }
 * // ]
 *
 * EDGE CASES:
 * - Empty string: returns empty array
 * - Null/undefined: returns empty array
 * - Invalid format: returns empty array (could add validation)
 */
export function urlParamToModelCombos(param: string | null | undefined): ModelCombination[] {
  if (!param || param.trim() === '') {
    return [];
  }

  return param
    .split(',')
    .filter(s => s.includes(':')) // Only process valid format
    .map(stringToModelCombo);
}

/**
 * MODEL COMBINATIONS TO URL PARAM
 *
 * Converts an array of ModelCombination objects to URL query parameter format.
 *
 * @param combos - Array of combinations
 * @returns Comma-separated string for URL query parameter
 *
 * Example:
 * modelCombosToUrlParam([
 *   { manufacturer: "Ford", model: "F-150" },
 *   { manufacturer: "Chevrolet", model: "Corvette" }
 * ])
 * // Returns: "Ford:F-150,Chevrolet:Corvette"
 *
 * EDGE CASES:
 * - Empty array: returns empty string
 */
export function modelCombosToUrlParam(combos: ModelCombination[]): string {
  if (combos.length === 0) {
    return '';
  }

  return modelCombosToStrings(combos).join(',');
}
