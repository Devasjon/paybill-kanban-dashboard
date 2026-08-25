import type { DebtColorScheme } from "@/types";

/**
 * Color palettes for the debt payoff dashboard (Debts + Analytics pages)
 * ONLY — deliberately kept separate from lib/theme.ts so the rest of the
 * app (sidebar, buttons, every other page) is provably unaffected by this
 * toggle. Components that want these colors receive a resolved
 * DebtSchemePalette as a prop; nothing here is read implicitly.
 */
export interface DebtSchemePalette {
  /** 5 tiles, in order: Starting Debt, Current Debt, Total Paid, Months Until Payoff, Debt-Free Date */
  tiles: { bg: string; fg: string }[];
  /** Per-debt bar colors — cycled with modulo if there are more debts than colors */
  chartBars: string[];
  donutPaid: string;
  donutRemaining: string;
  lineStroke: string;
  lineFill: string;
  progressFill: string;
  progressTrack: string;
  /** Buttons / active toggle state / checkbox accent within these scoped components */
  accent: string;
}

export const debtColorSchemes: Record<DebtColorScheme, DebtSchemePalette> = {
  pinkPurple: {
    tiles: [
      { bg: "#F3E8FF", fg: "#7C3AED" },
      { bg: "#FCE7F3", fg: "#DB2777" },
      { bg: "#EDE9FE", fg: "#6D28D9" },
      { bg: "#FBCFE8", fg: "#9D174D" },
      { bg: "#E9D5FF", fg: "#6B21A8" },
    ],
    chartBars: ["#A855F7", "#EC4899", "#C084FC", "#F472B6", "#D946EF"],
    donutPaid: "#A855F7",
    donutRemaining: "#F3E8FF",
    lineStroke: "#DB2777",
    lineFill: "rgba(219, 39, 119, 0.15)",
    progressFill: "#A855F7",
    progressTrack: "#F3E8FF",
    accent: "#A855F7",
  },
  blueGreen: {
    tiles: [
      { bg: "#DBEAFE", fg: "#1D4ED8" },
      { bg: "#D1FAE5", fg: "#047857" },
      { bg: "#CFFAFE", fg: "#0E7490" },
      { bg: "#A7F3D0", fg: "#065F46" },
      { bg: "#BFDBFE", fg: "#1E40AF" },
    ],
    chartBars: ["#3B82F6", "#10B981", "#06B6D4", "#34D399", "#0EA5E9"],
    donutPaid: "#10B981",
    donutRemaining: "#DBEAFE",
    lineStroke: "#0E7490",
    lineFill: "rgba(14, 116, 144, 0.15)",
    progressFill: "#3B82F6",
    progressTrack: "#DBEAFE",
    accent: "#3B82F6",
  },
};
