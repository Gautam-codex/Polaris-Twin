// Demo barcodes printed on store shelves → inventory item names (as seeded in supabase/schema.sql).
// The website serves a printable sheet of these codes at /barcodes.

export const BARCODES: Record<string, string> = {
  "PT-INV-0001": "Aviation turbine fuel (helicopters)",
  "PT-INV-0002": "Petrol for snow vehicles",
  "PT-INV-0003": "Rice",
  "PT-INV-0004": "Wheat flour (atta)",
  "PT-INV-0005": "Frozen meat",
  "PT-INV-0006": "Milk powder",
  "PT-INV-0007": "Antibiotic courses",
  "PT-INV-0008": "Medical oxygen cylinders",
  "PT-INV-0009": "Generator oil filters",
  "PT-INV-0010": "Liquid nitrogen",
};

/** Item name for a scanned code, or null if the code is not a Polaris Twin shelf label. */
export function itemForCode(code: string): string | null {
  return BARCODES[code.trim().toUpperCase()] ?? null;
}
