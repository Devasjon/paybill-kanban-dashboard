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

export interface MonthlyDebtSnapshot {
  debtId: string;
  payment: number; // total paid toward this debt this month (minimum + any rollover share)
  balance: number; // balance after this month's payment
}

export interface MonthlySchedule {
  month: number; // 1-indexed
  totalPayment: number;
  totalBalance: number;
  debts: MonthlyDebtSnapshot[];
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

interface SimulationResult {
  payoffMonth: Record<string, number>;
  totalInterest: number;
  month: number;
  feasible: boolean;
  schedule: MonthlySchedule[];
}

/**
 * Shared month-by-month simulation engine. Keeps the total monthly outflow
 * fixed at (sum of minimum payments + extraPayment): each month, minimums
 * are paid on every active debt, then whatever's left of that fixed budget
 * (including minimums freed up by debts already paid off) goes toward the
 * top-priority remaining debt — the mechanic that makes avalanche/snowball
 * plans accelerate over time. `collectSchedule` controls whether per-month
 * snapshots are retained (needed for the payoff schedule table and the
 * balance-over-time chart) or discarded (the cheaper path used by the
 * summary-only `simulatePayoff`).
 */
function runSimulation(order: Debt[], extraPayment: number, collectSchedule: boolean): SimulationResult {
  const balances = new Map(order.map((d) => [d.id, d.currentBalance]));
  const minPayments = new Map(order.map((d) => [d.id, estimateMinPayment(d)]));
  const monthlyRates = new Map(order.map((d) => [d.id, (d.apr ?? 0) / 100 / 12]));
  const monthlyBudget = order.reduce((s, d) => s + minPayments.get(d.id)!, 0) + Math.max(0, extraPayment);

  const payoffMonth: Record<string, number> = {};
  const schedule: MonthlySchedule[] = [];
  let totalInterest = 0;
  let month = 0;

  while (order.some((d) => (balances.get(d.id) ?? 0) > 0.01) && month < MAX_MONTHS) {
    month++;
    let spent = 0;
    const paymentThisMonth = new Map<string, number>();

    for (const d of order) {
      let bal = balances.get(d.id)!;
      if (bal <= 0) {
        paymentThisMonth.set(d.id, 0);
        continue;
      }
      const interest = bal * monthlyRates.get(d.id)!;
      totalInterest += interest;
      bal += interest;
      const minPay = Math.min(minPayments.get(d.id)!, bal);
      bal -= minPay;
      spent += minPay;
      balances.set(d.id, bal);
      paymentThisMonth.set(d.id, minPay);
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
      paymentThisMonth.set(d.id, (paymentThisMonth.get(d.id) ?? 0) + pay);
    }

    for (const d of order) {
      if (!(d.id in payoffMonth) && (balances.get(d.id) ?? 0) <= 0.01) {
        payoffMonth[d.id] = month;
      }
    }

    if (collectSchedule) {
      const debtSnapshots: MonthlyDebtSnapshot[] = order.map((d) => ({
        debtId: d.id,
        payment: paymentThisMonth.get(d.id) ?? 0,
        balance: Math.max(0, balances.get(d.id) ?? 0),
      }));
      schedule.push({
        month,
        totalPayment: debtSnapshots.reduce((s, d) => s + d.payment, 0),
        totalBalance: debtSnapshots.reduce((s, d) => s + d.balance, 0),
        debts: debtSnapshots,
      });
    }
  }

  return { payoffMonth, totalInterest, month, feasible: month < MAX_MONTHS, schedule };
}

/**
 * Simulates paying off `debts` month by month under `strategy`. See
 * runSimulation() above for the budget-rollover mechanics.
 */
export function simulatePayoff(debts: Debt[], strategy: DebtStrategy, extraPayment: number): PayoffPlan {
  const order = orderDebts(debts, strategy);

  if (order.length === 0) {
    return { order, months: 0, totalInterest: 0, monthlyBudget: 0, payoffMonth: {}, feasible: true };
  }

  const minPayments = order.reduce((s, d) => s + estimateMinPayment(d), 0);
  const monthlyBudget = minPayments + Math.max(0, extraPayment);
  const { payoffMonth, totalInterest, month, feasible } = runSimulation(order, extraPayment, false);

  return { order, months: month, totalInterest, monthlyBudget, payoffMonth, feasible };
}

/**
 * Same simulation as simulatePayoff, but also returns the full month-by-month
 * schedule (balance and payment per debt, every month) for the payoff
 * schedule table and the balance-over-time chart.
 */
export function simulatePayoffSchedule(
  debts: Debt[],
  strategy: DebtStrategy,
  extraPayment: number
): { plan: PayoffPlan; schedule: MonthlySchedule[] } {
  const order = orderDebts(debts, strategy);

  if (order.length === 0) {
    return {
      plan: { order, months: 0, totalInterest: 0, monthlyBudget: 0, payoffMonth: {}, feasible: true },
      schedule: [],
    };
  }

  const minPayments = order.reduce((s, d) => s + estimateMinPayment(d), 0);
  const monthlyBudget = minPayments + Math.max(0, extraPayment);
  const { payoffMonth, totalInterest, month, feasible, schedule } = runSimulation(order, extraPayment, true);

  return {
    plan: { order, months: month, totalInterest, monthlyBudget, payoffMonth, feasible },
    schedule,
  };
}
