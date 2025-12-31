/**
 * Shared CSV parsing utility for all import modules.
 * Handles quoted fields, escaped quotes (""), and malformed rows.
 */

/**
 * Parse CSV text into a 2D array.
 * Handles quoted fields and escaped quotes ("").
 * Falls back to simple comma split if quotes are malformed.
 */
export function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const expectedColumns = lines[0]?.split(',').length || 0;

  return lines.map((line) => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());

    // If we ended up with wrong column count due to unclosed quotes,
    // fall back to simple comma split (treating quotes as literals)
    if (result.length !== expectedColumns && expectedColumns > 0) {
      return line.split(',').map((s) => s.trim().replace(/^"|"$/g, ''));
    }

    return result;
  });
}
