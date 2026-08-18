/**
 * Compose a human display label for a plant size from its height (in feet) and
 * bag size. Pure + testable. Used to pre-fill the size label in the plant form.
 *
 * Examples:
 *   composeSizeLabel(6, "12 inch") -> "6 ft · 12 inch"
 *   composeSizeLabel(6, null)      -> "6 ft"
 *   composeSizeLabel(null, "10x10")-> "10x10"
 *   composeSizeLabel(null, null)   -> "Standard"
 */
export function composeSizeLabel(
  heightFt: number | null | undefined,
  bagSize: string | null | undefined,
): string {
  const parts: string[] = [];
  if (heightFt != null && heightFt > 0) parts.push(`${formatHeight(heightFt)} ft`);
  const bag = bagSize?.trim();
  if (bag) parts.push(bag);
  return parts.length > 0 ? parts.join(" · ") : "Standard";
}

/** 6 -> "6", 6.5 -> "6.5" (never "6.00"). */
export function formatHeight(heightFt: number): string {
  return Number(heightFt)
    .toFixed(2)
    .replace(/\.00$/, "")
    .replace(/(\.\d)0$/, "$1");
}
