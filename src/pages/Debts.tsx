import { useState } from "react";
import type { Debt, DebtColorScheme, DebtPayment } from "@/types";
import { useI18n } from "@/lib/i18n";
import { debtPaidOffPercent, totalDebtSummary } from "@/lib/debts";
import { formatRM, formatRMShort } from "@/lib/bills";
import { debtTypeLabelKey } from "@/lib/labels";
import { debtColorSchemes } from "@/lib/debtColorSchemes";
import { formatDate } from "@/lib/bills";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Landmark, ReceiptText, ArrowLeftRight } from "lucide-react";
import { ColorSchemeToggle } from "@/components/debtDashboard/ColorSchemeToggle";
import { TransactionLogTable } from "@/components/debtDashboard/TransactionLogTable";
import { TransactionLogFormModal } from "@/components/debtDashboard/TransactionLogFormModal";

export function Debts({
  debts,
  onOpenAddDebt,
  onEdit,
  onDelete,
  debtColorScheme,
  onSetDebtColorScheme,
  debtPayments,
  onSaveDebtPayment,
  onDeleteDebtPayment,
}: {
  debts: Debt[];
  onOpenAddDebt: () => void;
  onEdit: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
  debtColorScheme: DebtColorScheme;
  onSetDebtColorScheme: (scheme: DebtColorScheme) => void;
  debtPayments: DebtPayment[];
  onSaveDebtPayment: (payment: DebtPayment) => void;
  onDeleteDebtPayment: (payment: DebtPayment) => void;
}) {
  const { t, lang } = useI18n();
  const summary = totalDebtSummary(debts);
  const palette = debtColorSchemes[debtColorScheme];

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<DebtPayment | null>(null);

  function openAddPayment() {
    setEditingPayment(null);
    setPaymentModalOpen(true);
  }

  function openEditPayment(payment: DebtPayment) {
    setEditingPayment(payment);
    setPaymentModalOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">{t("myDebtsTitle")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("myDebtsSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ColorSchemeToggle value={debtColorScheme} onChange={onSetDebtColorScheme} />
          <Button onClick={onOpenAddDebt} className="rounded-full h-10 px-5 bg-[#17171d] hover:bg-[#26262f] gap-1.5">
            <Plus className="h-4 w-4" />
            {t("addDebt")}
          </Button>
        </div>
      </div>

      {debts.length > 0 && (
        <Card className="rounded-2xl border-black/5 shadow-sm" style={{ backgroundColor: "#F1F0FE" }}>
          <CardContent className="p-5">
            <div className="flex items-end justify-between flex-wrap gap-3">
              <div>
                <p className="text-xs font-medium" style={{ color: "#4B3A9E", opacity: 0.85 }}>
                  {t("totalDebtSummary")}
                </p>
                <p className="text-2xl font-bold mt-1" style={{ color: "#4B3A9E" }}>
                  {formatRM(summary.balanceTotal)}
                </p>
              </div>
              <p className="text-sm font-semibold" style={{ color: "#4B3A9E" }}>
                {t("debtProgressPercent", { n: summary.percent })}
              </p>
            </div>
            <div className="h-2 rounded-full bg-white/60 mt-3 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${summary.percent}%`, backgroundColor: "#6d5bd0" }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: "#4B3A9E", opacity: 0.75 }}>
              {formatRMShort(summary.paidOff)} / {formatRMShort(summary.originalTotal)}
            </p>
          </CardContent>
        </Card>
      )}

      {debts.length === 0 ? (
        <Card className="rounded-2xl border-black/5 shadow-sm">
          <CardContent className="p-8 flex flex-col items-center text-center gap-2">
            <Landmark className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground">{t("noDebtsYet")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {debts.map((debt) => {
            const percent = debtPaidOffPercent(debt);
            return (
              <Card key={debt.id} className="rounded-2xl border-black/5 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{debt.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t(debtTypeLabelKey(debt.type))}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(debt)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onDelete(debt)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-4">
                    <p className="text-xl font-bold tabular-nums">{formatRM(debt.currentBalance)}</p>
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("debtPaidOffPercent", { n: percent })}
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-black/5 mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${percent}%`, backgroundColor: "#6d5bd0" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 tabular-nums">
                    {t("debtBalanceOfOriginal", {
                      balance: debt.currentBalance.toLocaleString("en-MY"),
                      original: debt.originalAmount.toLocaleString("en-MY"),
                    })}
                  </p>

                  {(debt.apr !== undefined || debt.minPayment !== undefined) && (
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-black/5">
                      {debt.apr !== undefined && (
                        <div>
                          <p className="text-[10px] text-muted-foreground">APR</p>
                          <p className="text-xs font-semibold">{debt.apr}%</p>
                        </div>
                      )}
                      {debt.minPayment !== undefined && (
                        <div>
                          <p className="text-[10px] text-muted-foreground">Min.</p>
                          <p className="text-xs font-semibold">{formatRM(debt.minPayment)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {debt.isBalanceTransfer && (
                    <div className="mt-3 pt-3 border-t border-black/5 space-y-1.5">
                      <Badge className="text-[10px] font-medium border-none bg-[#FEF3C7] text-[#92600B] gap-1">
                        <ArrowLeftRight className="h-3 w-3" />
                        {t("balanceTransferBadge")}
                      </Badge>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                        {debt.balanceTransferAmount !== undefined && (
                          <span>{t("balanceTransferAmountLabel", { amount: formatRM(debt.balanceTransferAmount) })}</span>
                        )}
                        {debt.balanceTransferMonths !== undefined && (
                          <span>{t("balanceTransferMonthsLabel", { n: debt.balanceTransferMonths })}</span>
                        )}
                        {debt.balanceTransferEndDate && (
                          <span>
                            {t("balanceTransferEndsLabel", { date: formatDate(debt.balanceTransferEndDate, lang) })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="rounded-2xl border-black/5 shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-semibold text-sm">{t("transactionLogTitle")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("transactionLogSubtitle")}</p>
            </div>
            <Button
              onClick={openAddPayment}
              disabled={debts.length === 0}
              variant="outline"
              className="rounded-full h-9 text-xs gap-1.5"
              style={{ borderColor: palette.accent, color: palette.accent }}
            >
              <ReceiptText className="h-3.5 w-3.5" />
              {t("addPayment")}
            </Button>
          </div>
          <TransactionLogTable payments={debtPayments} debts={debts} onEdit={openEditPayment} palette={palette} />
        </CardContent>
      </Card>

      <TransactionLogFormModal
        open={paymentModalOpen}
        onOpenChange={setPaymentModalOpen}
        onSave={onSaveDebtPayment}
        onDelete={onDeleteDebtPayment}
        initial={editingPayment}
        debts={debts}
      />
    </div>
  );
}
