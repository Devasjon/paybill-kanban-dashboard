import { useEffect, useMemo, useState } from "react";
import type { Debt, DebtColorScheme, DebtStrategy } from "@/types";
import { useI18n } from "@/lib/i18n";
import { formatRM, formatRMShort } from "@/lib/bills";
import { debtTypeLabelKey } from "@/lib/labels";
import { simulatePayoff, simulatePayoffSchedule, estimateMinPayment } from "@/lib/debtPayoff";
import { debtColorSchemes } from "@/lib/debtColorSchemes";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/StatCard";
import { statCardPalette } from "@/lib/theme";
import { Mountain, Snowflake, TrendingDown, AlertTriangle, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { ColorSchemeToggle } from "@/components/debtDashboard/ColorSchemeToggle";
import { DebtDashboardTiles } from "@/components/debtDashboard/DebtDashboardTiles";
import { DebtDashboardCharts } from "@/components/debtDashboard/DebtDashboardCharts";
import { PayoffScheduleTable } from "@/components/debtDashboard/PayoffScheduleTable";

export function monthsToDateLabel(months: number, lang: "en" | "ms"): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString(lang === "ms" ? "ms-MY" : "en-GB", { month: "long", year: "numeric" });
}

export function Analytics({
  debts,
  extraDebtPayment,
  onSetExtraDebtPayment,
  debtColorScheme,
  onSetDebtColorScheme,
}: {
  debts: Debt[];
  extraDebtPayment: number;
  onSetExtraDebtPayment: (n: number) => void;
  debtColorScheme: DebtColorScheme;
  onSetDebtColorScheme: (scheme: DebtColorScheme) => void;
}) {
  const { t, lang } = useI18n();
  const [strategy, setStrategy] = useState<DebtStrategy>("avalanche");
  const [extraInput, setExtraInput] = useState(extraDebtPayment.toString());
  const palette = debtColorSchemes[debtColorScheme];

  useEffect(() => {
    setExtraInput(extraDebtPayment.toString());
  }, [extraDebtPayment]);

  const activeDebts = useMemo(() => debts.filter((d) => d.currentBalance > 0.01), [debts]);

  const { plan, schedule } = useMemo(
    () => simulatePayoffSchedule(activeDebts, strategy, extraDebtPayment),
    [activeDebts, strategy, extraDebtPayment]
  );
  const altStrategy: DebtStrategy = strategy === "avalanche" ? "snowball" : "avalanche";
  const altPlan = useMemo(
    () => simulatePayoff(activeDebts, altStrategy, extraDebtPayment),
    [activeDebts, altStrategy, extraDebtPayment]
  );

  function commitExtraPayment() {
    const n = parseFloat(extraInput);
    onSetExtraDebtPayment(Number.isFinite(n) && n >= 0 ? n : 0);
  }

  // Whichever strategy actually wins on each metric — not necessarily the
  // one currently selected in the toggle above.
  const interestSavings = Math.abs(plan.totalInterest - altPlan.totalInterest);
  const cheaperStrategy: DebtStrategy = plan.totalInterest <= altPlan.totalInterest ? strategy : altStrategy;
  const monthsSavings = Math.abs(plan.months - altPlan.months);
  const fasterStrategy: DebtStrategy = plan.months <= altPlan.months ? strategy : altStrategy;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{t("analyticsTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("analyticsSubtitle")}</p>
      </div>

      {activeDebts.length === 0 ? (
        <Card className="rounded-2xl border-black/5 shadow-sm">
          <CardContent className="p-8 flex flex-col items-center text-center gap-2">
            <Landmark className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">{t("debtTipStart")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="rounded-2xl border-black/5 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-semibold text-sm">{t("strategyTitle")}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-md">{t("strategySubtitle")}</p>
                </div>
                <div className="flex items-center rounded-full border border-black/10 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setStrategy("avalanche")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      strategy === "avalanche" ? "bg-[#17171d] text-white" : "text-muted-foreground hover:bg-black/5"
                    )}
                  >
                    <Mountain className="h-3.5 w-3.5" /> {t("strategyAvalanche")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStrategy("snowball")}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                      strategy === "snowball" ? "bg-[#17171d] text-white" : "text-muted-foreground hover:bg-black/5"
                    )}
                  >
                    <Snowflake className="h-3.5 w-3.5" /> {t("strategySnowball")}
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {strategy === "avalanche" ? t("strategyAvalancheDesc") : t("strategySnowballDesc")}
              </p>

              <div className="grid gap-1.5 mt-4 max-w-xs">
                <Label htmlFor="extra-payment">{t("extraPaymentLabel")}</Label>
                <Input
                  id="extra-payment"
                  type="number"
                  min="0"
                  step="10"
                  value={extraInput}
                  onChange={(e) => {
                    setExtraInput(e.target.value);
                    const n = parseFloat(e.target.value);
                    if (Number.isFinite(n) && n >= 0) onSetExtraDebtPayment(n);
                  }}
                  onBlur={commitExtraPayment}
                />
              </div>
            </CardContent>
          </Card>

          {!plan.feasible && (
            <Card className="rounded-2xl border-black/5 shadow-sm" style={{ backgroundColor: "#FEE2E2" }}>
              <CardContent className="p-4 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#DC2626" }} />
                <p className="text-xs" style={{ color: "#DC2626" }}>
                  {t("payoffNotFeasible")}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-semibold text-sm">{t("debtDashboardTitle")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("debtDashboardSubtitle")}</p>
            </div>
            <ColorSchemeToggle value={debtColorScheme} onChange={onSetDebtColorScheme} />
          </div>

          <DebtDashboardTiles debts={activeDebts} plan={plan} palette={palette} lang={lang} />
          <DebtDashboardCharts debts={activeDebts} schedule={schedule} palette={palette} lang={lang} />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              icon={strategy === "avalanche" ? Mountain : Snowflake}
              label={t("statMonthsToDebtFreeLabel")}
              value={plan.feasible ? `${plan.months}` : "—"}
              sub={t("statMonthsToDebtFreeSub")}
              bg={statCardPalette[0].bg}
              fg={statCardPalette[0].fg}
            />
            <StatCard
              icon={Landmark}
              label={t("statDebtFreeDateLabel")}
              value={plan.feasible ? monthsToDateLabel(plan.months, lang) : "—"}
              sub={t("statDebtFreeDateSub")}
              bg={statCardPalette[1].bg}
              fg={statCardPalette[1].fg}
            />
            <StatCard
              icon={TrendingDown}
              label={t("statTotalInterestLabel")}
              value={formatRM(plan.totalInterest)}
              sub={t("statTotalInterestSub")}
              bg={statCardPalette[2].bg}
              fg={statCardPalette[2].fg}
            />
            <StatCard
              icon={Landmark}
              label={t("statMonthlyBudgetLabel")}
              value={formatRM(plan.monthlyBudget)}
              sub={t("statMonthlyBudgetSub")}
              bg={statCardPalette[3].bg}
              fg={statCardPalette[3].fg}
            />
          </div>

          <Card className="rounded-2xl border-black/5 shadow-sm">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm">{t("payoffOrderTitle")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("payoffOrderSubtitle")}</p>
              <div className="mt-4 divide-y divide-black/5">
                {plan.order.map((debt, i) => {
                  const month = plan.payoffMonth[debt.id];
                  const minPay = estimateMinPayment(debt);
                  const isEstimated = debt.minPayment === undefined;
                  return (
                    <div key={debt.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span
                        className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                        style={{ backgroundColor: "#F1F0FE", color: "#4B3A9E" }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{debt.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t(debtTypeLabelKey(debt.type))}
                          {debt.apr !== undefined ? ` · ${debt.apr}% APR` : ""}
                          {isEstimated ? ` · ${t("minPaymentEstimated", { amount: formatRMShort(minPay) })}` : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold tabular-nums">{formatRM(debt.currentBalance)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {month !== undefined
                            ? t("payoffInMonths", { n: month })
                            : t("payoffBeyondHorizon")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-black/5 shadow-sm">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm">{t("comparisonTitle")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("comparisonSubtitle")}</p>

              <div className="grid sm:grid-cols-2 gap-3 mt-4">
                {([strategy, altStrategy] as DebtStrategy[]).map((s) => {
                  const p = s === strategy ? plan : altPlan;
                  const isCurrent = s === strategy;
                  return (
                    <div
                      key={s}
                      className={cn(
                        "rounded-xl border p-4",
                        isCurrent ? "border-[#6d5bd0] bg-[#F1F0FE]" : "border-black/5 bg-[#FAFAF9]"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        {s === "avalanche" ? (
                          <Mountain className="h-3.5 w-3.5" style={{ color: "#4B3A9E" }} />
                        ) : (
                          <Snowflake className="h-3.5 w-3.5" style={{ color: "#4B3A9E" }} />
                        )}
                        <p className="text-xs font-semibold" style={{ color: "#4B3A9E" }}>
                          {t(s === "avalanche" ? "strategyAvalanche" : "strategySnowball")}
                          {isCurrent ? ` · ${t("comparisonSelected")}` : ""}
                        </p>
                      </div>
                      <p className="text-lg font-bold mt-2 tabular-nums">
                        {p.feasible ? t("payoffInMonths", { n: p.months }) : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                        {t("comparisonInterest", { amount: formatRMShort(p.totalInterest) })}
                      </p>
                    </div>
                  );
                })}
              </div>

              {plan.feasible && altPlan.feasible && (interestSavings > 0.5 || monthsSavings > 0) && (
                <div className="flex items-start gap-2 mt-4 rounded-xl p-3" style={{ backgroundColor: "#E8F5CE" }}>
                  <TrendingDown className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#4C7A17" }} />
                  <p className="text-xs" style={{ color: "#4C7A17" }}>
                    {interestSavings > 0.5
                      ? t("comparisonSavesInterest", {
                          strategy: t(cheaperStrategy === "avalanche" ? "strategyAvalanche" : "strategySnowball"),
                          amount: formatRMShort(interestSavings),
                        })
                      : t("comparisonSavesTime", {
                          strategy: t(fasterStrategy === "avalanche" ? "strategyAvalanche" : "strategySnowball"),
                          n: monthsSavings,
                        })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <PayoffScheduleTable plan={plan} schedule={schedule} palette={palette} lang={lang} />
        </>
      )}
    </div>
  );
}
