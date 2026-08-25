import { Wallet, TrendingDown, PiggyBank, CalendarClock, Trophy } from "lucide-react";
import type { Debt, Lang } from "@/types";
import type { PayoffPlan } from "@/lib/debtPayoff";
import type { DebtSchemePalette } from "@/lib/debtColorSchemes";
import { useI18n } from "@/lib/i18n";
import { formatRM } from "@/lib/bills";
import { totalDebtSummary } from "@/lib/debts";
import { StatCard } from "@/components/StatCard";
import { monthsToDateLabel } from "@/pages/Analytics";

export function DebtDashboardTiles({
  debts,
  plan,
  palette,
  lang,
}: {
  debts: Debt[];
  plan: PayoffPlan;
  palette: DebtSchemePalette;
  lang: Lang;
}) {
  const { t } = useI18n();
  const summary = totalDebtSummary(debts);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      <StatCard
        icon={Wallet}
        label={t("statStartingDebtLabel")}
        value={formatRM(summary.originalTotal)}
        sub={t("statStartingDebtSub")}
        bg={palette.tiles[0].bg}
        fg={palette.tiles[0].fg}
      />
      <StatCard
        icon={TrendingDown}
        label={t("statCurrentDebtLabel")}
        value={formatRM(summary.balanceTotal)}
        sub={t("statCurrentDebtSub")}
        bg={palette.tiles[1].bg}
        fg={palette.tiles[1].fg}
      />
      <StatCard
        icon={PiggyBank}
        label={t("statTotalPaidLabel")}
        value={formatRM(summary.paidOff)}
        sub={t("statTotalPaidSub")}
        bg={palette.tiles[2].bg}
        fg={palette.tiles[2].fg}
      />
      <StatCard
        icon={CalendarClock}
        label={t("statMonthsToDebtFreeLabel")}
        value={plan.feasible ? `${plan.months}` : "—"}
        sub={t("statMonthsToDebtFreeSub")}
        bg={palette.tiles[3].bg}
        fg={palette.tiles[3].fg}
      />
      <StatCard
        icon={Trophy}
        label={t("statDebtFreeDateLabel")}
        value={plan.feasible ? monthsToDateLabel(plan.months, lang) : "—"}
        sub={t("statDebtFreeDateSub")}
        bg={palette.tiles[4].bg}
        fg={palette.tiles[4].fg}
      />
    </div>
  );
}
