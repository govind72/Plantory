/**
 * Deterministic money-rounding helpers used by the pricing engine.
 *
 * All monetary values are rupees with up to 2 decimal places
 * (see CLAUDE.md §2: money is stored as numeric(12,2)). These functions are
 * pure and IO-free so they can be unit-tested in isolation (CLAUDE.md §4, §9).
 */

/** Round `value` to the nearest multiple of `step` (e.g. nearest ₹10). */
export function roundToNearest(value: number, step: number): number {
  if (step <= 0) throw new Error('step must be greater than 0')
  return Math.round(value / step) * step
}

/** Round `value` UP to the next multiple of `step` (never rounds a price down). */
export function roundUpToNearest(value: number, step: number): number {
  if (step <= 0) throw new Error('step must be greater than 0')
  return Math.ceil(value / step) * step
}
