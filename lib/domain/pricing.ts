import { round2 } from "./landed-cost";
import { roundUpToNearest } from "./rounding";

/**
 * Suggest min / recommended selling prices from landed cost + margin rules
 * (CLAUDE.md §4). Deterministic and pure — used to pre-fill the pricing editor.
 *
 *   min price          = landed × (1 + minMargin%)   ↑ rounded to step
 *   recommended price  = landed × (1 + targetMargin%) ↑ rounded to step
 *
 * Rounding is always UP to the step so a price never dips below its margin
 * floor. A step of 0 (or less) means no rounding (kept to 2 decimals).
 */
export type PriceRules = {
  minMarginPct: number;
  targetMarginPct: number;
  roundingStep: number;
};

export type SuggestedPrices = { minPrice: number; recommendedPrice: number };

export function suggestPrices(
  landedCost: number,
  rules: PriceRules,
): SuggestedPrices {
  const landed = Math.max(0, landedCost || 0);
  const step = rules.roundingStep;
  const roundUp = (n: number) =>
    step && step > 0 ? roundUpToNearest(n, step) : round2(n);

  return {
    minPrice: roundUp(landed * (1 + (rules.minMarginPct || 0) / 100)),
    recommendedPrice: roundUp(landed * (1 + (rules.targetMarginPct || 0) / 100)),
  };
}
