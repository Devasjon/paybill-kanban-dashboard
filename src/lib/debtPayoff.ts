import type { Debt, DebtStrategy } from "@/types";

const MAX_MONTHS = 600; // 50-year safety cap so an infeasible plan doesn't loop forever

export interface PayoffPlan {
  order: Debt[]; // debts in payoff priority order (excludes already-cleared debts)
  months: number; // months until every debt hits zero (capped at MAX_MONTHS)
  totalInterest: number;
  monthlyBudget: number; // sum of minimum payments + extra payment
  payoffMonth: Record<string, number>; // debt id -> month it reaches zero
  feasible: boolean; // false if MAX_MONTHS was hit without clearing every debt
}

/**
 * Falls back to an estimated minimum payment when a debt doesn't have one
 * set (minPayment is optional on Debt) — 2% of the current balance, floored
 * at RM20, matching a typical card-issuer minimum. Any explicitly-entered
 * minPayment is always used instead, INCLUDING an explicit 0 (e.g. a
 * 0%-interest installment plan with no required minimum) — treating 0 the
 * same as "not set" would silently override what the user actually entered
 * on the debt, throwing off the payoff plan's monthly budget.
 */
export function estimateMinPayment(debt: Debt): number {
  if (debt.minPayment !== undefined) return debt.minPayment;
  return Math.min(debt.currentBalance, Math.max(debt.currentBalance * 0.02, 20));
}

export function orderDebts(debts: Debt[], strategy: DebtStrategy): Debt[] {
  const active = debts.filter((d) => d.currentBalance > 0.01);
  const sorted = [...active];
  if (strategy === "avalanche") {
    // Highest interest rate first — minimizes total interest paid.
    sorted.sort((a, b) => (b.apr ?? 0) - (a.apr ?? 0) || a.currentBalance - b.currentBalance);
  } else {
    // Smallest balance first — clears individual debts fastest for quick wins.
    sorted.sort((a, b) => a.currentBalance - b.currentBalance || (b.apr ?? 0) - (a.apr ?? 0));
  }
  return sorted;
}

/**
 * Simulates paying off `debts` month by month under `strategy`, keeping the
 * total monthly outflow fixed at (sum of minimum payments + extraPayment):
 * each month, minimums are paid on every active debt, then whatever's left
 * of that fixed budget (including minimums freed up by debts already paid
 * off) goes toward the top-priority remaining debt — the actual mechanic
 * that makes avalanche/snowball plans accelerate over time.
 */
export function simulatePayoff(debts: Debt[], strategy: DebtStrategy, extraPayment: number): PayoffPlan {
  const order = orderDebts(debts, strategy);

  if (order.length === 0) {
    return { order, months: 0, totalInterest: 0, monthlyBudget: 0, payoffMonth: {}, feasible: true };
  }

  const balances = new Map(order.map((d) => [d.id, d.currentBalance]));
  const minPayments = new Map(order.map((d) => [d.id, estimateMinPayment(d)]));
  const monthlyRates = new Map(order.map((d) => [d.id, (d.apr ?? 0) / 100 / 12]));
  const monthlyBudget = order.reduce((s, d) => s + minPayments.get(d.id)!, 0) + Math.max(0, extraPayment);

  const payoffMonth: Record<string, number> = {};
  let totalInterest = 0;
  let month = 0;

  while (order.some((d) => (balances.get(d.id) ?? 0) > 0.01) && month < MAX_MONTHS) {
    month++;
    let spent = 0;

    for (const d of order) {
      let bal = balances.get(d.id)!;
      if (bal <= 0) continue;
      const interest = bal * monthlyRates.get(d.id)!;
      totalInterest += interest;
      bal += interest;
      const minPay = Math.min(minPayments.get(d.id)!, bal);
      bal -= minPay;
      spent += minPay;
      balances.set(d.id, bal);
    }

    let remainder = Math.max(0, monthlyBudget - spent);
    for (const d of order) {
      if (remainder <= 0) break;
      let bal = balances.get(d.id)!;
      if (bal <= 0) continue;
      const pay = Math.min(remainder, bal);
      bal -= pay;
      remainder -= pay;
      balances.set(d.id, bal);
    }

    for (const d of order) {
      if (!(d.id in payoffMonth) && (balances.get(d.id) ?? 0) <= 0.01) {
        payoffMonth[d.id] = month;
      }
    }
  }

  const feasible = month < MAX_MONTHS;
  return { order, months: month, totalInterest, monthlyBudget, payoffMonth, feasible };
}
