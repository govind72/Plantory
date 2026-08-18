/**
 * Landed cost allocation (CLAUDE.md §4).
 *
 *   landed cost = purchase cost + allocated purchase expenses
 *
 * V1 method: allocate total purchase expenses across items **proportional to
 * purchase value**. If total value is 0 (e.g. free plants) we fall back to
 * proportional-to-quantity. All money is rounded to 2 decimals; any rounding
 * remainder is placed on the largest line so the allocated expenses sum EXACTLY
 * to the total. This mirrors the SQL in finalize_purchase() and is the tested
 * reference used to preview landed cost in the draft UI.
 */
export type LandedInput = { id: string; quantity: number; unitCost: number };

export type LandedLine = {
  id: string;
  lineValue: number;
  allocatedExpense: number;
  landedLineTotal: number;
  landedUnitCost: number;
};

export type LandedResult = {
  lines: LandedLine[];
  totalPurchaseValue: number;
  totalExpenses: number;
  landedTotal: number;
};

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function allocateLandedCost(
  items: LandedInput[],
  totalExpenses: number,
): LandedResult {
  const expenses = round2(Math.max(0, totalExpenses || 0));

  const base = items.map((it) => ({
    id: it.id,
    quantity: it.quantity,
    lineValue: round2(it.quantity * it.unitCost),
  }));

  const totalValue = round2(base.reduce((s, l) => s + l.lineValue, 0));
  const totalQty = base.reduce((s, l) => s + l.quantity, 0);
  const useValue = totalValue > 0;
  const weightTotal = useValue ? totalValue : totalQty;

  const withAlloc = base.map((l) => {
    const weight = useValue ? l.lineValue : l.quantity;
    const allocatedExpense =
      expenses > 0 && weightTotal > 0
        ? round2((expenses * weight) / weightTotal)
        : 0;
    return { ...l, allocatedExpense };
  });

  // Push the rounding remainder onto the largest line so the sum is exact.
  const allocatedSum = round2(
    withAlloc.reduce((s, l) => s + l.allocatedExpense, 0),
  );
  const remainder = round2(expenses - allocatedSum);
  if (remainder !== 0 && withAlloc.length > 0) {
    let idx = 0;
    const weightOf = (l: (typeof withAlloc)[number]) =>
      useValue ? l.lineValue : l.quantity;
    for (let i = 1; i < withAlloc.length; i++) {
      if (weightOf(withAlloc[i]) > weightOf(withAlloc[idx])) idx = i;
    }
    withAlloc[idx].allocatedExpense = round2(
      withAlloc[idx].allocatedExpense + remainder,
    );
  }

  const lines: LandedLine[] = withAlloc.map((l) => {
    const landedLineTotal = round2(l.lineValue + l.allocatedExpense);
    const landedUnitCost =
      l.quantity > 0 ? round2(landedLineTotal / l.quantity) : 0;
    return {
      id: l.id,
      lineValue: l.lineValue,
      allocatedExpense: l.allocatedExpense,
      landedLineTotal,
      landedUnitCost,
    };
  });

  return {
    lines,
    totalPurchaseValue: totalValue,
    totalExpenses: expenses,
    landedTotal: round2(lines.reduce((s, l) => s + l.landedLineTotal, 0)),
  };
}
