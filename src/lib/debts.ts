import type { Debt } from "@/types";

export function debtPaidOffPercent(d: Debt): number {
  if (d.originalAmount <= 0) return 0;
  const paidOff = d.originalAmount - d.currentBalance;
  return Math.max(0, Math.min(100, Math.round((paidOff / d.originalAmount) * 100)));
}

export function totalDebtSummary(debts: Debt[]) {
  const originalTotal = debts.reduce((s, d) => s + d.originalAmount, 0);
  const balanceTotal = debts.reduce((s, d) => s + d.currentBalance, 0);
  const paidOff = originalTotal - balanceTotal;
  const percent = originalTotal > 0 ? Math.round((paidOff / originalTotal) * 100) : 0;
  return { originalTotal, balanceTotal, paidOff, percent };
}
