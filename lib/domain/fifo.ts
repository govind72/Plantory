import { round2 } from "./landed-cost";

/**
 * FIFO batch consumption (CLAUDE.md §4). Given batches ordered oldest-first,
 * draw down `quantity` across them and report the exact per-batch split and
 * cost. Never allows negative stock — throws InsufficientStockError instead.
 * This is the tested reference for the SQL in transfer_stock / record_loss
 * (and, later, the sale RPC).
 */
export type FifoBatch = { id: string; qtyRemaining: number; unitCost: number };
export type FifoConsumption = {
  batchId: string;
  quantity: number;
  unitCost: number;
};
export type FifoResult = {
  consumptions: FifoConsumption[];
  totalCost: number;
  totalQuantity: number;
};

export class InsufficientStockError extends Error {
  constructor(
    public available: number,
    public requested: number,
  ) {
    super(`Insufficient stock: ${available} available, ${requested} requested`);
    this.name = "InsufficientStockError";
  }
}

/** `batches` MUST be pre-sorted oldest-first (received_at asc). */
export function consumeFifo(
  batches: FifoBatch[],
  quantity: number,
): FifoResult {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity must be positive");
  }

  const available = batches.reduce((s, b) => s + b.qtyRemaining, 0);
  if (available < quantity) {
    throw new InsufficientStockError(available, quantity);
  }

  const consumptions: FifoConsumption[] = [];
  let remaining = quantity;
  for (const b of batches) {
    if (remaining <= 0) break;
    if (b.qtyRemaining <= 0) continue;
    const take = Math.min(remaining, b.qtyRemaining);
    consumptions.push({ batchId: b.id, quantity: take, unitCost: b.unitCost });
    remaining -= take;
  }

  const totalCost = round2(
    consumptions.reduce((s, c) => s + c.quantity * c.unitCost, 0),
  );
  return { consumptions, totalCost, totalQuantity: quantity };
}
