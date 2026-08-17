import type { Debt } from "@/types";
import { useI18n } from "@/lib/i18n";
import { totalDebtSummary } from "@/lib/debts";
import { formatRMShort } from "@/lib/bills";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, MoreHorizontal } from "lucide-react";

export function DebtProgressPanel({ debts, paidThisMonth }: { debts: Debt[]; paidThisMonth: number }) {
  const { t } = useI18n();
  const summary = totalDebtSummary(debts);

  return (
    <Card className="rounded-2xl border-black/5 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-sm">{t("debtProgressTitle")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{t("debtProgressSubtitle")}</p>
          </div>
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </div>

        {debts.length === 0 ? (
          <p className="text-xs text-muted-foreground mt-4">{t("debtTipStart")}</p>
        ) : (
          <>
            <div className="flex items-end justify-between mt-4">
              <p className="text-2xl font-bold">{t("debtProgressPercent", { n: summary.percent })}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatRMShort(summary.paidOff)} / {formatRMShort(summary.originalTotal)}
              </p>
            </div>
            <div className="h-2 rounded-full bg-black/5 mt-2 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${summary.percent}%`, backgroundColor: "#6d5bd0" }}
              />
            </div>

            {paidThisMonth > 0 && (
              <div className="rounded-xl p-3 mt-4" style={{ backgroundColor: "#F1F0FE" }}>
                <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: "#4B3A9E" }}>
                  <Sparkles className="h-3.5 w-3.5" /> {t("debtTipGood")}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#4B3A9E", opacity: 0.85 }}>
                  {t("debtTipPaid", { amount: formatRMShort(paidThisMonth).replace("RM", "") })}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
