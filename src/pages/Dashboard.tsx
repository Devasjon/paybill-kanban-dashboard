import { useMemo } from "react";
import type { Bill, Debt } from "@/types";
import { useI18n } from "@/lib/i18n";
import { billStatus, daysUntil, formatRM } from "@/lib/bills";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/StatCard";
import { BillRow } from "@/components/BillRow";
import { RemindersPanel } from "@/components/RemindersPanel";
import { DebtProgressPanel } from "@/components/DebtProgressPanel";
import { FileText, AlertTriangle, CheckCircle2, TrendingUp, Plus, ScanLine } from "lucide-react";
import { statCardPalette } from "@/lib/theme";

export function Dashboard({
  bills,
  debts,
  onMarkPaid,
  onOpenAddBill,
  onOpenScanReceipt,
  onGoToBills,
  onGoToCalendar,
  debtDeltaThisMonth,
  paidDebtThisMonth,
}: {
  bills: Bill[];
  debts: Debt[];
  onMarkPaid: (bill: Bill) => void;
  onOpenAddBill: () => void;
  onOpenScanReceipt: () => void;
  onGoToBills: () => void;
  onGoToCalendar: () => void;
  debtDeltaThisMonth: number;
  paidDebtThisMonth: number;
}) {
  const { t } = useI18n();

  const greetingKey = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "greetingMorning";
    if (h < 15) return "greetingAfternoon";
    if (h < 19) return "greetingEvening";
    return "greetingNight";
  }, []);

  const unpaid = bills.filter((b) => !b.paid);
  const overdue = unpaid.filter((b) => billStatus(b) === "overdue");
  const paidThisMonth = bills.filter((b) => b.paid);
  const totalDebt = debts.reduce((s, d) => s + d.currentBalance, 0);

  const upcomingList = [...bills].sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate)).slice(0, 5);

  const dateLine = new Date()
    .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    .toUpperCase();

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground">{dateLine}</p>
          <h2 className="text-2xl font-bold mt-1">
            {t(greetingKey)}, Gaya <span aria-hidden>👋</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t("dashboardSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onOpenScanReceipt}
            className="rounded-full h-10 px-5 gap-1.5"
          >
            <ScanLine className="h-4 w-4" />
            {t("scanReceipt")}
          </Button>
          <Button onClick={onOpenAddBill} className="rounded-full h-10 px-5 bg-[#17171d] hover:bg-[#26262f] gap-1.5">
            <Plus className="h-4 w-4" />
            {t("addNewBill")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={FileText}
          label={t("statTotalUnpaidLabel")}
          value={formatRM(unpaid.reduce((s, b) => s + b.amount, 0))}
          sub={t("statTotalUnpaidSub", { n: unpaid.length })}
          bg={statCardPalette[0].bg}
          fg={statCardPalette[0].fg}
        />
        <StatCard
          icon={AlertTriangle}
          label={t("statLatePaymentLabel")}
          value={formatRM(overdue.reduce((s, b) => s + b.amount, 0))}
          sub={overdue.length > 0 ? t("statLatePaymentSub", { n: overdue.length }) : t("statLatePaymentSubZero")}
          bg={statCardPalette[1].bg}
          fg={statCardPalette[1].fg}
        />
        <StatCard
          icon={CheckCircle2}
          label={t("statPaidThisMonthLabel")}
          value={formatRM(paidThisMonth.reduce((s, b) => s + b.amount, 0))}
          sub={t("statPaidThisMonthSub", { n: paidThisMonth.length })}
          bg={statCardPalette[2].bg}
          fg={statCardPalette[2].fg}
        />
        <StatCard
          icon={TrendingUp}
          label={t("statTotalDebtLabel")}
          value={formatRM(totalDebt)}
          sub={
            debtDeltaThisMonth > 0
              ? t("statTotalDebtSubDown", { n: Math.round(debtDeltaThisMonth) })
              : debtDeltaThisMonth < 0
              ? t("statTotalDebtSubUp", { n: Math.round(-debtDeltaThisMonth) })
              : t("statTotalDebtSubFlat")
          }
          bg={statCardPalette[3].bg}
          fg={statCardPalette[3].fg}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 rounded-2xl border-black/5 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-sm">{t("upcomingBillsTitle")}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t("upcomingBillsSubtitle")}</p>
              </div>
              <button
                type="button"
                onClick={onGoToBills}
                className="text-xs font-medium text-[#6d5bd0] hover:underline shrink-0"
              >
                {t("viewAll")} →
              </button>
            </div>
            <div className="mt-3 divide-y divide-black/5">
              {upcomingList.length === 0 && <p className="text-sm text-muted-foreground py-4">{t("noBillsFound")}</p>}
              {upcomingList.map((bill) => (
                <BillRow key={bill.id} bill={bill} onMarkPaid={onMarkPaid} showActions />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <RemindersPanel bills={bills} onOpenCalendar={onGoToCalendar} />
          <DebtProgressPanel debts={debts} paidThisMonth={paidDebtThisMonth} />
        </div>
      </div>
    </div>
  );
}
