import { Fragment, useState } from "react";
import type { Lang } from "@/types";
import type { MonthlySchedule, PayoffPlan } from "@/lib/debtPayoff";
import { estimateMinPayment } from "@/lib/debtPayoff";
import type { DebtSchemePalette } from "@/lib/debtColorSchemes";
import { useI18n } from "@/lib/i18n";
import { formatRMShort } from "@/lib/bills";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { monthsToDateLabel } from "@/pages/Analytics";

const SCHEDULE_ROW_CAP = 360;
const ALL_DEBTS_KEY = "__all__";

export function PayoffScheduleTable({
  plan,
  schedule,
  palette,
  lang,
}: {
  plan: PayoffPlan;
  schedule: MonthlySchedule[];
  palette: DebtSchemePalette;
  lang: Lang;
}) {
  const { t } = useI18n();
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggleCell(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const rows = schedule.slice(0, SCHEDULE_ROW_CAP);
  const truncated = schedule.length > SCHEDULE_ROW_CAP;

  return (
    <Card className="rounded-2xl border-black/5 shadow-sm">
      <CardContent className="p-5">
        <h3 className="font-semibold text-sm">{t("scheduleTableTitle")}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{t("scheduleTableSubtitle")}</p>

        <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
          {plan.order.map((debt, i) => {
            const minPay = estimateMinPayment(debt);
            const payoffMonth = plan.payoffMonth[debt.id];
            return (
              <div
                key={debt.id}
                className="rounded-xl p-3.5 min-w-[180px] shrink-0"
                style={{ backgroundColor: palette.tiles[i % palette.tiles.length].bg }}
              >
                <p className="text-xs font-semibold truncate" style={{ color: palette.tiles[i % palette.tiles.length].fg }}>
                  {debt.name}
                </p>
                <div className="mt-2 space-y-1 text-[11px]" style={{ color: palette.tiles[i % palette.tiles.length].fg }}>
                  <p className="flex justify-between gap-3">
                    <span className="opacity-75">{t("scheduleStartingBalance")}</span>
                    <span className="font-medium tabular-nums">{formatRMShort(debt.currentBalance)}</span>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span className="opacity-75">{t("scheduleMinPayment")}</span>
                    <span className="font-medium tabular-nums">{formatRMShort(minPay)}</span>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span className="opacity-75">{t("scheduleInterestRate")}</span>
                    <span className="font-medium tabular-nums">{debt.apr ?? 0}%</span>
                  </p>
                  <p className="flex justify-between gap-3">
                    <span className="opacity-75">{t("scheduleProjectedPayoff")}</span>
                    <span className="font-medium">
                      {payoffMonth !== undefined ? monthsToDateLabel(payoffMonth, lang) : "—"}
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[10px]">{t("scheduleColMonth")}</TableHead>
                <TableHead className="text-[10px]" colSpan={3}>
                  {t("scheduleColAllDebts")}
                </TableHead>
                {plan.order.map((debt) => (
                  <TableHead key={debt.id} className="text-[10px]" colSpan={3}>
                    {debt.name}
                  </TableHead>
                ))}
              </TableRow>
              <TableRow>
                <TableHead className="text-[10px]"></TableHead>
                <TableHead className="text-[10px]"></TableHead>
                <TableHead className="text-[10px]">{t("scheduleColPayment")}</TableHead>
                <TableHead className="text-[10px]">{t("scheduleColBalance")}</TableHead>
                {plan.order.map((debt) => (
                  <Fragment key={debt.id}>
                    <TableHead className="text-[10px]"></TableHead>
                    <TableHead className="text-[10px]">{t("scheduleColPayment")}</TableHead>
                    <TableHead className="text-[10px]">{t("scheduleColBalance")}</TableHead>
                  </Fragment>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const monthLabel = monthsToDateLabel(row.month, lang);
                const allKey = `${ALL_DEBTS_KEY}:${row.month}`;
                return (
                  <TableRow key={row.month}>
                    <TableCell className="text-xs font-medium whitespace-nowrap">{monthLabel}</TableCell>
                    <TableCell>
                      <Checkbox
                        checked={checked.has(allKey)}
                        onCheckedChange={() => toggleCell(allKey)}
                        style={{ borderColor: palette.accent }}
                        aria-label={t("scheduleMarkPaidAria")}
                      />
                    </TableCell>
                    <TableCell className="text-xs tabular-nums whitespace-nowrap">{formatRMShort(row.totalPayment)}</TableCell>
                    <TableCell className="text-xs tabular-nums whitespace-nowrap">{formatRMShort(row.totalBalance)}</TableCell>
                    {row.debts.map((snap) => {
                      const key = `${snap.debtId}:${row.month}`;
                      return (
                        <Fragment key={key}>
                          <TableCell>
                            <Checkbox
                              checked={checked.has(key)}
                              onCheckedChange={() => toggleCell(key)}
                              style={{ borderColor: palette.accent }}
                              aria-label={t("scheduleMarkPaidAria")}
                            />
                          </TableCell>
                          <TableCell className="text-xs tabular-nums whitespace-nowrap">
                            {formatRMShort(snap.payment)}
                          </TableCell>
                          <TableCell className="text-xs tabular-nums whitespace-nowrap">
                            {formatRMShort(snap.balance)}
                          </TableCell>
                        </Fragment>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {truncated && (
          <p className="text-xs text-muted-foreground mt-3">{t("scheduleTruncatedNotice", { n: SCHEDULE_ROW_CAP })}</p>
        )}
        {!plan.feasible && <p className="text-xs text-muted-foreground mt-3">{t("payoffNotFeasible")}</p>}
      </CardContent>
    </Card>
  );
}
