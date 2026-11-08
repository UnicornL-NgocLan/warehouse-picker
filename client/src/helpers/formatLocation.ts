/**
 * Formats location string to "[Parent] / [Name]"
 * e.g. "WH/Stock/Shelf 1" -> "Stock / Shelf 1"
 * e.g. "WH/Stock" -> "WH / Stock"
 * e.g. "Stock" -> "Stock"
 */
export function formatLocationName(rawName?: string | null): string {
  if (!rawName || typeof rawName !== 'string') return '';
  const parts = rawName
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  const parentName = parts[parts.length - 2];
  const selfName = parts[parts.length - 1];
  return `${parentName} / ${selfName}`;
}

