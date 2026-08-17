import { useEffect, useState } from "react";
import type { Bill, BillCategory } from "@/types";
import { useI18n } from "@/lib/i18n";
import { CATEGORY_ORDER, categoryLabelKey } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function BillFormModal({
  open,
  onOpenChange,
  onSave,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (bill: Bill) => void;
  initial?: Bill | null;
}) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<BillCategory>("utilities");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [recurring, setRecurring] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setCategory(initial?.category ?? "utilities");
      setAmount(initial?.amount?.toString() ?? "");
      setDueDate(initial?.dueDate ?? new Date().toISOString().slice(0, 10));
      setRecurring(initial?.recurring ?? true);
      setWhatsappNumber(initial?.whatsappNumber ?? "");
    }
  }, [open, initial]);

  function handleSave() {
    if (!name.trim() || !amount || !dueDate) return;
    onSave({
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      category,
      amount: parseFloat(amount),
      dueDate,
      recurring,
      paid: initial?.paid ?? false,
      whatsappNumber: whatsappNumber.trim() || undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        <div className="p-6">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground">{t("modalEyebrow")}</p>
          <h2 className="text-lg font-semibold mt-1">{initial ? t("editBillTitle") : t("addBillTitle")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("addBillSubtitle")}</p>

          <div className="grid gap-3.5 mt-5">
            <div className="grid gap-1.5">
              <Label htmlFor="bill-name">{t("fieldBillName")}</Label>
              <Input
                id="bill-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("fieldBillNamePlaceholder")}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>{t("fieldCategory")}</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as BillCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_ORDER.map((c) => (
                    <SelectItem key={c} value={c}>
                      {t(categoryLabelKey(c))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="bill-amount">{t("fieldAmount")}</Label>
                <Input
                  id="bill-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="bill-due">{t("fieldDueDate")}</Label>
                <Input id="bill-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="bill-wa">{t("fieldWhatsapp")}</Label>
              <Input
                id="bill-wa"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder={t("fieldWhatsappPlaceholder")}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              {t("fieldRecurring")}
            </label>
          </div>

          <Button onClick={handleSave} className="w-full mt-6 rounded-full h-11 bg-[#17171d] hover:bg-[#26262f]">
            {t("saveBill")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
