/**
 * Unit Presets System
 * Predefined unit categories with common conversions for manufacturing
 */

// ============================================================
// Unit Category Definitions
// ============================================================

export interface UnitCategory {
  name: string;
  units: string[];
  /** Conversion factors to the first unit in the array (base unit) */
  conversions: Record<string, number>;
}

/**
 * Predefined unit categories with common conversions
 * Each category has a base unit (first in array) and conversion factors
 */
export const UNIT_CATEGORIES: Record<string, UnitCategory> = {
  weight: {
    name: 'Weight',
    units: ['lbs', 'kg', 'oz', 'g'],
    conversions: {
      // All conversions TO lbs (base unit)
      lbs: 1,
      kg: 2.20462,  // 1 kg = 2.20462 lbs
      oz: 0.0625,   // 1 oz = 0.0625 lbs
      g: 0.00220462 // 1 g = 0.00220462 lbs
    }
  },
  length: {
    name: 'Length',
    units: ['in', 'ft', 'mm', 'cm', 'm'],
    conversions: {
      // All conversions TO inches (base unit)
      in: 1,
      ft: 12,       // 1 ft = 12 in
      mm: 0.03937,  // 1 mm = 0.03937 in
      cm: 0.3937,   // 1 cm = 0.3937 in
      m: 39.37      // 1 m = 39.37 in
    }
  },
  volume: {
    name: 'Volume',
    units: ['gal', 'L', 'qt', 'mL', 'fl oz'],
    conversions: {
      // All conversions TO gallons (base unit)
      gal: 1,
      L: 0.264172,    // 1 L = 0.264172 gal
      qt: 0.25,       // 1 qt = 0.25 gal
      mL: 0.000264172,// 1 mL = 0.000264172 gal
      'fl oz': 0.0078125 // 1 fl oz = 0.0078125 gal
    }
  },
  count: {
    name: 'Count',
    units: ['pcs', 'ea', 'box', 'case', 'dozen'],
    conversions: {
      // User-defined per item, but we provide standard ones
      pcs: 1,
      ea: 1,
      box: 1,   // User should configure
      case: 1,  // User should configure
      dozen: 12
    }
  },
  area: {
    name: 'Area',
    units: ['sq in', 'sq ft', 'sq cm', 'sq m'],
    conversions: {
      // All conversions TO sq inches (base unit)
      'sq in': 1,
      'sq ft': 144,     // 1 sq ft = 144 sq in
      'sq cm': 0.155,   // 1 sq cm = 0.155 sq in
      'sq m': 1550      // 1 sq m = 1550 sq in
    }
  }
};

// ============================================================
// Common Units List (flat for dropdowns)
// ============================================================

/**
 * All available units as a flat array for dropdowns
 */
export const ALL_UNITS: string[] = Object.values(UNIT_CATEGORIES)
  .flatMap((category) => category.units);

/**
 * Common units grouped by category for organized dropdowns
 */
export const UNITS_BY_CATEGORY = Object.entries(UNIT_CATEGORIES).map(
  ([key, category]) => ({
    category: category.name,
    units: category.units
  })
);

// ============================================================
// Conversion Helpers
// ============================================================

/**
 * Find which category a unit belongs to
 */
export function getUnitCategory(unit: string): UnitCategory | undefined {
  return Object.values(UNIT_CATEGORIES).find((category) =>
    category.units.includes(unit)
  );
}

/**
 * Get the base unit for a given unit
 */
export function getBaseUnit(unit: string): string | undefined {
  const category = getUnitCategory(unit);
  return category?.units[0];
}

/**
 * Get conversion factor from one unit to another within the same category
 * Returns undefined if units are not in the same category
 */
export function getConversionFactor(
  fromUnit: string,
  toUnit: string
): number | undefined {
  const category = getUnitCategory(fromUnit);
  if (!category || !category.units.includes(toUnit)) {
    return undefined;
  }

  const fromFactor = category.conversions[fromUnit];
  const toFactor = category.conversions[toUnit];

  if (fromFactor === undefined || toFactor === undefined) {
    return undefined;
  }

  // Convert: fromUnit -> base -> toUnit
  // fromUnit * fromFactor = base
  // base / toFactor = toUnit
  return fromFactor / toFactor;
}

/**
 * Convert a quantity from one unit to another
 * Uses preset conversions if available, otherwise returns undefined
 */
export function convertUnits(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number | undefined {
  if (fromUnit === toUnit) {
    return quantity;
  }

  const factor = getConversionFactor(fromUnit, toUnit);
  if (factor === undefined) {
    return undefined;
  }

  return quantity * factor;
}

/**
 * Convert quantity to base unit using custom conversions
 * Used when item has custom unit conversions defined
 */
export function convertToBaseUnit(
  quantity: number,
  fromUnit: string,
  primaryUnit: string,
  customConversions: { from_unit: string; to_primary_factor: number }[]
): number {
  // If already in primary unit, return as-is
  if (fromUnit === primaryUnit) {
    return quantity;
  }

  // Check custom conversions first
  const customConversion = customConversions.find(
    (c) => c.from_unit === fromUnit
  );
  if (customConversion) {
    return quantity * customConversion.to_primary_factor;
  }

  // Fall back to preset conversions if both units are in same category
  const presetConversion = convertUnits(quantity, fromUnit, primaryUnit);
  if (presetConversion !== undefined) {
    return presetConversion;
  }

  // If no conversion found, return original (shouldn't happen with validation)
  console.warn(`No conversion found from ${fromUnit} to ${primaryUnit}`);
  return quantity;
}

/**
 * Get suggested conversion factor for a unit to a primary unit
 * Returns preset factor if units are in same category, otherwise 1
 */
export function getSuggestedConversionFactor(
  fromUnit: string,
  primaryUnit: string
): number {
  const factor = getConversionFactor(fromUnit, primaryUnit);
  return factor !== undefined ? factor : 1;
}

/**
 * Check if two units are compatible (in same category or convertible)
 */
export function areUnitsCompatible(unit1: string, unit2: string): boolean {
  if (unit1 === unit2) return true;

  const category1 = getUnitCategory(unit1);
  const category2 = getUnitCategory(unit2);

  if (!category1 || !category2) return false;

  return category1 === category2;
}

// ============================================================
// Display Helpers
// ============================================================

/**
 * Get unit display name (same as unit for now, but could be extended)
 */
export function getUnitDisplayName(unit: string): string {
  return unit;
}

/**
 * Format unit for display with optional plural handling
 */
export function formatUnit(unit: string, quantity: number): string {
  // For now, just return the unit as-is
  // Could be extended for proper pluralization
  return unit;
}
