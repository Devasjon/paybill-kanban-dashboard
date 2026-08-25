import { useEffect, useState } from "react";
import type { Debt, DebtType } from "@/types";
import { useI18n } from "@/lib/i18n";
import { DEBT_TYPE_ORDER, debtTypeLabelKey } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DebtFormModal({
  open,
  onOpenChange,
  onSave,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (debt: Debt) => void;
  initial?: Debt | null;
}) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [type, setType] = useState<DebtType>("creditCard");
  const [originalAmount, setOriginalAmount] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [apr, setApr] = useState("");
  const [minPayment, setMinPayment] = useState("");
  const [isBalanceTransfer, setIsBalanceTransfer] = useState(false);
  const [balanceTransferMonths, setBalanceTransferMonths] = useState("");
  const [balanceTransferAmount, setBalanceTransferAmount] = useState("");
  const [balanceTransferEndDate, setBalanceTransferEndDate] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setType(initial?.type ?? "creditCard");
      setOriginalAmount(initial?.originalAmount?.toString() ?? "");
      setCurrentBalance(initial?.currentBalance?.toString() ?? "");
      setApr(initial?.apr?.toString() ?? "");
      setMinPayment(initial?.minPayment?.toString() ?? "");
      setIsBalanceTransfer(initial?.isBalanceTransfer ?? false);
      setBalanceTransferMonths(initial?.balanceTransferMonths?.toString() ?? "");
      setBalanceTransferAmount(initial?.balanceTransferAmount?.toString() ?? "");
      setBalanceTransferEndDate(initial?.balanceTransferEndDate ?? "");
    }
  }, [open, initial]);

  function handleSave() {
    if (!name.trim() || !originalAmount || !currentBalance) return;
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      type,
      originalAmount: parseFloat(originalAmount),
      currentBalance: parseFloat(currentBalance),
      apr: apr ? parseFloat(apr) : undefined,
      minPayment: minPayment ? parseFloat(minPayment) : undefined,
      isBalanceTransfer: type === "creditCard" && isBalanceTransfer,
      balanceTransferMonths:
        type === "creditCard" && isBalanceTransfer && balanceTransferMonths
          ? parseFloat(balanceTransferMonths)
          : undefined,
      balanceTransferAmount:
        type === "creditCard" && isBalanceTransfer && balanceTransferAmount
          ? parseFloat(balanceTransferAmount)
          : undefined,
      balanceTransferEndDate:
        type === "creditCard" && isBalanceTransfer && balanceTransferEndDate ? balanceTransferEndDate : undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        <div className="p-6">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground">{t("modalEyebrow")}</p>
          <h2 className="text-lg font-semibold mt-1">{initial ? t("editDebt") : t("addDebtTitle")}</h2>

          <div className="grid gap-3.5 mt-5">
            <div className="grid gap-1.5">
              <Label htmlFor="debt-name">{t("fieldDebtName")}</Label>
              <Input
                id="debt-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("fieldDebtNamePlaceholder")}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("fieldDebtType")}</Label>
              <Select value={type} onValueChange={(v) => setType(v as DebtType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEBT_TYPE_ORDER.map((dt) => (
                    <SelectItem key={dt} value={dt}>
                      {t(debtTypeLabelKey(dt))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="debt-original">{t("fieldOriginalAmount")}</Label>
                <Input
                  id="debt-original"
                  type="number"
                  min="0"
                  step="0.01"
                  value={originalAmount}
                  onChange={(e) => setOriginalAmount(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="debt-balance">{t("fieldCurrentBalance")}</Label>
                <Input
                  id="debt-balance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="debt-apr">{t("fieldApr")}</Label>
                <Input id="debt-apr" type="number" min="0" step="0.01" value={apr} onChange={(e) => setApr(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="debt-min">{t("fieldMinPayment")}</Label>
                <Input
                  id="debt-min"
                  type="number"
                  min="0"
                  step="0.01"
                  value={minPayment}
                  onChange={(e) => setMinPayment(e.target.value)}
                />
              </div>
            </div>

            {type === "creditCard" && (
              <div className="rounded-xl border border-black/10 p-3.5">
                <label className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{t("fieldIsBalanceTransfer")}</span>
                  <Switch checked={isBalanceTransfer} onCheckedChange={setIsBalanceTransfer} />
                </label>

                {isBalanceTransfer && (
                  <div className="grid gap-3 mt-3.5">
                    <div className="grid gap-1.5">
                      <Label htmlFor="debt-bt-amount">{t("fieldBalanceTransferAmount")}</Label>
                      <Input
                        id="debt-bt-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={balanceTransferAmount}
                        onChange={(e) => setBalanceTransferAmount(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="debt-bt-months">{t("fieldBalanceTransferMonths")}</Label>
                        <Input
                          id="debt-bt-months"
                          type="number"
                          min="0"
                          step="1"
                          value={balanceTransferMonths}
                          onChange={(e) => setBalanceTransferMonths(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="debt-bt-end">{t("fieldBalanceTransferEndDate")}</Label>
                        <Input
                          id="debt-bt-end"
                          type="date"
                          value={balanceTransferEndDate}
                          onChange={(e) => setBalanceTransferEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button onClick={handleSave} className="w-full mt-6 rounded-full h-11 bg-[#17171d] hover:bg-[#26262f]">
            {t("saveDebt")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
