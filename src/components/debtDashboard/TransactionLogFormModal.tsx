import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import type { Debt, DebtPayment } from "@/types";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TransactionLogFormModal({
  open,
  onOpenChange,
  onSave,
  onDelete,
  initial,
  debts,
  defaultDebtId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payment: DebtPayment) => void;
  onDelete: (payment: DebtPayment) => void;
  initial?: DebtPayment | null;
  debts: Debt[];
  defaultDebtId?: string;
}) {
  const { t } = useI18n();
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [debtId, setDebtId] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setDate(initial?.date ?? new Date().toISOString().slice(0, 10));
      setAmount(initial?.amount?.toString() ?? "");
      setDebtId(initial?.debtId ?? defaultDebtId ?? debts[0]?.id ?? "");
      setDescription(initial?.description ?? "");
    }
  }, [open, initial, defaultDebtId, debts]);

  function handleSave() {
    if (!amount || !date || !debtId) return;
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      debtId,
      date,
      amount: parseFloat(amount),
      description: description.trim() || undefined,
    });
    onOpenChange(false);
  }

  function handleDelete() {
    if (!initial) return;
    onDelete(initial);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        <div className="p-6">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground">{t("modalEyebrow")}</p>
          <h2 className="text-lg font-semibold mt-1">{initial ? t("editPayment") : t("logPayment")}</h2>

          <div className="grid gap-3.5 mt-5">
            <div className="grid gap-1.5">
              <Label>{t("fieldPaymentDebt")}</Label>
              <Select value={debtId} onValueChange={setDebtId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {debts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="payment-date">{t("fieldPaymentDate")}</Label>
                <Input id="payment-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="payment-amount">{t("fieldPaymentAmount")}</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="payment-desc">{t("fieldPaymentDescription")}</Label>
              <Input
                id="payment-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("fieldPaymentDescriptionPlaceholder")}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-6">
            {initial && (
              <Button
                variant="outline"
                onClick={handleDelete}
                className="rounded-full h-11 w-11 shrink-0 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                aria-label={t("deletePayment")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={debts.length === 0}
              className="flex-1 rounded-full h-11 bg-[#17171d] hover:bg-[#26262f]"
            >
              {t("logPayment")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
